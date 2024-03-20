from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import asyncpg
import asyncio
from starlette.requests import Request
from datetime import datetime
import os
import logging
from request_schemas import IdsInput, PricesByCategoryInput

# Set up logging
logging.basicConfig(level=logging.INFO)
logging.info("Starting up")


# Get the password from the environment
postgres_password = os.environ.get("POSTGRES_PASSWORD")
logging.info(f"Got password from environment variables: {postgres_password is not None}")


app = FastAPI()
router = APIRouter(prefix="/api")

# Initialize the cache
data = {}


visiter_ips = []
visiters = set()

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the connection pool
@app.on_event("startup")
async def startup():
    logging.info("Connecting to database")

    app.state.pool = await asyncpg.create_pool(
        host="db",  # Adjust if your DB is hosted elsewhere
        port=5432,
        user="postgres",
        password=postgres_password,
        database="inflation",
    )
    logging.info("Connected to database")

    await update_cache()


# Close the connection pool
@app.on_event("shutdown")
async def shutdown():
    logging.info("Closing connection pool")
    await app.state.pool.close()
    logging.info("Connection pool closed")


# Dependency to get a connection from the pool
async def get_connection(request: Request):
    async with request.app.state.pool.acquire() as connection:
        yield connection


@router.post("/count_ids")
async def count_ids(input_data: IdsInput):
    result = {}

    for item_id in input_data.ids:
        result[item_id] = data["counts"].get(item_id, 0)

    return result


async def update_counts():
    counts = {}
    async with app.state.pool.acquire() as conn:
        counts["restaurants"] = await conn.fetchval("select count(distinct store_id) from bk_restaurants")
        counts["menuitems"] = await conn.fetchval("SELECT COUNT(*) FROM bk_menuitems WHERE created_date = (SELECT MIN(created_date) FROM bk_menuitems)")
        counts["visits"] = await conn.fetchval("SELECT COUNT(*) FROM website_visits")

    data["counts"] = counts


async def average_prices_by_day() -> Dict[str, List]:
    async with app.state.pool.acquire() as conn:
        # Get unique dates
        dates = await conn.fetch("SELECT DISTINCT created_date FROM bk_menuitems ORDER BY created_date")

        # For each date, calculate the average price of menu items
        avg_prices = []
        for record in dates:
            avg_price = await conn.fetchval(
                "SELECT AVG(price_default) FROM bk_menuitems WHERE created_date = $1",
                record['created_date']
            )
            avg_prices.append(avg_price)

        # Format the result as an object with x: list of days, y: list of average prices
        result = {
            "x": [record['created_date'].isoformat() for record in dates],
            "y": avg_prices
        }

        return result
    

async def distinct_created_dates() -> List[str]:
    async with app.state.pool.acquire() as conn:
        # Execute the query and fetch the results
        records = await conn.fetch("SELECT DISTINCT(created_date) FROM bk_menuitems")

        # Extract the created_date values from the records
        dates = [record['created_date'].isoformat() for record in records]

        return dates
    

async def get_average_prices_by_category(date_str: str) -> Dict[str, List]:
    # Parse the input date string into a datetime.date object
    date = datetime.strptime(date_str, "%Y-%m-%d").date()

    async with app.state.pool.acquire() as conn:
        # Execute the query and fetch the results
        records = await conn.fetch(
            """
            SELECT
                avg(bm.price_default),
                bi.category,
                br.state
            FROM
                public.bk_menuitems bm
            join
                public.bk_items bi on bm.item_id = bi.item_id
            join
                public.bk_restaurants br on bm.store_id = br.store_id
            where
                bm.created_date = $1
            group by
                br.state, bi.category;
            """,
            date  # Pass the datetime.date object to the query
        )

        result = {}

        for record in records:
            state = record['state']
            category = record['category']
            price = record['avg']

            result[f"{state},{category}"] = price


        return result


@router.post("/prices_by_category")
async def get_prices_by_category(input_data: PricesByCategoryInput):
    logging.info(f"Getting prices by category for {input_data.start_date} to {input_data.end_date}")
    result = {}
    average_prices = data["average_prices_by_category"]
    dates = sorted(average_prices.keys())

    start = input_data.start_date if input_data.start_date in dates else dates[0]
    end = input_data.end_date if input_data.end_date in dates else dates[-1]
    
    result[start] = average_prices[start]
    result[end] = average_prices[end]

    logging.info(f"Got prices for {start} and {end}")

    return result


@router.get("/visit")
async def log_visit(request: Request):
    client_ip = request.client.host
    visit_time = datetime.now()
    user_agent = request.headers.get("User-Agent")
    referrer = request.headers.get("Referer")

    data["counts"]["visits"] += 1

    # don't need to track people just refreshing the page
    if client_ip in visiters:

        return {
            "message": "Visit already logged",
            "client_ip": client_ip,
            "timestamp": visit_time,
            "user_agent": user_agent,
            "referrer": referrer
        }
    
    visiters.add(client_ip)
    visiter_ips.append(client_ip)
    if len(visiter_ips) > 100:
        # pop the oldest visitor
        out = visiters.pop(0)
        visiter_ips.remove(out)
    
    async with app.state.pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO website_visits (client_ip, visit_time, user_agent, referrer)
            VALUES ($1, $2, $3, $4)
            """,
            client_ip,
            visit_time,
            user_agent,
            referrer
        )

    return {
        "message": "Visit logged",
        "client_ip": client_ip,
        "timestamp": visit_time,
        "user_agent": user_agent,
        "referrer": referrer
    }


async def update_cache():
    """Update the cache with the latest data from the database. This function is called on startup and can also be called manually."""
    logging.info("Updating cache")

    # Update the counts
    await update_counts()
    logging.info("Counts updated")

    # Update the average prices by day
    average_price_by_day = await average_prices_by_day()
    data["average_price_by_day"] = average_price_by_day
    logging.info("Average prices by day updated")

    dates = await distinct_created_dates()
    data["dates"] = dates
    logging.info(f"Dates updated - {len(dates)} dates found")

    data["average_prices_by_category"] = {}

    for date in dates:
        data["average_prices_by_category"][date] = await get_average_prices_by_category(date)
        logging.info(f"Average prices for {date} updated")

    average_meal_price_by_day = await get_average_meal_price_by_day()
    data["average_meal_price_by_day"] = average_meal_price_by_day
    logging.info("Average meal price by day updated")

    logging.info("Cache updated")


@router.get("/get_data")
async def get_data(request: Request):
    """
    The request should contain a key.  Return the value associated with that key from the cache.
    
    """
    key = request.query_params.get("key")

    if key is None:
        return {"error": "No key provided"}

    if key in data:
        return {key: data[key]}
    else:
        return {"error": "Key not found"}
    

@router.get("/update")
async def update(request: Request):
    asyncio.create_task(update_cache())
    return {"message": "Cache updated"}


@router.get("/average_price_by_day")
async def get_average_prices_by_day(request: Request):
    return data["average_price_by_day"]


@router.get("/average_meal_price_by_day")
async def get_average_meal_price_by_day(request: Request):
    return data["average_meal_price_by_day"]


@router.get("/get_distinct_dates")
async def get_distinct_dates(request: Request):
    return data["dates"]


async def get_average_meal_price_by_day() -> Dict[str, List]:
    async with app.state.pool.acquire() as conn:
        # Execute the query to get the average meal price for each date
        records = await conn.fetch("""
            SELECT created_date, SUM(avg_price) AS total_avg_price
            FROM (
                SELECT item_id, created_date, AVG(price_default) AS avg_price
                FROM bk_menuitems
                WHERE item_id IN ('bd47eecb-0540-4132-b49c-da086789f17b', 'item_781', 'e25ae714-ff81-4d54-922d-d4b7fd40e1e6')
                GROUP BY item_id, created_date
            ) AS subquery
            GROUP BY created_date
            ORDER BY created_date;
        """)

        # Format the result as an object with x: list of days, y: list of average meal prices
        result = {
            "x": [record['created_date'].isoformat() for record in records],
            "y": [record['total_avg_price'] for record in records]
        }

        return result


app.include_router(router)
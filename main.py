from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import asyncpg
import asyncio
from starlette.requests import Request
from datetime import datetime
import os

# Get the password from the environment
postgres_password = os.environ.get("POSTGRES_PASSWORD", "postgres123")

class IdsInput(BaseModel):
    ids: List[str]


class PricesByCategoryInput(BaseModel):
    start_date: str
    end_date: str


app = FastAPI()
router = APIRouter(prefix="/api")

counts = {}

data = {}

visiter_ips = []
visiters = set()

category_inflation_data = {}

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
    app.state.pool = await asyncpg.create_pool(
        host="db",  # Adjust if your DB is hosted elsewhere
        port=5432,
        user="postgres",
        password=postgres_password,
        database="inflation"  # Adjust if you're using a different database
    )

    update_cache()



# Close the connection pool
@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

# Dependency to get a connection from the pool
async def get_connection(request: Request):
    async with request.app.state.pool.acquire() as connection:
        yield connection

@router.get("/")
def read_root():
    return {"message": "Hello, World!"}

@router.post("/count_ids")
async def count_ids(input_data: IdsInput):
    try:
        # Get the connection from the pool
        result = {}

        for id in input_data.ids:
            result[id] = counts.get(id, "<Not found>")

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/average_price_by_day")
async def get_average_price_by_day():
    return data["average_price_by_day"]


async def update_counts():
    async with app.state.pool.acquire() as conn:
        counts["restaurants"] = await conn.fetchval("select count(*) from bk_restaurants")
        counts["menuitems"] = await conn.fetchval("SELECT COUNT(*) FROM bk_menuitems WHERE created_date = (SELECT MAX(created_date) FROM bk_menuitems)")
        counts["visits"] = await conn.fetchval("SELECT COUNT(*) FROM website_visits")


async def get_average_prices_by_day() -> Dict[str, List]:
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
    
async def get_distinct_created_dates() -> List[str]:
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
    result = {}

    # get the date closest to the start date without being before it
    true_start = None
    for date in category_inflation_data:
        if date >= input_data.start_date and (true_start is None or date < true_start):
            true_start = date

    # get the date closest to the end date without being after it
    true_end = None
    for date in category_inflation_data:
        if date <= input_data.end_date and (true_end is None or date > true_end):
            true_end = date

    result[true_start] = category_inflation_data[true_start]
    result[true_end] = category_inflation_data[true_end]

    return result

@router.get("/visit")
async def log_visit(request: Request):
    client_ip = request.client.host
    visit_time = datetime.now()
    user_agent = request.headers.get("User-Agent")
    referrer = request.headers.get("Referer")

    counts["visits"] += 1

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
    # Update the counts
    await update_counts()
    print("Counts updated")

    # Update the average prices by day
    average_price_by_day = await get_average_prices_by_day()
    data["average_price_by_day"] = average_price_by_day

    print("Average prices by day updated")

    dates = await get_distinct_created_dates()
    print("Distinct created dates fetched")

    for date in dates:
        category_inflation_data[date] = await get_average_prices_by_category(date)
        print(f"Category inflation data for {date} fetched")

    print("Cache updated")


@router.get("/update")
async def update(request: Request):
    asyncio.create_task(update_cache())
    return {"message": "Cache updated"}


app.include_router(router)
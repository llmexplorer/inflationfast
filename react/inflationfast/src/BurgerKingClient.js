// BurgerKingClient.js
const bkc = {
    getUrl: () => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        const fullHost = window.location.host;

        // if hostname ends in :3000, we are in development mode
        if (fullHost.endsWith(":3000")) {
            return "https://localhost/api"
        }

        return protocol + "//" + hostname + "/api";
    },
    getAveragePricesByDay: (success, failure) => {
        fetch(bkc.getUrl() + "/average_price_by_day")
            .then(response => response.json())
            .then(success)
            .catch(failure);
    },
    getData: (key, success, failure) => {
        // get get_data endpoint with key as the parameter
        fetch(bkc.getUrl() + "/get_data?key=" + key)
            .then(response => response.json())
            .then(success)
            .catch(failure);
    },
    countIds: (ids, success, failure) => {
        fetch(bkc.getUrl() + "/count_ids", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ids: ids})
        })
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
    getAveragePricesByCategory: (start, end, success, failure) => {
        /*
            class PricesByCategoryInput(BaseModel):
            start_date: str
            end_date: str
        */
        fetch(bkc.getUrl() + "/prices_by_category", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({start_date: start, end_date: end})
        })
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
    visit: () => {
        fetch(bkc.getUrl() + "/visit", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.text())
        .then(() => {})
        .catch(console.error);
    },
    getAvailableDates: (success, failure) => {
        fetch(bkc.getUrl() + "/get_distinct_dates")
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
    getAverageMealPriceByDay: (success, failure) => {
        fetch(bkc.getUrl() + "/average_meal_price_by_day")
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
    getCostPerCalorieOverTime: (itemId, success, failure) => {
        fetch(bkc.getUrl() + "/get_cost_per_calorie", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({item_id: itemId})
        })
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
    getItems: (success, failure) => {
        fetch(bkc.getUrl() + "/get_items")
        .then(response => response.json())
        .then(success)
        .catch(failure);
    },
};

export default bkc;

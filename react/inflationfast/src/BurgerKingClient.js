// BurgerKingClient.js
const bkc = {
    getUrl: () => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

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
        .then(console.log)
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
    }
};

export default bkc;

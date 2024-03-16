

const bkc = {
    getUrl: function() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        return protocol + "//" + hostname + "/api";
    },
    getAveragePricesByDay: function(success, failure) {
        fetch(this.getUrl() + "/average_price_by_day")
            .then(response => response.json())
            .then(success)
            .catch(failure);
    },
    helloWorld: function(success, failure) {
        fetch(this.getUrl())
            .then(response => response.text())
            .then(success)
            .catch(failure);
    },
    countIds: function(ids, success, failure) {
        fetch(this.getUrl() + "/count_ids", {
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
    getAveragePricesByCategory: function(start, end, success, failure) {
        /*
            class PricesByCategoryInput(BaseModel):
            start_date: str
            end_date: str
        */
        fetch(this.getUrl() + "/prices_by_category", {
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
    visit: function() {
        fetch(this.getUrl() + "/visit", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.text())
        .then(console.log)
        .catch(console.error);
    }
}


var plotlyReady = typeof Plotly !== 'undefined';
var domReady = document.readyState !== 'loading';

function onDomReady() {
    domReady = true;
    if (plotlyReady) {
        main();
    }
}

function onPlotlyReady() {
    plotlyReady = true;
    if (domReady) {
        main();
    }
}

if (domReady) {
    onDomReady();
} else {
    document.addEventListener('DOMContentLoaded', onDomReady);
}

if (plotlyReady) {
    onPlotlyReady();
} else {
    window.addEventListener('load', onPlotlyReady);
}


function main() {
    bkc.visit();

    function menuAverageOverTime(data) {
        const x = data.x; // x is a list of dates in YYYY-MM-DD format
        const y = data.y; // y is a list of average prices

        // y is in cents so we need to convert it to dollars
        // for (let i = 0; i < y.length; i++) {
        //     y[i] = parseInt(y[i]);
        //     y[i] = y[i] / 100;
        // }

        const averageMenuItemOverTime = document.getElementById('averageMenuItemOverTime');

        const graphData = {
            x: x,
            y: y,
            type: 'scatter',
            name: 'Average Menu Item Price IN CENTS by Day',
            mode: 'lines+markers',
            marker: {color: 'blue'},
        };

        const layout = {
            title: 'Average Menu Item Price IN CENTS by Day',
            plot_bgcolor: '#c5b480',
            paper_bgcolor: '#c5b480',
            xaxis: {
                title: 'Date',
                type: 'date',
                tickformat: '%Y-%m-%d',
                dtick: 86400000 // This line sets the interval between ticks to one day
            },
            yaxis: {
                title: 'Average Price CENTS'
            },
            
        };

        Plotly.newPlot(averageMenuItemOverTime, [graphData], layout, {responsive: true});


    }

    function categoryInflationByState(data) {
        const categoryInflationByState = document.getElementById('categoryInflationByState');

        // sort the keys in data
        const keys = Object.keys(data);
        keys.sort();

        const states = [];
        const categories = [];

        const differences = [];
        const start = data[keys[0]];
        const end = data[keys[keys.length - 1]];

        const startTable = {};
        const differencesTable = {};
        
        for (let key in start) {
            let parts = key.split(",");
            let state = parts[0];
            let category = parts[1];

            startTable[(state, category)] = start[key];

            if (!states.includes(state)) {
                states.push(state);
            }

            if (!categories.includes(category)) {
                categories.push(category);
            }
        }

        for (let key in end) {
            let parts = key.split(",");
            let state = parts[0];
            let category = parts[1];

            differencesTable[(state, category)] = end[key] - startTable[(state, category)];
        }

        // reverse the order of the states
        states.reverse();

        // build up 2d array of differences
        for (let i = 0; i < states.length; i++) {
            let row = [];
            for (let j = 0; j < categories.length; j++) {
                let state = states[i];
                let category = categories[j];
                let key = (state, category);
                row.push(differencesTable[key]);
            }
            differences.push(row);
        }

        var data = [
            {
              z: differences,
              x: categories,
              y: states,
              type: 'heatmap',
              hoverongaps: false
            }
        ];

        // put the x axis labels on the top
        var layout = {
            title: "Inflation by State and Category",
            plot_bgcolor: '#c5b480',
            paper_bgcolor: '#c5b480',
            height: states.length * 20,
            yaxis: {
                tickfont: {
                    size: 10 // Adjust this value as needed
                }
            },
            xaxis: {
                tickfont: {
                    size: 8
                },
            }

        };
          
        Plotly.newPlot(categoryInflationByState, data, layout, {responsive: true});

        const averageByCategoryStateStart = document.getElementById("categoryByStateStart");
        const averageByCategoryStateEnd = document.getElementById("categoryByStateEnd");

        // set the start date to the first date in the data
        averageByCategoryStateStart.value = keys[0];
        averageByCategoryStateEnd.value = keys[keys.length - 1];
          
    }

    function updateCounts(counts) {

        const restaurantCounts = document.getElementsByClassName("numberRestaurants");
        const menuItemCounts = document.getElementsByClassName("numberMenuItems");
        const visitorCounts = document.getElementsByClassName("numberVisitors");

        const restaurantCount = counts.restaurants;
        const menuitemCount = counts.menuitems;
        const visitorCount = counts.visits;

        for (let i = 0; i < restaurantCounts.length; i++) {
            // format the number with commas
            restaurantCounts[i].innerText = restaurantCount.toLocaleString();
        }

        for (let i = 0; i < menuItemCounts.length; i++) {
            menuItemCounts[i].innerText = menuitemCount.toLocaleString();
        }

        for (let i = 0; i < visitorCounts.length; i++) {
            visitorCounts[i].innerText = visitorCount.toLocaleString();
        }
    }


    bkc.countIds(["restaurants", "menuitems", "visits"], updateCounts, console.error);

    //get average prices by day and update the plot
    bkc.getAveragePricesByDay(menuAverageOverTime, console.error);

    //bkc.getAveragePricesByCategory("2024-03-10", "2024-03-12", categoryInflationByState, console.error);
    const averageByCategoryStateStart = document.getElementById("categoryByStateStart");
    const averageByCategoryStateEnd = document.getElementById("categoryByStateEnd");

    averageByCategoryStateEnd.addEventListener("change", function() {
        const start = averageByCategoryStateStart.value;
        const end = averageByCategoryStateEnd.value;
        bkc.getAveragePricesByCategory(start, end, categoryInflationByState, console.error);
    });

    averageByCategoryStateStart.addEventListener("change", function() {
        const start = averageByCategoryStateStart.value;
        const end = averageByCategoryStateEnd.value;
        bkc.getAveragePricesByCategory(start, end, categoryInflationByState, console.error);
    });

    // set the end date to today
    const today = new Date();
    const year = today.getFullYear();
    // make sure the month is 2 digits
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate();

    const todayString = year + "-" + month + "-" + day;
    averageByCategoryStateEnd.value = todayString;

    //fire end change event to update the plot
    averageByCategoryStateEnd.dispatchEvent(new Event("change"));
}
// HeatmapGraph.js

import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import GraphBox from './GraphBox';

function HeatmapGraph({ graphId, title, description, withDateSelector, getData }) {
    const defaultStartDate = "2024-03-10";
    const defaultEndDate = new Date().toISOString().split("T")[0];

    const [ startDate, setStartDate ] = useState(defaultStartDate);
    const [ endDate, setEndDate ] = useState(defaultEndDate);
    const [ data, setData ] = useState([]);

    useEffect(() => {
        if (startDate.length === 0 || endDate.length === 0) return;
        getData(startDate, endDate, setData, (e) => {console.error("Error getting data", e)});
    }, [startDate, endDate]);

    useEffect(() => {
        if (data.length === 0) return;

        const dataKeys = Object.keys(data);
        dataKeys.sort();
        const [ newStartDate, newEndDate ] = dataKeys;
        const startData = data[newStartDate];
        const endData = data[newEndDate];
        const differences = {};

        for (let key in startData) {
            const parts = key.split(",");
            const [ state, category ] = parts;
            const price = parseFloat(startData[key]);

            differences[state] = differences[state] || {};
            differences[state][category] = price;
        }

        for (let key in endData) {
            const parts = key.split(",");
            const [ state, category ] = parts;
            const price = parseFloat(endData[key]);

            // if the state is not in the differences object, skip it.  (This will break the graph though...)
            if (!differences[state]) continue;

            differences[state][category] = differences[state][category] - price;
        }

        const states = Object.keys(differences);
        const categories = Object.keys(differences[states[0]]);
        const differenceValues = [];

        for (let i = 0; i < states.length; i++) {
            differenceValues.push([]);
            for (let j = 0; j < categories.length; j++) {
                differenceValues[i].push(differences[states[i]][categories[j]]);
            }
        }
            
        const x = categories;
        const y = states;
        const z = differenceValues;

        const graph = document.getElementById(graphId);

        Plotly.newPlot(graph, [{
            x: x,
            y: y,
            z: z,
            type: 'heatmap',
            colorscale: 'Viridis'
        }], {
            margin: { t: 0 },
            height: Math.max(500, states.length * 20),
            
        }, {
            displayModeBar: false,
            scrollZoom: false,
            doubleClick: false,
            dragMode: false
        });

        setStartDate(newStartDate);
        setEndDate(newEndDate);
        
    }, [data]);

    
    return (
        GraphBox({ 
            title, 
            description, 
            graphId, 
            withDateSelector, 
            startDate, 
            endDate,
            height: 1000, 
            onStartChange: setStartDate, 
            onEndChange: setEndDate
         })
    );
}

export default HeatmapGraph;
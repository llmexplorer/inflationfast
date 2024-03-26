// LineGraph.js

import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import GraphBox from './GraphBox';

function LineGraph({ graphId, title, description, withDateSelector, getData }) {
    const [data, setData] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        getData(setData, (e) => {console.error("Error getting data", e)});
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const x = data.x;
        const y = data.y;

        const graph = document.getElementById(graphId);

        
        Plotly.newPlot(graph, [{
            x: x,
            y: y,
            trendline: 'ols',
            type: 'scatter',
            mode: 'lines+markers',
            line: {
                width: 3,
                color: 'rgba(0, 0, 255, 0.5)'
            },
            marker: {
                color: 'blue',
                size: 5,
                line: {
                    width: 2,
                    color: 'rgba(0, 0, 255, 0.5)'
                }
            }
        }], {
            margin: { t: 0 }
        }, {
            scrollZoom: false,
            displayModeBar: false,
            editable: false,
            editSelection: false,
            showAxisDragHandles: false,
            showAxisRangeEntryBoxes: false,
            staticPlot: true
        });

    }, [data]);


    const handleStartDateChange = (date) => {
        setStartDate(date);
        // You can add additional logic here to filter data based on the new start date
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        // You can add additional logic here to filter data based on the new end date
    };

    return (
        <GraphBox 
            title={title} 
            description={description} 
            graphId={graphId} 
            withDateSelector={withDateSelector} 
            startDate={startDate} 
            endDate={endDate} 
            onStartChange={handleStartDateChange} 
            onEndChange={handleEndDateChange} 
        />
    );
}

export default LineGraph;
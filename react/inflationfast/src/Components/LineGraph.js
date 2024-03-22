// LineGraph.js

import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import GraphBox from './GraphBox';

function LineGraph({ graphId, title, description, withDateSelector, getData }) {
    const [data, setData] = useState([]);

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
            displayModeBar: false,
            scrollZoom: false,
            doubleClick: false,
            dragMode: false
        });

    }, [data]);

    
    return (
        GraphBox({ title, description, graphId, withDateSelector })
    );
}

export default LineGraph;
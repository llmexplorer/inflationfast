import React, { useEffect, useState } from 'react';
import DateSelector from './DateSelector';
import './GraphBox.css';

function GraphBox({ title, description, graphId, withDateSelector, height, startDate, endDate, onStartChange, onEndChange }) {
  // if height is passed in override the default height for the graphPlaceholder
  const graphStyle = height ? { height: height } : {};

  return (
    <div className="graphBox">
      <h2 className="graphTitle">{title}</h2>
      <p className="graphExplainerText" dangerouslySetInnerHTML={{  __html: description }}></p>
      {withDateSelector && <DateSelector initialStartDate={startDate} initialEndDate={endDate} onStartChange={onStartChange} onEndChange={onEndChange} />}
      <div className="graphPlaceholder" id={graphId} style={graphStyle} ></div>

    </div>
  );
}


export default GraphBox;

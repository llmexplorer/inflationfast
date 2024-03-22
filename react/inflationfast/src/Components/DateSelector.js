// DateSelector.js
import React, { useEffect, useState } from 'react';
import './DateSelector.css';

function DateSelector({ initialStartDate, initialEndDate, onStartChange, onEndChange }) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    onStartChange(startDate);
  }, [startDate]);

  useEffect(() => {
    onEndChange(endDate);
  }, [endDate]);

  useEffect(() => {
    setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setEndDate(initialEndDate);
  }, [initialEndDate]);


  return (
    <div className="dateSelector">
      <label htmlFor="categoryByStateStart">Start:</label>
      <input type="date" id="categoryByStateStart" name="dateSelector" min="2024-03-10" value={ startDate } onChange={ (e) => setStartDate(e.target.value) } />
      <label htmlFor="categoryByStateEnd">End:</label>
      <input type="date" id="categoryByStateEnd" name="dateSelector" min="2024-03-10" value={ endDate } onChange={ (e) => setEndDate(e.target.value) }/>
    </div>
  );
}

export default DateSelector;

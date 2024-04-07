// SpecificItemDisplay.js
import React, { useEffect, useState } from 'react';
import './SpecificItemDisplay.css';
import SelectItem from './SelectItem';
import LineGraph from './LineGraph';

function SpecificItemDisplay({ title, description, itemsList, getData }) {
  const [ selectedItem, setSelectedItem ] = useState({});

  function handleItemSelection(item) {
    setSelectedItem(item);

  }


  return (
    <div className="graphBox">
      <h1>{title}</h1>
      <p>{description}</p>
      <SelectItem itemsList={itemsList} onSelect={handleItemSelection} />
      <LineGraph 
          key={selectedItem.itemId}
          graphId='specificItemDisplay'
          title={selectedItem.name}
          description={'Cost per calorie for ' + selectedItem.name + ' over time'}
          withDateSelector={false}
          getData={(success, failure) => {
            if (!selectedItem.item_id) {
              success([]);
              return;
            }

            getData(selectedItem.item_id, success, failure);
          }}
      />
    </div>
  );
}

export default SpecificItemDisplay;

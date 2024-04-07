// SelectItem.js
import React, { useEffect, useState } from 'react';
import './SelectItem.css';

function SelectItem({ itemsList, onSelect }) {
  /* Search field, dropdown, and item selection */
  const [ selectedItem, setSelectedItem ] = useState(null);

  function onSelectionChange(e) {
    const selectedValue = e.target.value;

    const item = itemsList.find((item) => item.item_id === selectedValue);
    setSelectedItem(item);
    onSelect(item);
  }


  return (
    <div className="selectItem">
        <div className="itemSelectBox">
            <select className="itemSelect" onChange={onSelectionChange} defaultValue={""}>
                <option value="" disabled hidden>Select an item</option>
                {itemsList.map((item) => (
                    <option key={item.item_id} value={item.item_id}>{item.name}</option>
                ))}
            </select>
        </div>
        {selectedItem && (
            <div className="itemDisplay">
                <div className="itemDisplayImageBox">
                    <img src={selectedItem.image_url} className="itemDisplayImage" alt={selectedItem.name + ' image'} />
                </div>
                <div className="itemDisplayTitle">{selectedItem.searchValue}</div>
                <div className="itemDisplayDescription">{selectedItem.category}</div>
                <div className="itemDisplayAverageCost">${(selectedItem.average_price / 100).toFixed(2) }</div>
                <div className="itemDisplayAverageCalories">{parseInt(selectedItem.calories)} Calories</div>
            </div>
        )}
    </div>
  );
}

export default SelectItem;

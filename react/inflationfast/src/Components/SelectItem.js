// SelectItem.js
import React, { useEffect, useState } from 'react';
import './SelectItem.css';

function SelectItem({ itemsList, onSelect }) {
  /* Search field, dropdown, and item selection */
  const [ selectedItem, setSelectedItem ] = useState(null);
  const [ dropdownDisplay, setDropdownDisplay ] = useState(false);
  const [ results, setResults ] = useState([]);
  const [ searchValue, setSearchValue ] = useState("");

  function onSearchChange(e) {
    const searchValue = e.target.value;

    setSelectedItem(null);

    // if searchValue is empty, clear the dropdown
    if (searchValue === "") {
      setDropdownDisplay(false);
      setSearchValue("");
        setResults([]);
      return;
    }
    const matches = itemsList.filter((item) => item.searchValue.toLowerCase().includes(searchValue.toLowerCase()));

    setDropdownDisplay(true);
    setSearchValue(searchValue);
    
    setResults(matches);

    if (matches.length === 0) {
      setDropdownDisplay(false);
    }

    // if you match the searchValue exactly, select it
    if (results.length === 1 && results[0].searchValue === searchValue) {
      searchSelection(results[0]);
    }

  }

  function searchSelection(e) {
    setDropdownDisplay(false);
    setSearchValue(e.searchValue);
    setSelectedItem(e);
    onSelect(e);
  }

  return (
    <div className="selectItem">
        <div className="itemSelectBox">
            <input
                type="text"
                placeholder="Search for an item..."
                onChange={onSearchChange}
                value={searchValue}
                className='selectItemInput'
            />
            <div className="dropdown">
                {dropdownDisplay && (
                    <div className="dropdownContent">
                        {results.map((result) => (
                            <div className='searchCandidate' key={result.itemId} onClick={(e) => searchSelection(result)}>
                                {result.searchValue}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        {selectedItem && (
            <div className="itemDisplay">
                <div className="itemDisplayImageBox">
                    <img src={selectedItem.image_url} className="itemDisplayImage" alt={selectedItem.searchValue + ' image'} />
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

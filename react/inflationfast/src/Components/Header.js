// Header.js
import React, { useEffect, useState } from 'react';
import bkc from '../BurgerKingClient';

function Header() {
  const [ visitorCount, setVisitorCount ] = useState(0);
  const [ menuItems, setMenuItems ] = useState(0);
  const [ restaurants, setRestaurants ] = useState(0);

  useEffect(() => {
    bkc.countIds(["restaurants", "menuitems", "visits"], (counts) => {
      setVisitorCount(counts.visits);
      setMenuItems(counts.menuitems);
      setRestaurants(counts.restaurants);
    });
  });

  return (
    <div className="pageTitle">
      <h1>BK Inflation Tracker</h1>
      <p id="intro">Tracking <span className="numberMenuItems">{menuItems.toLocaleString()}</span> menu items at <span className="numberRestaurants">{restaurants.toLocaleString()}</span> restaurants since 2024-03-10.</p>
      <p id="intro">I use a webscraper to get the menu from every Burger King in the United States once every 5-ish days and present trends in the data here.</p>
      <p id="intro">Site is a work in progress.</p>
      <p id="visitorCount">Visitors: <span className="numberVisitors">{visitorCount.toLocaleString()}</span></p>
    </div>
  );
}

export default Header;

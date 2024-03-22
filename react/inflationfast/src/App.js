// App.js
import React from 'react';
import Header from './Components/Header';
import HeatmapGraph from './Components/HeatmapGraph';
import LineGraph from './Components/LineGraph';
import Links from './Components/Links';
import './index.css';
import './App.css';
import bkc from './BurgerKingClient';

function App() {
  return (
    <div className="pageContainer">
      <div className="gutter"></div>
      <div className="contentContainer">
        <Header />
        <LineGraph
          title="Average Menu Item"
          description="Average price of every item at every Burger King each day."
          graphId="averageMenuItemOverTime"
          getData={bkc.getAveragePricesByDay}
          graphType="line"
        />
        <HeatmapGraph
          title="Category Inflation by State"
          description="Category inflation is the average price of all items in a category at all restaurants in a state."
          graphId="categoryInflationByState"
          withDateSelector
          getData={bkc.getAveragePricesByCategory}
          startDate="2024-03-10"
          endDate="2024-03-19"
        />
        <LineGraph
          title="Meal Price Average"
          description={'A meal is a whopper, vanilla shake, and large fries per <a href="https://twitter.com/WallStreetSilv/status/1764297174819770398">inspiration</a>'}
          graphId="averageMealPriceByDay"
          getData={bkc.getAverageMealPriceByDay}
        />
        <Links />
      </div>
      <div className="gutter"></div>
    </div>
  );
}

export default App;

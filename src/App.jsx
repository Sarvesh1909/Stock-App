import React from "react";
import StockChart from "./components/StockChart";
import { stockData } from "./data/stockData";

function App() {
  return (
    <div className="App">
      <h1>Company Stock Statistics</h1>
      <StockChart companies={stockData} />
    </div>
  );
}

export default App;
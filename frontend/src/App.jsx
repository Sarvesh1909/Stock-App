import React, { useState } from "react";
import StockChart from "./components/StockChart";

const AGGREGATION_LEVELS = [
  { value: "minute", label: "Minute" },
  { value: "hour", label: "Hour" },
  { value: "date", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "decade", label: "Decade" },
];
  
const GRAPH_TYPES = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" }
];

function getGroupKey(date, level) {
  const d = new Date(date);
  if (isNaN(d)) return "Invalid";
  switch (level) {
    case "minute":
      return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    case "hour":
      return d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    case "date":
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    case "month":
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    case "year":
      return d.getFullYear().toString();
    case "decade":
      return Math.floor(d.getFullYear() / 10) * 10 + "s";
    default:
      return d.toISOString();
  }
}

function App() {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState("");
  const [aggregation, setAggregation] = useState("date");
  const [rawRange, setRawRange] = useState({ start: "", end: "" });
  const [appliedFilters, setAppliedFilters] = useState({ aggregation: "date", start: "", end: "" });
  const [search, setSearch] = useState("");
  const [graphType, setGraphType] = useState("line");

  // Helper to get min/max for pickers
  let minTimestamp = "";
  let maxTimestamp = "";
  if (stockData && stockData.length > 0 && stockData[0].timestamps && stockData[0].timestamps.length > 0) {
    const allTimestamps = stockData.flatMap(c => c.timestamps || []);
    minTimestamp = allTimestamps.reduce((min, ts) => (!min || ts < min ? ts : min), "");
    maxTimestamp = allTimestamps.reduce((max, ts) => (!max || ts > max ? ts : max), "");
  }

  // Dynamic input type for pickers
  const getInputType = (agg) => {
    if (agg === "minute" || agg === "hour") return "datetime-local";
    if (agg === "date") return "date";
    if (agg === "month") return "month";
    if (agg === "year" || agg === "decade") return "number";
    return "date";
  };

  // Filter data by range
  const filterByRange = (data, range, agg) => {
    if (!range.start && !range.end) return data;
    let start, end;
    if (agg === "year" || agg === "decade") {
      start = range.start ? parseInt(range.start) : null;
      end = range.end ? parseInt(range.end) : null;
    } else {
      start = range.start ? new Date(range.start) : null;
      end = range.end ? new Date(range.end) : null;
    }
    return data.map(company => {
      if (!company.timestamps || company.timestamps.length !== company.prices.length) return company;
      const filteredTimestamps = [];
      const filteredPrices = [];
      company.timestamps.forEach((ts, i) => {
        let d = ts;
        if (agg === "year" || agg === "decade") {
          d = new Date(ts).getFullYear();
        } else if (agg === "month") {
          d = ts.slice(0, 7); // YYYY-MM
        } else if (agg === "date") {
          d = ts.slice(0, 10); // YYYY-MM-DD
        } else {
          d = ts;
        }
        let inRange = true;
        if (start !== null) {
          if (agg === "year" || agg === "decade") {
            inRange = inRange && d >= start;
          } else {
            inRange = inRange && new Date(ts) >= start;
          }
        }
        if (end !== null) {
          if (agg === "year" || agg === "decade") {
            inRange = inRange && d <= end;
          } else {
            inRange = inRange && new Date(ts) <= end;
          }
        }
        if (inRange) {
          filteredTimestamps.push(ts);
          filteredPrices.push(company.prices[i]);
        }
      });
      return { ...company, timestamps: filteredTimestamps, prices: filteredPrices };
    });
  };

  // Aggregate data by selected level
  const aggregateData = (data, level) => {
    return data.map(company => {
      if (!company.timestamps || company.timestamps.length !== company.prices.length) {
        return company;
      }
      const groups = {};
      company.timestamps.forEach((ts, i) => {
        const key = getGroupKey(ts, level);
        if (!groups[key]) groups[key] = [];
        groups[key].push(company.prices[i]);
      });
      const aggPrices = Object.values(groups).map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);
      const aggTimestamps = Object.keys(groups);
      return {
        ...company,
        prices: aggPrices,
        timestamps: aggTimestamps,
      };
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array of companies");
        parsed.forEach(company => {
          if (!company.name || !Array.isArray(company.prices)) {
            throw new Error("Each company must have a name and a prices array");
          }
        });
        setStockData(parsed);
        setError("");
        setRawRange({ start: "", end: "" });
        setAppliedFilters({ aggregation: "date", start: "", end: "" });
        setAggregation("date");
        setSearch("");
      } catch (err) {
        setError("Invalid JSON: " + err.message);
        setStockData(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle aggregation change
  const handleAggregationChange = (e) => {
    setAggregation(e.target.value);
    setRawRange({ start: "", end: "" });
  };

  // Handle range change
  const handleRangeChange = (e) => {
    setRawRange({ ...rawRange, [e.target.name]: e.target.value });
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle graph type change
  const handleGraphTypeChange = (e) => {
    setGraphType(e.target.value);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ aggregation, start: rawRange.start, end: rawRange.end });
  };

  // Reset filters
  const handleResetFilters = () => {
    setAggregation("date");
    setRawRange({ start: "", end: "" });
    setAppliedFilters({ aggregation: "date", start: "", end: "" });
    setSearch("");
  };

  // Prepare data for chart
  let chartData = stockData;
  if (chartData) {
    // Filter by search
    if (search.trim() !== "") {
      const searchLower = search.trim().toLowerCase();
      chartData = chartData.filter(company => company.name.toLowerCase().includes(searchLower));
    }
    chartData = filterByRange(chartData, appliedFilters, appliedFilters.aggregation);
    chartData = aggregateData(chartData, appliedFilters.aggregation);
  }

  // Picker min/max helpers
  const getPickerMin = () => {
    if (!minTimestamp) return undefined;
    if (aggregation === "year" || aggregation === "decade") return new Date(minTimestamp).getFullYear();
    if (aggregation === "month") return minTimestamp.slice(0, 7);
    if (aggregation === "date") return minTimestamp.slice(0, 10);
    return minTimestamp.slice(0, 16);
  };
  const getPickerMax = () => {
    if (!maxTimestamp) return undefined;
    if (aggregation === "year" || aggregation === "decade") return new Date(maxTimestamp).getFullYear();
    if (aggregation === "month") return maxTimestamp.slice(0, 7);
    if (aggregation === "date") return maxTimestamp.slice(0, 10);
    return maxTimestamp.slice(0, 16);
  };

  return (
    <div className="App" style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>Company Stock Statistics</h1>
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" onChange={handleFileUpload} />
      </div>
      {stockData && (
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search company name..."
            value={search}
            onChange={handleSearchChange}
            style={{ width: 250, padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <select
            value={graphType}
            onChange={handleGraphTypeChange}
            style={{ marginLeft: 16, padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {GRAPH_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} Chart</option>
            ))}
          </select>
        </div>
      )}
      {stockData && (
        <div style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 20,
          marginBottom: 32,
          background: "#f9f9f9"
        }}>
          <h2 style={{ marginTop: 0 }}>Filters</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label>
                View data by:
                <select value={aggregation} onChange={handleAggregationChange} style={{ marginLeft: 8 }}>
                  {AGGREGATION_LEVELS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                Start:
                <input
                  type={getInputType(aggregation)}
                  name="start"
                  value={rawRange.start}
                  min={getPickerMin()}
                  max={getPickerMax()}
                  onChange={handleRangeChange}
                  style={{ marginLeft: 8, marginRight: 16 }}
                />
              </label>
            </div>
            <div>
              <label>
                End:
                <input
                  type={getInputType(aggregation)}
                  name="end"
                  value={rawRange.end}
                  min={getPickerMin()}
                  max={getPickerMax()}
                  onChange={handleRangeChange}
                  style={{ marginLeft: 8 }}
                />
              </label>
            </div>
            <button onClick={handleApplyFilters} style={{ marginLeft: 16, padding: "6px 18px" }}>Apply Filters</button>
            <button onClick={handleResetFilters} style={{ marginLeft: 8, padding: "6px 18px" }}>Reset Filters</button>
          </div>
        </div>
      )}
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {chartData && chartData.some(c => c.prices.length > 0) ? (
        <StockChart companies={chartData} graphType={graphType} />
      ) : stockData ? (
        <div style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
          No data matches the selected filters.
        </div>
      ) : null}
    </div>
  );
}

export default App;

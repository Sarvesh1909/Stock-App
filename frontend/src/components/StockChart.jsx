import React, { useMemo, useState } from "react";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const StockChart = ({ companies, graphType = "line" }) => {
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const selectedCompany = companies[selectedCompanyIndex] || companies[0];

  // Use actual timestamps from the selected company's data, or generate generic labels as fallback
  const getLabels = () => {
    if (selectedCompany && selectedCompany.timestamps) {
      return selectedCompany.timestamps;
    }
    const dataLength = selectedCompany ? selectedCompany.prices.length : 0;
    const labels = [];
    for (let i = 0; i < dataLength; i++) {
      labels.push(`Point ${i + 1}`);
    }
    return labels;
  };

  const labels = getLabels();

  const getDataset = (company) => {
    return {
      label: company.name,
      data: company.prices,
      borderColor: company.color,
      backgroundColor: company.color.replace("1)", "0.5)"),
      tension: 0.4
    };
  };

  const data = {
    labels: labels,
    datasets: [getDataset(selectedCompany)]
  };

  // Calculate summary statistics for the selected company
  const companyStats = useMemo(() => {
    if (!selectedCompany) return [];
    const prices = selectedCompany.prices;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
    const percentChange = (((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2);
    return [{
      name: selectedCompany.name,
      color: selectedCompany.color,
      min,
      max,
      avg,
      percentChange
    }];
  }, [selectedCompany]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Company Stock Prices Over Time" },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time Period"
        }
      },
      y: {
        title: {
          display: true,
          text: "Stock Price ($)"
        }
      }
    }
  };

  // Data for multi-company charts (doughnut, pie, polarArea, radar)
  const multiCompanyData = {
    labels: companies.map(c => c.name),
    datasets: [
      {
        label: "Latest Price",
        data: companies.map(c => c.prices && c.prices.length > 0 ? c.prices[c.prices.length - 1] : null),
        backgroundColor: companies.map(c => c.color.replace("1)", "0.5)")),
        borderColor: companies.map(c => c.color),
      }
    ]
  };
  const hasMultiCompanyData = multiCompanyData.labels.length > 0 && multiCompanyData.datasets[0].data.some(v => v !== null && v !== undefined);

  // Data for scatter chart (price vs. index)
  const scatterData = {
    datasets: [
      {
        label: selectedCompany.name,
        data: selectedCompany.prices.map((price, i) => ({ x: i + 1, y: price })),
        backgroundColor: selectedCompany.color.replace("1)", "0.5)"),
        borderColor: selectedCompany.color,
        showLine: true,
      }
    ]
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Summary Statistics</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px" }}>Company</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Min ($)</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Max ($)</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Avg ($)</th>
              <th style={{ textAlign: "right", padding: "4px" }}>% Change</th>
            </tr>
          </thead>
          <tbody>
            {companyStats.map((stat) => (
              <tr key={stat.name}>
                <td style={{ color: stat.color, padding: "4px" }}>{stat.name}</td>
                <td style={{ textAlign: "right", padding: "4px" }}>{stat.min}</td>
                <td style={{ textAlign: "right", padding: "4px" }}>{stat.max}</td>
                <td style={{ textAlign: "right", padding: "4px" }}>{stat.avg}</td>
                <td style={{ textAlign: "right", padding: "4px" }}>{stat.percentChange}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="company-select" style={{ marginRight: "0.5rem" }}>Select Company:</label>
        <select
          id="company-select"
          value={selectedCompanyIndex}
          onChange={e => setSelectedCompanyIndex(Number(e.target.value))}
        >
          {companies.map((company, idx) => (
            <option value={idx} key={company.name}>{company.name}</option>
          ))}
        </select>
      </div>
      {graphType === "line" && <Line data={data} options={options} />}
      {graphType === "bar" && <Bar data={data} options={options} />}
      {graphType === "pie" && hasMultiCompanyData && <Pie data={multiCompanyData} options={options} />}
      {graphType === "pie" && !hasMultiCompanyData && (
        <div style={{ color: "#c00", margin: "1rem 0" }}>No data available for this chart type.</div>
      )}
      {graphType === "scatter" && <Scatter data={scatterData} options={options} />}
    </div>
  );
};

export default StockChart; 
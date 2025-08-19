import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { getDashboardStats } from "../../Api/Auth.jsx";
import { FiLoader } from 'react-icons/fi';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
        <p className="font-bold text-gray-800">{`${label}`}</p>
        <p className="text-sm" style={{ color: payload[0].fill }}>
          {`Total Amount: ₹${payload[0].value.toLocaleString('en-IN')}`}
        </p>
      </div>
    );
  }
  return null;
};


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  const [summaryStats, setSummaryStats] = useState({
    todayMilk: 0,
    pendingPayments: 0,
    totalFarmers: 0,
  });
  const [milkChartData, setMilkChartData] = useState([]);
  const [farmerChartData, setFarmerChartData] = useState([]);
  
  const [labels, setLabels] = useState({
    header: "Milk Collection Overview",
    milkLabel: "Today's Milk Collection",
    paymentLabel: "Pending Payments",
    farmerLabel: "Total Farmers",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        
        if (res.stats) {
          setSummaryStats(res.stats);
        }
        if (res.charts) {
          setMilkChartData(res.charts.milkLast7Days || []);
          setFarmerChartData(res.charts.topFarmers || []);
        }
        if (res.labels) {
          setLabels(res.labels);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <FiLoader className="animate-spin text-blue-600" size={48} />
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{labels.header}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm mb-1">{labels.milkLabel}</p>
          <h3 className="text-3xl font-semibold text-gray-800">{summaryStats.todayMilk} L</h3>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-red-500">
          <p className="text-gray-500 text-sm mb-1">{labels.paymentLabel}</p>
          <h3 className="text-3xl font-semibold text-gray-800">
            ₹{summaryStats.pendingPayments}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-gray-500 text-sm mb-1">{labels.farmerLabel}</p>
          <h3 className="text-3xl font-semibold text-gray-800">{summaryStats.totalFarmers}</h3>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-bold mb-4 text-gray-700">Milk Collected (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={milkChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="liters" name="Liters" stroke="#1d4ed8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-bold mb-4 text-gray-700">Top Farmers by Amount (Last 30 Days)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={farmerChartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="farmer_name"
                width={150}
                tick={{ fontSize: 12, fill: '#374151' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Bar
                dataKey="total_amount"
                name="Total Amount"
                fill="#10b981"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}; 

export default Dashboard;
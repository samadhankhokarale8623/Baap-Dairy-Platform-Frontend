import React, { useEffect, useState, useMemo } from "react";
import {
  addMilkEntry,
  getMilkData,
  filterMilkByDate,
  getUsers,
  sendWhatsAppReceipt, // Add this import
} from "../../Api/Auth.jsx";
import {
  FiEdit,
  FiX,
  FiPlus,
  FiSearch,
  FiDownload,
  FiEye,
  FiCalendar,
  FiClock,
  FiPrinter,
  FiLoader,
  FiMessageSquare, // Add this import
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sidebar from "../../Components/sidebar/Sidebar.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper functions
const getFarmerName = (user) => {
  const {
    firstname = "",
    middlename = "",
    lastname = "",
    farmer_name = "",
  } = user;

  if (farmer_name && farmer_name.trim()) {
    return farmer_name.trim();
  }

  const nameParts = [firstname, middlename, lastname].filter(
    (part) => part && part.trim()
  );
  return nameParts.length > 0 ? nameParts.join(" ") : "N/A";
};

const getMobileNumber = (user) => {
  return user.mobile_number || user.mobile || user.mobileno || "N/A";
};

// Calculate total amount
const calculateTotal = (liters, rate) => {
  const literValue = parseFloat(liters) || 0;
  const rateValue = parseFloat(rate) || 0;
  return (literValue * rateValue).toFixed(2);
};

// Convert date to YYYY-MM-DD format
const toYYYYMMDD = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN");
};

// Get date range for different periods
const getDateRange = (period, selectedDate, year, month) => {
  let startDate, endDate;
  const baseDate = new Date(selectedDate);

  switch (period) {
    case "daily":
      startDate = new Date(baseDate);
      endDate = new Date(baseDate);
      break;
    case "weekly":
      const dayOfWeek = baseDate.getDay();
      startDate = new Date(baseDate);
      startDate.setDate(baseDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;
    case "monthly":
      startDate = new Date(year || baseDate.getFullYear(), month !== undefined ? month : baseDate.getMonth(), 1);
      endDate = new Date(year || baseDate.getFullYear(), (month !== undefined ? month : baseDate.getMonth()) + 1, 0);
      break;
    case "yearly":
      startDate = new Date(year || baseDate.getFullYear(), 0, 1);
      endDate = new Date(year || baseDate.getFullYear(), 11, 31);
      break;
    default:
      startDate = endDate = new Date(baseDate);
  }

  return { startDate, endDate };
};

const MilkCollectionPage = () => {
  const [users, setUsers] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMilkModal, setShowMilkModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptPeriod, setReceiptPeriod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false); // Add this state

  // Month/Year selector states
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState(null);
  const [selectedReceiptYear, setSelectedReceiptYear] = useState(
    new Date().getFullYear()
  );
  const [selectedReceiptMonth, setSelectedReceiptMonth] = useState(
    new Date().getMonth()
  );

  // Milk entry form data
  const [milkFormData, setMilkFormData] = useState({
    date: new Date(),
    liters: "",
    fat: "",
    snf: "",
    degree: "",
    rate: "",
    timing: "Morning",
  });

  const itemsPerPage = 5;

  // Add WhatsApp handler function
  const handleSendWhatsApp = async () => {
    if (!receiptData) {
      toast.error("Receipt data not available.");
      return;
    }
    setIsSendingWhatsApp(true);
    try {
      // The mobile number is already part of receiptData.user
      await sendWhatsAppReceipt(receiptData);
      toast.success(`WhatsApp message sent to ${getFarmerName(receiptData.user)}!`);
    } catch (err) {
      console.error("Error sending WhatsApp message:", err);
      toast.error(err.response?.data?.error || "Failed to send WhatsApp message.");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [usersResponse, milkResponse] = await Promise.all([
        getUsers(),
        getMilkData(),
      ]);

      const usersData = usersResponse.data || usersResponse;
      const milkData = milkResponse.data || milkResponse;

      console.log("Users Data:", usersData);
      console.log("Milk Data:", milkData);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setMilkRecords(Array.isArray(milkData) ? milkData : []);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      toast.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const searchLower = searchTerm.toLowerCase();
    return users.filter((user) =>
      [getFarmerName(user), getMobileNumber(user), user.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(searchLower))
    );
  }, [users, searchTerm]);

  // Get user milk records for a date range
  const getUserMilkRecords = (userId, startDate, endDate) => {
    const start = toYYYYMMDD(startDate);
    const end = toYYYYMMDD(endDate);

    console.log(`Filtering records for user ${userId} from ${start} to ${end}`);
    
    const filtered = milkRecords.filter((record) => {
      const recordDate = toYYYYMMDD(record.date);
      const userMatch = String(record.user_id) === String(userId);
      const dateMatch = recordDate >= start && recordDate <= end;
      
      console.log(`Record: ${record.id}, User: ${record.user_id}, Date: ${recordDate}, Match: ${userMatch && dateMatch}`);
      
      return userMatch && dateMatch;
    });

    console.log(`Found ${filtered.length} records for user ${userId}`);
    return filtered;
  };

  // Get daily totals for a user on a specific date
  const getUserDailyTotals = (userId, date) => {
    const dateStr = toYYYYMMDD(date);

    const records = milkRecords.filter((record) => {
      return (
        String(record.user_id) === String(userId) &&
        toYYYYMMDD(record.date) === dateStr
      );
    });

    const morning = records.find((r) => r.timing === "Morning");
    const evening = records.find((r) => r.timing === "Evening");

    const morningLiters = parseFloat(morning?.liters || 0);
    const eveningLiters = parseFloat(evening?.liters || 0);
    const morningAmount = parseFloat(morning?.total || 0);
    const eveningAmount = parseFloat(evening?.total || 0);

    return {
      morning: { liters: morningLiters, amount: morningAmount },
      evening: { liters: eveningLiters, amount: eveningAmount },
      total: {
        liters: morningLiters + eveningLiters,
        amount: morningAmount + eveningAmount,
      },
    };
  };

  // Generate receipt data with proper date handling
  const generateReceiptData = (user, period, year, month) => {
    console.log(`Generating receipt for user ${user.id}, period: ${period}, year: ${year}, month: ${month}`);
    
    const { startDate, endDate } = getDateRange(period, selectedDate, year, month);
    console.log(`Date range: ${startDate} to ${endDate}`);
    
    const records = getUserMilkRecords(user.id, startDate, endDate);
    console.log(`Found ${records.length} records for receipt`);

    const dailyTotals = {};
    let totalLiters = 0;
    let totalAmount = 0;

    // Process each record
    records.forEach((record) => {
      const date = toYYYYMMDD(record.date);
      if (!dailyTotals[date]) {
        dailyTotals[date] = {
          morning: null,
          evening: null,
          total: { liters: 0, amount: 0 },
        };
      }

      const liters = parseFloat(record.liters || 0);
      const amount = parseFloat(record.total || calculateTotal(record.liters, record.rate));

      // Store complete record data
      const timingKey = record.timing.toLowerCase();
      dailyTotals[date][timingKey] = {
        liters,
        amount,
        fat: parseFloat(record.fat || 0),
        snf: parseFloat(record.snf || 0),
        degree: parseFloat(record.degree || 0),
        rate: parseFloat(record.rate || 0),
      };

      dailyTotals[date].total.liters += liters;
      dailyTotals[date].total.amount += amount;

      totalLiters += liters;
      totalAmount += amount;
    });

    console.log(`Receipt data generated:`, {
      totalRecords: records.length,
      totalLiters: totalLiters.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      dailyTotalsCount: Object.keys(dailyTotals).length
    });

    return {
      user,
      period,
      startDate,
      endDate,
      dailyTotals,
      totalLiters: totalLiters.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      recordCount: records.length,
    };
  };

  // Pagination
  const paginatedData = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle milk entry form changes
  const handleMilkFormChange = (e) => {
    const { name, value } = e.target;
    setMilkFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open milk entry modal
  const handleAddMilk = (user) => {
    const now = new Date();
    const hour = now.getHours();
    const timing = hour < 12 ? "Morning" : "Evening";

    setSelectedUser(user);
    setMilkFormData({
      date: selectedDate,
      liters: "",
      fat: "",
      snf: "",
      degree: "",
      rate: "",
      timing: timing,
    });
    setShowMilkModal(true);
  };

  // Save milk entry
  const handleSaveMilkEntry = async (e) => {
    e.preventDefault();
    try {
      const milkData = {
        user_id: selectedUser.id,
        farmer_name: getFarmerName(selectedUser),
        mobile_number: getMobileNumber(selectedUser),
        date: toYYYYMMDD(milkFormData.date),
        liters: parseFloat(milkFormData.liters),
        fat: parseFloat(milkFormData.fat),
        snf: parseFloat(milkFormData.snf),
        degree: parseFloat(milkFormData.degree),
        rate: parseFloat(milkFormData.rate),
        timing: milkFormData.timing,
        total: calculateTotal(milkFormData.liters, milkFormData.rate),
      };

      await addMilkEntry(milkData);
      toast.success(`${milkFormData.timing} milk entry saved successfully!`);
      setShowMilkModal(false);
      await loadInitialData();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to save milk entry.";
      console.error("Error saving milk entry:", err);
      toast.error(errorMessage);
    }
  };

  // Trigger receipt action
  const triggerReceiptAction = (user, period, action) => {
    console.log(`Triggering receipt action: ${action} for ${period} period`);
    setReceiptConfig({ user, period, action });

    if (period === 'monthly' || period === 'yearly') {
      setShowMonthYearSelector(true);
    } else {
      const data = generateReceiptData(user, period, selectedDate.getFullYear(), selectedDate.getMonth());
      if (action === 'view') {
        setReceiptData(data);
        setReceiptPeriod(period);
        setShowReceiptModal(true);
      } else if (action === 'download') {
        downloadReceiptHtml(data);
      }
    }
  };
  
  // Handle receipt generation after selecting month/year
  const handleGenerateReceipt = () => {
    if (!receiptConfig) return;

    console.log(`Generating receipt with config:`, receiptConfig);
    const { user, period, action } = receiptConfig;
    const data = generateReceiptData(
      user,
      period,
      selectedReceiptYear,
      selectedReceiptMonth
    );

    if (action === "view") {
      setReceiptData(data);
      setReceiptPeriod(period);
      setShowReceiptModal(true);
    } else if (action === "download") {
      downloadReceiptHtml(data);
    }

    setShowMonthYearSelector(false);
    setReceiptConfig(null);
  };

  // Download receipt as HTML
  const downloadReceiptHtml = (data) => {
    const {
      user,
      period,
      startDate,
      endDate,
      dailyTotals,
      totalLiters,
      totalAmount,
      recordCount,
    } = data;

    // Create printable HTML content
    const printContent = `
      <html>
        <head>
          <title>Milk Collection Receipt - ${getFarmerName(user)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .farmer-info { margin-bottom: 20px; }
            .period-info { margin-bottom: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f0f8ff; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
            .no-data { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Milk Collection Receipt</h1>
            <p>Generated on: ${new Date().toLocaleDateString("en-IN")}</p>
          </div>
          
          <div class="farmer-info">
            <h3>Farmer Details:</h3>
            <p><strong>Name:</strong> ${getFarmerName(user)}</p>
            <p><strong>Mobile:</strong> ${getMobileNumber(user)}</p>
          </div>
          
          <div class="period-info">
            <p><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)} (${startDate.toLocaleDateString("en-IN")} - ${endDate.toLocaleDateString("en-IN")})</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th rowspan="2">Date</th>
                <th colspan="6">Morning</th>
                <th colspan="6">Evening</th>
                <th rowspan="2">Daily Total (L)</th>
                <th rowspan="2">Daily Total (₹)</th>
              </tr>
              <tr>
                <th>Liters</th><th>Fat</th><th>SNF</th><th>Degree</th><th>Rate</th><th>Amount</th>
                <th>Liters</th><th>Fat</th><th>SNF</th><th>Degree</th><th>Rate</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(dailyTotals).length === 0 ? 
                '<tr><td colspan="15" class="no-data">No records found for this period</td></tr>' :
                Object.entries(dailyTotals)
                  .sort(([a], [b]) => new Date(a) - new Date(b))
                  .map(([date, totals]) => `
                    <tr>
                      <td>${new Date(date).toLocaleDateString("en-IN")}</td>
                      <td>${totals.morning?.liters?.toFixed(1) || "0.0"}</td>
                      <td>${totals.morning?.fat?.toFixed(1) || "0.0"}</td>
                      <td>${totals.morning?.snf?.toFixed(1) || "0.0"}</td>
                      <td>${totals.morning?.degree?.toFixed(1) || "0.0"}</td>
                      <td>${totals.morning?.rate?.toFixed(2) || "0.00"}</td>
                      <td>${totals.morning?.amount?.toFixed(2) || "0.00"}</td>
                      <td>${totals.evening?.liters?.toFixed(1) || "0.0"}</td>
                      <td>${totals.evening?.fat?.toFixed(1) || "0.0"}</td>
                      <td>${totals.evening?.snf?.toFixed(1) || "0.0"}</td>
                      <td>${totals.evening?.degree?.toFixed(1) || "0.0"}</td>
                      <td>${totals.evening?.rate?.toFixed(2) || "0.00"}</td>
                      <td>${totals.evening?.amount?.toFixed(2) || "0.00"}</td>
                      <td><strong>${totals.total.liters.toFixed(1)}</strong></td>
                      <td><strong>₹${totals.total.amount.toFixed(2)}</strong></td>
                    </tr>
                  `).join("")
              }
              ${Object.keys(dailyTotals).length > 0 ? `
                <tr class="total-row">
                  <td colspan="13"><strong>Grand Total:</strong></td>
                  <td><strong>${totalLiters} L</strong></td>
                  <td><strong>₹${totalAmount}</strong></td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          ${Object.keys(dailyTotals).length > 0 ? `
            <div class="summary">
              <h3>Summary:</h3>
              <p><strong>Total Records:</strong> ${recordCount}</p>
              <p><strong>Total Liters:</strong> ${totalLiters} L</p>
              <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
              <p><strong>Average per Day:</strong> ${(parseFloat(totalLiters) / Object.keys(dailyTotals).length || 0).toFixed(1)} L</p>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([printContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${getFarmerName(user)}_${period}_receipt_${toYYYYMMDD(new Date())}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`${period.charAt(0).toUpperCase() + period.slice(1)} receipt downloaded for ${getFarmerName(user)}`);
  };

  // Print receipt
  const printReceipt = () => {
    const printContent = document.getElementById("receipt-content").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 5px; text-align: center; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f0f8ff; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
            .no-data { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex w-full h-screen bg-white text-black overflow-hidden">
      <ToastContainer position="top-right" />

      {/* Sidebar */}
      <div className="w-[250px] bg-[#23243a]">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Milk Collection</h1>
            <p className="text-sm text-gray-600">
              Manage all milk collection records ({filteredUsers.length} farmers)
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search farmers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-sm px-4 py-2 pr-10 rounded focus:outline-none focus:border-blue-500 placeholder-gray-500 text-black w-64"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-500" />
              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                className="bg-gray-100 border border-gray-300 p-2 rounded text-black"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Farmer Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Mobile No
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Morning Collection
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Evening Collection
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Daily Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Add Milk
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Receipts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      <FiLoader className="animate-spin mx-auto text-blue-600" size={24} />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {filteredUsers.length === 0 ? "No farmers found" : "No farmers on this page"}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((user, index) => {
                    const dailyTotals = getUserDailyTotals(user.id, selectedDate);

                    return (
                      <tr key={user.id || `user-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                          {getFarmerName(user)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {getMobileNumber(user)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-medium">{dailyTotals.morning.liters.toFixed(1)} L</span>
                            <span className="text-xs text-green-600">₹{dailyTotals.morning.amount.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-medium">{dailyTotals.evening.liters.toFixed(1)} L</span>
                            <span className="text-xs text-green-600">₹{dailyTotals.evening.amount.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-bold text-blue-600">{dailyTotals.total.liters.toFixed(1)} L</span>
                            <span className="text-xs font-medium text-green-700">₹{dailyTotals.total.amount.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-200">
                          <button
                            onClick={() => handleAddMilk(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 mx-auto transition-colors"
                          >
                            <FiPlus size={12} />
                            Add Milk
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {/* View buttons */}
                            <button
                              onClick={() => triggerReceiptAction(user, "daily", "view")}
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="View Daily"
                            >
                              <FiEye size={10} />D
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "weekly", "view")}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="View Weekly"
                            >
                              <FiEye size={10} />W
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "monthly", "view")}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="View Monthly"
                            >
                              <FiEye size={10} />M
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "yearly", "view")}
                              className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="View Yearly"
                            >
                              <FiEye size={10} />Y
                            </button>

                            {/* Download buttons */}
                            <button
                              onClick={() => triggerReceiptAction(user, "daily", "download")}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Download Daily"
                            >
                              <FiDownload size={10} />D
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "weekly", "download")}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Download Weekly"
                            >
                              <FiDownload size={10} />W
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "monthly", "download")}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Download Monthly"
                            >
                              <FiDownload size={10} />M
                            </button>
                            <button
                              onClick={() => triggerReceiptAction(user, "yearly", "download")}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Download Yearly"
                            >
                              <FiDownload size={10} />Y
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-start fixed bottom-4">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 ml-2 py-1 rounded transition-colors ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Milk Entry Modal */}
      {showMilkModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add Milk Entry</h2>
                <p className="text-sm text-gray-600">
                  {getFarmerName(selectedUser)} - {getMobileNumber(selectedUser)}
                </p>
              </div>
              <button
                onClick={() => setShowMilkModal(false)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveMilkEntry}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <DatePicker
                    selected={milkFormData.date}
                    onChange={(date) => setMilkFormData((prev) => ({ ...prev, date }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    dateFormat="dd/MM/yyyy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
                  <select
                    name="timing"
                    value={milkFormData.timing}
                    onChange={handleMilkFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
                  <input
                    type="number"
                    name="liters"
                    value={milkFormData.liters}
                    onChange={handleMilkFormChange}
                    step="0.1"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat %</label>
                  <input
                    type="number"
                    name="fat"
                    value={milkFormData.fat}
                    onChange={handleMilkFormChange}
                    step="0.1"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SNF %</label>
                  <input
                    type="number"
                    name="snf"
                    value={milkFormData.snf}
                    onChange={handleMilkFormChange}
                    step="0.1"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    type="number"
                    name="degree"
                    value={milkFormData.degree}
                    onChange={handleMilkFormChange}
                    step="0.1"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹/L)</label>
                  <input
                    type="number"
                    name="rate"
                    value={milkFormData.rate}
                    onChange={handleMilkFormChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="col-span-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{calculateTotal(milkFormData.liters, milkFormData.rate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMilkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Month/Year Selector Modal */}
      {showMonthYearSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Select Period</h2>
              <button
                onClick={() => setShowMonthYearSelector(false)}
                className="text-gray-500 hover:text-red-500"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedReceiptYear}
                  onChange={(e) => setSelectedReceiptYear(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              {receiptConfig?.period === "monthly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={selectedReceiptMonth}
                    onChange={(e) => setSelectedReceiptMonth(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMonthYearSelector(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReceipt}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {receiptPeriod.charAt(0).toUpperCase() + receiptPeriod.slice(1)} Receipt
                </h2>
                <p className="text-sm text-gray-600">
                  {getFarmerName(receiptData.user)} - {getMobileNumber(receiptData.user)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={printReceipt}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <FiPrinter size={16} />
                  Print
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto" id="receipt-content">
              <div className="header text-center mb-6 border-b-2 border-gray-300 pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Milk Collection Receipt</h1>
                <p className="text-gray-600">Generated on: {new Date().toLocaleDateString("en-IN")}</p>
              </div>

              <div className="farmer-info mb-6">
                <h3 className="text-lg font-semibold mb-2">Farmer Details:</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <p><strong>Name:</strong> {getFarmerName(receiptData.user)}</p>
                  <p><strong>Mobile:</strong> {getMobileNumber(receiptData.user)}</p>
                  <p><strong>Period:</strong> {receiptData.period.charAt(0).toUpperCase() + receiptData.period.slice(1)}</p>
                  <p><strong>Date Range:</strong> {receiptData.startDate.toLocaleDateString("en-IN")} - {receiptData.endDate.toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Collection Details:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th rowSpan="2" className="border p-2">Date</th>
                        <th colSpan="6" className="border p-2 bg-blue-50">Morning</th>
                        <th colSpan="6" className="border p-2 bg-orange-50">Evening</th>
                        <th rowSpan="2" className="border p-2 bg-green-50">Daily Total (L)</th>
                        <th rowSpan="2" className="border p-2 bg-green-50">Daily Total (₹)</th>
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border p-1 bg-blue-50">Liters</th>
                        <th className="border p-1 bg-blue-50">Fat</th>
                        <th className="border p-1 bg-blue-50">SNF</th>
                        <th className="border p-1 bg-blue-50">Degree</th>
                        <th className="border p-1 bg-blue-50">Rate</th>
                        <th className="border p-1 bg-blue-50">Amount</th>
                        <th className="border p-1 bg-orange-50">Liters</th>
                        <th className="border p-1 bg-orange-50">Fat</th>
                        <th className="border p-1 bg-orange-50">SNF</th>
                        <th className="border p-1 bg-orange-50">Degree</th>
                        <th className="border p-1 bg-orange-50">Rate</th>
                        <th className="border p-1 bg-orange-50">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(receiptData.dailyTotals).length === 0 ? (
                        <tr>
                          <td colSpan={14} className="border p-4 text-center text-gray-500">
                            No records found for this period
                          </td>
                        </tr>
                      ) : (
                        Object.entries(receiptData.dailyTotals)
                          .sort(([a], [b]) => new Date(a) - new Date(b))
                          .map(([date, totals]) => (
                            <tr key={date} className="hover:bg-gray-50 text-center">
                              <td className="border p-2">
                                {new Date(date).toLocaleDateString("en-IN")}
                              </td>

                              {/* Morning Data */}
                              <td className="border p-2">{totals.morning?.liters?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.morning?.fat?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.morning?.snf?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.morning?.degree?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.morning?.rate?.toFixed(2) || "0.00"}</td>
                              <td className="border p-2">₹{totals.morning?.amount?.toFixed(2) || "0.00"}</td>

                              {/* Evening Data */}
                              <td className="border p-2">{totals.evening?.liters?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.evening?.fat?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.evening?.snf?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.evening?.degree?.toFixed(1) || "0.0"}</td>
                              <td className="border p-2">{totals.evening?.rate?.toFixed(2) || "0.00"}</td>
                              <td className="border p-2">₹{totals.evening?.amount?.toFixed(2) || "0.00"}</td>

                              {/* Daily Totals */}
                              <td className="border p-2 font-bold">{totals.total.liters.toFixed(1)}</td>
                              <td className="border p-2 font-bold">₹{totals.total.amount.toFixed(2)}</td>
                            </tr>
                          ))
                      )}
                      {Object.entries(receiptData.dailyTotals).length > 0 && (
                        <tr className="bg-gray-200 font-bold text-center">
                          <td className="border p-2" colSpan={13}>Grand Total:</td>
                          <td className="border p-2">{receiptData.totalLiters} L</td>
                          <td className="border p-2">₹{receiptData.totalAmount}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {Object.entries(receiptData.dailyTotals).length > 0 && (
                <div className="summary bg-blue-50 p-4 rounded">
                  <h3 className="text-lg font-semibold mb-3">Summary:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-2 bg-white rounded-lg shadow">
                      <p className="text-2xl font-bold text-blue-600">{receiptData.recordCount}</p>
                      <p className="text-sm text-gray-600">Total Records</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg shadow">
                      <p className="text-2xl font-bold text-green-600">{receiptData.totalLiters} L</p>
                      <p className="text-sm text-gray-600">Total Liters</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg shadow">
                      <p className="text-2xl font-bold text-purple-600">₹{receiptData.totalAmount}</p>
                      <p className="text-sm text-gray-600">Total Amount</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg shadow">
                      <p className="text-2xl font-bold text-orange-600">
                        {(parseFloat(receiptData.totalLiters) / Object.keys(receiptData.dailyTotals).length || 0).toFixed(1)} L
                      </p>
                      <p className="text-sm text-gray-600">Average per Day</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Updated Modal Footer with WhatsApp Button */}
            <div className="flex justify-end gap-3 p-4 border-t mt-auto">
              <button
                onClick={() => downloadReceiptHtml(receiptData)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FiDownload size={16} />
                Download Receipt
              </button>
              
              {/* NEW WHATSAPP BUTTON */}
              <button
                onClick={handleSendWhatsApp}
                disabled={isSendingWhatsApp}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:bg-teal-400 disabled:cursor-not-allowed"
              >
                {isSendingWhatsApp ? (
                  <FiLoader className="animate-spin" size={16} />
                ) : (
                  <FiMessageSquare size={16} />
                )}
                {isSendingWhatsApp ? 'Sending...' : 'Send via WhatsApp'}
              </button>
              
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkCollectionPage;
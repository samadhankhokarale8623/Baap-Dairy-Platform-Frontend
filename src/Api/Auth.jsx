import axios from "axios";

// 1. Render वर टाकलेली URL Environment Variable मधून आपोआप येईल.
// 2. जर व्हेरिएबल सापडला नाही (म्हणजे लोकल कॉम्प्युटरवर चालवताना),
//    तर तो 'http://localhost:3000/api' ही डीफॉल्ट URL वापरेल.
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// डीबगिंगसाठी: कन्सोलमध्ये कोणती URL वापरली जात आहे ते तपासा.
console.log("Using API Base URL:", apiUrl);

export const API = axios.create({
  // baseURL आता 'apiUrl' या व्हेरिएबलमधून येईल.
  baseURL: apiUrl,
  withCredentials: false,
});

// Auth APIs

export const login = async (credentials) => {
  const response = await API.post("/auth/login", credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

// Dashboard APIs
export const getDashboardStats = async () => {
  const response = await API.get("/dashboard/stats");
  return response.data;
};

// Milk APIs
export const addMilkEntry = async (data) => {
    const response = await API.post("/milk/add", data);
    return response.data;
};

export const getMilkData = async () => {
    const response = await API.get("/milk/all");
    return response.data;
};

export const filterMilkByDate = async (date) => {
    const response = await API.get("/milk/filter", { params: { date } });
    return response.data;
};

// *** UPDATED: updateMilkEntry आणि deleteMilkEntry फंक्शन्सना response.data परत करण्यासाठी अपडेट केले आहे ***
export const updateMilkEntry = async (id, data) => {
    const response = await API.put(`/milk/update/${id}`, data);
    return response.data;
};

export const deleteMilkEntry = async (id) => {
    const response = await API.delete(`/milk/delete/${id}`);
    return response.data;
};


// User Management APIs - Fixed endpoints
export const getUsers = async () => {
    const response = await API.get("/auth/users");
    // API response थेट data property मध्ये असू शकतो, म्हणून दोन्ही केसेस हाताळल्या आहेत.
    return response.data.data || response.data;
};


export const updateUser = async (userData) => {
  console.log('Updating user with data:', userData);
  const response = await API.put(`/auth/users/${userData.id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  console.log('Deleting user with ID:', id);
  const response = await API.delete(`/auth/users/${id}`);
  return response.data;
};

export const sendWhatsAppReceipt = async (receiptData) => {
  // Pass the whole receiptData object
  const response = await API.post("/whatsapp/send-receipt", { receiptData });
  return response.data;
};
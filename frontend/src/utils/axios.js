import axios from 'axios';

// Base instance — all API calls use this
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api',
  withCredentials: true,  // Send cookies with every request
});

export default API;
import axios from 'axios';

// Base instance — all API calls use this
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,  // Send cookies with every request
});

export default API;
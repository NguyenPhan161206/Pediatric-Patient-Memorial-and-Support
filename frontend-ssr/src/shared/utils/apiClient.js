const axios = require('axios');

const baseURL = process.env.BACKEND_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Response interceptor để chuẩn hóa dữ liệu trả về
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorDetails = error.response ? error.response.data : { message: error.message };
    return Promise.reject(errorDetails);
  }
);

module.exports = apiClient;

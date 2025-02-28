import axios from "axios";

// Appwrite API instance
export const appwriteApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Prediction API instance for JSON requests
export const predictionApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_PREDICTION_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Prediction API instance for form-data requests
export const predictionFormApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_PREDICTION_API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Request interceptor for handling errors
const handleError = (error) => {
  if (error.response) {
    console.error("Response Error:", error.response.data);
  } else if (error.request) {
    console.error("Request Error:", error.request);
  } else {
    console.error("Error:", error.message);
  }
  return Promise.reject(error);
};

// Add error handling to all instances
appwriteApi.interceptors.response.use((response) => response, handleError);
predictionApi.interceptors.response.use((response) => response, handleError);
predictionFormApi.interceptors.response.use((response) => response, handleError);

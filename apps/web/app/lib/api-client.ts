import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // CRITICAL: This allows Better Auth cookies to pass through
  headers: {
    "Content-Type": "application/json",
  },
});
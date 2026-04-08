import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_DIRECT_API_URL ?? "http://localhost:4300/api",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json"
  }
});

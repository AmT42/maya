import axios from 'axios';

const API = axios.create({
    baseURL : 'http://backend-url'
})

export const loginUser = (credentials) => API.post("/login", credentials)
// ... other API calls
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // TODO: Make configurable via ENV
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

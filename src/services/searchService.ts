import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api/v1';

export const searchService = {
  search: async (params: any) => {
    const res = await axios.get(`${API_URL}/search`, { params });
    return res.data;
  },

  getSuggestions: async (query: string) => {
    const res = await axios.get(`${API_URL}/search/suggestions`, { params: { query } });
    return res.data.suggestions;
  },

  getTrending: async () => {
    const res = await axios.get(`${API_URL}/search/trending`);
    return res.data.trending;
  },

  getRecent: async () => {
    const res = await axios.get(`${API_URL}/search/recent`);
    return res.data.recent;
  },

  saveHistory: async (query: string) => {
    const res = await axios.post(`${API_URL}/search/history`, { query });
    return res.data;
  },

  deleteHistory: async () => {
    const res = await axios.delete(`${API_URL}/search/history`);
    return res.data;
  },

  searchBarcode: async (barcode: string) => {
    const res = await axios.get(`${API_URL}/search/barcode/${barcode}`);
    return res.data;
  },
};

export default searchService;

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api';

export const categoryService = {
  getAll: async () => {
    const res = await axios.get(`${API_URL}/categories`);
    return res.data.categories;
  },

  getTree: async () => {
    const res = await axios.get(`${API_URL}/categories/tree`);
    return res.data.categories;
  },

  getDropdown: async () => {
    const res = await axios.get(`${API_URL}/categories/dropdown`);
    return res.data.categories;
  },

  getById: async (id) => {
    const res = await axios.get(`${API_URL}/categories/${id}`);
    return res.data.category;
  },

  create: async (formData) => {
    const res = await axios.post(`${API_URL}/categories`, formData);
    return res.data.category;
  },

  update: async (id, formData) => {
    const res = await axios.put(`${API_URL}/categories/${id}`, formData);
    return res.data.category;
  },

  delete: async (id) => {
    const res = await axios.delete(`${API_URL}/categories/${id}`);
    return res.data;
  },
};
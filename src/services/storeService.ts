import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500/api/v1';

export const storeService = {
  getNearby: async (params: any) => {
    const res = await axios.get(`${API_URL}/stores/nearby`, { params });
    return res.data;
  },

  getStore: async (slug: string) => {
    const res = await axios.get(`${API_URL}/stores/${slug}`);
    return res.data.data;
  },

  getCatalog: async (id: string) => {
    const res = await axios.get(`${API_URL}/stores/${id}/catalog`);
    return res.data.catalog;
  },

  getOffers: async (id: string) => {
    const res = await axios.get(`${API_URL}/stores/${id}/offers`);
    return res.data.offers;
  },

  getReviews: async (id: string) => {
    const res = await axios.get(`${API_URL}/stores/${id}/reviews`);
    return res.data.reviews;
  },

  getFavourites: async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/stores/favourites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.favourites;
  },

  addFavourite: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_URL}/stores/${id}/favourite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  removeFavourite: async (id: string) => {
    const token = localStorage.getItem('token');
    const res = await axios.delete(`${API_URL}/stores/${id}/favourite`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export default storeService;

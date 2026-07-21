import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api/v1';

export const checkoutService = {
  getQuote: async (payload: {
    items: Array<{ storeProductId: string; quantity: number }>;
    lat?: number;
    lng?: number;
    couponCode?: string;
    useWallet?: boolean;
    deliverySlotId?: string;
  }) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_URL}/checkout/quote`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.quote;
  },
};

export default checkoutService;

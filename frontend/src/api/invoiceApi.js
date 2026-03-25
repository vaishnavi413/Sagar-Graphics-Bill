import axios from "axios";

const API_URL = "https://sagar-graphics-bill-backend.onrender.com/api/invoices";

export const fetchInvoices = async () => {
  try {
    const response = await axios.get(API_URL);
    console.log("Fetched Invoices:", response.data); // Debugging
    return response.data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post(API_URL, invoiceData);
    return response.data;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error; // Throwing error so frontend can catch it
  }
};

export const deleteInvoice = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
};

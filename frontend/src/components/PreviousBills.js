import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInvoices, deleteInvoice } from "../api/invoiceApi";
import "../components/InvoiceGenerator.css";

const PreviousBills = () => {
  const [previousBills, setPreviousBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBills = async () => {
      try {
        const bills = await fetchInvoices();
        const normalizedBills = (bills || []).map(bill => {
          const grandTotal = bill.totals?.grandTotal || bill.grandTotal || bill.totalAmount || bill.subtotal || 0;
          return {
            ...bill,
            invoiceNo: bill.invoiceNo || bill.invoiceNumber || "--",
            clientName: bill.clientName || bill.customerName || bill.client_name || "Unnamed client",
            invoiceDate: bill.invoiceDate || (bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "--"),
            items: (bill.items || []).map(item => ({
              ...item,
              particulars: item.particulars || item.description || "--",
              qty: item.qty || item.quantity || 0,
              rate: item.rate || 0,
              amount: item.amount || 0
            })),
            totals: bill.totals || {
              taxableAmount: bill.taxableAmount || bill.subtotal || 0,
              taxAmount: (bill.cgst || 0) + (bill.sgst || 0) || bill.taxAmount || 0,
              roundOff: bill.roundOff || 0,
              grandTotal: grandTotal
            }
          };
        });
        setPreviousBills(normalizedBills);
      } catch (err) {
        console.error("Failed to fetch from API, falling back to local storage", err);
        const savedBills = JSON.parse(localStorage.getItem("bills")) || [];
        setPreviousBills(savedBills);
      } finally {
        setLoading(false);
      }
    };
    loadBills();
  }, []);

  const viewBill = (bill) => {
    navigate(`/view-bill/${bill.invoiceNo}`, { state: { bill } });
  };

  const editBill = (bill) => {
    navigate("/", { state: { billToEdit: bill } });
  };

  const handleDelete = async (bill) => {
    if (!window.confirm(`Are you sure you want to delete Invoice #${bill.invoiceNo}?`)) return;

    try {
      // 1. Delete from Database if it has an _id (MongoDB)
      if (bill._id) {
        await deleteInvoice(bill._id);
      }

      // 2. Delete from Local Storage (Backup)
      const localBills = JSON.parse(localStorage.getItem("bills")) || [];
      const updatedLocal = localBills.filter(b => b.invoiceNo !== bill.invoiceNo);
      localStorage.setItem("bills", JSON.stringify(updatedLocal));

      // 3. Update UI
      setPreviousBills(previousBills.filter(b => b.invoiceNo !== bill.invoiceNo));
      alert("Bill deleted successfully from Database and Local Storage.");
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete bill from database.");
    }
  };

  if (loading) return <div className="amazon-billing-container"><p>Loading bills...</p></div>;

  return (
    <div className="amazon-billing-container">
      <div className="no-print controls-card">
        <h3>Bill History</h3>
        <button className="amz-btn-primary" onClick={() => navigate("/")}>← Back to Generator</button>
      </div>

      <div className="amazon-invoice">
        <h2 className="tax-invoice-tag">PREVIOUS ESTIMATES / BILLS</h2>
        {previousBills.length === 0 ? (
          <p>No bills found in History.</p>
        ) : (
          <table className="amz-table">
            <thead>
              <tr>
                <th>INVOICE</th>
                <th>Client Name</th>
                <th>Date</th>
                <th style={{textAlign: 'right'}}>Total Amount</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {previousBills.map((bill) => (
                <tr key={bill._id || bill.invoiceNo}>
                  <td>INV {bill.invoiceNo}</td>
                  <td><b>{bill.clientName}</b></td>
                  <td>{bill.invoiceDate}</td>
                  <td style={{textAlign: 'right'}}>₹{bill.totals?.grandTotal?.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td style={{textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                    <button className="amz-btn-view" style={{padding: '5px 15px'}} onClick={() => viewBill(bill)}>View</button>
                    <button className="amz-btn-secondary" style={{padding: '5px 15px'}} onClick={() => editBill(bill)}>Edit</button>
                    <button className="del-btn" title="Delete Permanent" onClick={() => handleDelete(bill)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PreviousBills;

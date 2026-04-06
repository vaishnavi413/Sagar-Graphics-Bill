import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import "../components/InvoiceGenerator.css";
import logo from "../assets/sagar_graphics_logo.png";
import upiQR from "../assets/upi_qr_code.png";
import { createInvoice, fetchInvoices, updateInvoice } from "../api/invoiceApi";

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const billToEdit = location.state?.billToEdit;

  useEffect(() => {
    if (billToEdit) {
      setInvoiceNo(billToEdit.invoiceNo);
      
      let dateVal = billToEdit.invoiceDate;
      if (dateVal && dateVal.includes('/')) {
        const parts = dateVal.split('/');
        if (parts.length === 3) {
           dateVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (dateVal && dateVal.includes('-')) {
         const parts = dateVal.split('-');
         if (parts[2].length === 4) { // DD-MM-YYYY
            dateVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
         }
      }
      setInvoiceDate(dateVal);
      setClientName(billToEdit.clientName !== "Unnamed client" && billToEdit.clientName !== "N/A" ? billToEdit.clientName : "");
      setClientAddress(billToEdit.clientAddress || "");
      setPlaceOfSupply(billToEdit.placeOfSupply || "27-MAHARASHTRA");
      setItems(billToEdit.items && billToEdit.items.length > 0 ? billToEdit.items : [{ id: 1, particulars: "", hsn: "", qty: "", rate: "", amount: 0 }]);
      return;
    }

    const fetchNextNo = async () => {
      try {
        const invoices = await fetchInvoices();
        if (invoices && invoices.length > 0) {
          const maxNo = Math.max(...invoices.map(inv => inv.invoiceNo || 0));
          setInvoiceNo(maxNo + 1);
        } else {
          setInvoiceNo(1);
        }
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      }
    };
    fetchNextNo();
  }, [billToEdit]);

  const [invoiceNo, setInvoiceNo] = useState(1);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("27-MAHARASHTRA");

  const [items, setItems] = useState([
    { id: 1, particulars: "", hsn: "", qty: "", rate: "", amount: 0 }
  ]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "qty" || field === "rate") {
      const q = parseFloat(newItems[index].qty) || 0;
      const r = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = q * r;
    }
    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { id: items.length + 1, particulars: "", hsn: "", qty: "", rate: "", amount: 0 }]);

  const deleteItem = (id) => {
    if (items.length === 1) return; // Prevent deleting the last item
    const filteredItems = items.filter(item => item.id !== id);
    const reindexedItems = filteredItems.map((item, index) => ({ ...item, id: index + 1 }));
    setItems(reindexedItems);
  };

  const calculateTotals = () => {
    const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);
    return { taxableAmount: grandTotal, taxAmount: 0, roundOff: 0, grandTotal };
  };

  const saveBill = async () => {
    if (!invoiceDate || !clientName) {
      alert("Please enter Invoice Date and Client Details.");
      return;
    }
    const totals = calculateTotals();
    const billData = {
      invoiceNo,
      invoiceDate,
      clientName,
      clientAddress,
      placeOfSupply,
      items,
      totals,
      businessName: "Sagar Graphics"
    };

    // Save to Local Storage (Backup)
    const savedBills = JSON.parse(localStorage.getItem("bills")) || [];
    if (billToEdit) {
      const index = savedBills.findIndex(b => b.invoiceNo === billData.invoiceNo);
      if (index !== -1) savedBills[index] = billData;
      else savedBills.push(billData);
    } else {
      savedBills.push(billData);
    }
    localStorage.setItem("bills", JSON.stringify(savedBills));

    // Save to MongoDB via API
    try {
      if (billToEdit && billToEdit._id) {
        await updateInvoice(billToEdit._id, billData);
        alert("Bill updated successfully in MongoDB!");
      } else {
        await createInvoice(billData);
        alert("Bill saved successfully to MongoDB!");
      }
    } catch (err) {
      console.error("API Save failed", err);
      alert("Bill saved locally, but failed to sync for now.");
    }

    if (!billToEdit) {
      setInvoiceNo(invoiceNo + 1);
    }
    setItems([{ id: 1, particulars: "", hsn: "", qty: "", rate: "", amount: 0 }]);
    setClientName("");
    setClientAddress("");
    setInvoiceDate("");
    navigate("/previous-bills");
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `invoice no ${invoiceNo}`;
    window.print();
    document.title = originalTitle;
  };

  const numberToWords = (num) => {
    if (num === 0) return "Zero Rupees";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertBelowHundred = (n) => {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    };

    const convertBelowThousand = (n) => {
      let str = "";
      if (Math.floor(n / 100) > 0) {
        str += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n > 0) str += convertBelowHundred(n);
      return str.trim();
    };

    let result = "";
    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);

    const crore = Math.floor(integerPart / 10000000);
    integerPart %= 10000000;
    const lakh = Math.floor(integerPart / 100000);
    integerPart %= 100000;
    const thousand = Math.floor(integerPart / 1000);
    integerPart %= 1000;
    const hundred = integerPart;

    if (crore > 0) result += convertBelowThousand(crore) + " Crore ";
    if (lakh > 0) result += convertBelowThousand(lakh) + " Lakh ";
    if (thousand > 0) result += convertBelowThousand(thousand) + " Thousand ";
    if (hundred > 0) result += convertBelowThousand(hundred);

    result = result.trim() + " Rupees";
    if (decimalPart > 0) {
      result += " and " + convertBelowHundred(decimalPart) + " Paise";
    }
    return `INR ${result.trim()} Only.`;
  };

  const totals = calculateTotals();

  return (
    <div className="amazon-billing-container">
      <div className="no-print controls-card">
        <h3>Invoice Controls</h3>
        <div className="toolbar">
          <button className="amz-btn-primary" onClick={addItem}>+ Add Item</button>
          <button className="amz-btn-secondary" onClick={saveBill}>{billToEdit ? "Update Bill" : "Save & Sync"}</button>
          <button className="amz-btn-view" onClick={() => navigate("/previous-bills")}>View History</button>
          <button className="amz-btn-print" onClick={handlePrint}>Print Invoice</button>
        </div>
      </div>

      <div className="amazon-invoice">
        <header className="amz-header">
          <div className="header-left">
            <h2 className="tax-invoice-tag">INVOICE BILL</h2>
            <div className="seller-details">
              <h1>Sagar Graphics</h1>
              <p className="mfg-subtitle">Graphic Design & Printing Services</p>
              <div className="contact-grid">
                <p>Mob.: 9767216218 / 8805502960</p>
              </div>
              <div className="multi-address-flex">
                <p><b>Regd. Office:</b> Shop No 17, Siddivinayak Building, Narpatgiri Chowk, Somwar Peth, Pune 411011.</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <img src={logo} alt="Sagar Graphics Logo" className="amz-logo" />
            <p className="recipient-marking">Original for Recipient</p>
          </div>
        </header>

        <section className="invoice-meta-grid dual-col">
          <div className="meta-col">
            <p><b>Invoice : </b> {invoiceNo}</p>
            <p><b>Place of Supply:</b>
              <input
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                className="inline-input"
              />
            </p>
          </div>
          <div className="meta-col">
            <p><b>Invoice Date:</b>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                min="2026-04-01"
                max="2027-03-31"
                className="inline-input"
              />
            </p>
          </div>
        </section>

        <section className="address-grid single-col">
          <div className="address-col">
            <p className="address-title">Customer Details:</p>
            <textarea
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Full Customer Name"
              rows={2}
            />
          </div>
          <div className="address-col full-width">
            <p className="address-title">Billing Address:</p>
            <textarea
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Complete Billing Address"
              rows={4}
            />
          </div>
        </section>

        <div className="amz-table-wrapper">
          <table className="amz-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr.No</th>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Rate/Item</th>
                <th colSpan="2">Amount</th>
                <th className="no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      className="item-name-input"
                      value={item.particulars}
                      onChange={(e) => handleItemChange(index, "particulars", e.target.value)}
                      placeholder="Item Name"
                    />
                  </td>
                  <td><input type="number" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} /></td>
                  <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} /></td>
                  <td colSpan="2">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="no-print">
                    <button className="del-btn" onClick={() => deleteItem(item.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-summary-row">
                <td colSpan="4"></td>
                <td className="total-label">Subtotal</td>
                <td className="total-value" colSpan="2">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="grand-total-amz">
                <td colSpan="4" className="amount-words-cell">
                  <span>Total Amount (in words):</span>
                  <p>{numberToWords(totals.grandTotal)}</p>
                </td>
                <td className="total-label">Total</td>
                <td className="total-value" colSpan="2">₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="amz-footer">
          <div className="footer-top">
            <div className="bank-info-qr">
              <div className="bank-card">
                <p className="card-title">Bank Details:</p>
                <p><b>Bank:</b> HDFC BANK</p>
                <p><b>A/C #:</b> 50200048433801</p>
                <p><b>IFSC:</b> HDFC0005383</p>
                <p><b>Branch:</b> Somwar Peth</p>
                <p><b>A/C Name:</b> SAGAR GRAPHICS</p>
              </div>
              <div className="qr-card">
                <p className="card-title">Pay using UPI:</p>
                <div className="qr-container">
                  <img src={upiQR} alt="UPI QR Code" className="upi-qr-image" />
                  <p className="qr-text">Scan to Pay</p>
                </div>
              </div>
            </div>
            <div className="signature-box">
              <p>For Sagar Graphics</p>
              <div className="sign-stamp"></div>
              <p className="auth-sign">Authorized Signatory</p>
            </div>
          </div>

          <div className="terms-notes">
            <p><b>Notes:</b> Thank you for your Business!</p>
            <p><b>Terms and Conditions:</b></p>
            <ol>
              <li>Goods once sold cannot be taken back or exchanged.</li>
              <li>Interest @24% p.a. will be charged for uncleared bills beyond 30 days.</li>
              <li>Subject to local Jurisdiction.</li>
            </ol>
          </div>

          <p className="footer-disclaimer">This is a digitally signed document generated by Sagar Graphics (+91 9767216218) Billing System.</p>
        </section>
      </div>
    </div>
  );
};

export default InvoiceGenerator;

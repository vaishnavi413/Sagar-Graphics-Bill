import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/sagar_graphics_logo.png";
import upiQR from "../assets/upi_qr_code.png";
import "../components/InvoiceGenerator.css";

const ViewBill = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const rawBill = state?.bill || {};

  // Normalize bill data for backward compatibility (maps old keys to new)
  const normalizedGrandTotal = rawBill.totals?.grandTotal || rawBill.grandTotal || rawBill.totalAmount || rawBill.subtotal || 0;
  const bill = {
    ...rawBill,
    invoiceNo: rawBill.invoiceNo || rawBill.invoiceNumber || "--",
    clientName: rawBill.clientName || rawBill.customerName || rawBill.client_name || "N/A",
    clientAddress: rawBill.clientAddress || rawBill.address || "N/A",
    invoiceDate: rawBill.invoiceDate || (rawBill.createdAt ? new Date(rawBill.createdAt).toLocaleDateString() : "--"),
    items: (rawBill.items || []).map(item => ({
      ...item,
      particulars: item.particulars || item.description || "--",
      qty: item.qty || item.quantity || 0,
      rate: item.rate || 0,
      amount: item.amount || 0
    })),
    totals: (rawBill.totals && Object.keys(rawBill.totals).length > 0) ? rawBill.totals : {
      taxableAmount: rawBill.taxableAmount || rawBill.subtotal || 0,
      taxAmount: 0,
      roundOff: rawBill.roundOff || 0,
      grandTotal: normalizedGrandTotal,
    }
  };

  if (!rawBill.invoiceNo && !rawBill.invoiceNumber) {
    return <div className="amazon-billing-container"><p>No bill data found.</p><button className="amz-btn-primary" onClick={() => navigate("/")}>Go Home</button></div>;
  }

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `INV ${bill.invoiceNo} ${bill.clientName}`;
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

  const totals = bill.totals || { taxableAmount: 0, taxAmount: 0, grandTotal: 0 };

  return (
    <div className="amazon-billing-container">
      <div className="actions-bar no-print">
        <button className="amz-btn-primary" onClick={() => navigate("/")}>← Back to Home</button>
        <button className="amz-btn-print" onClick={handlePrint}>Print This Bill</button>
      </div>

      <div className="amazon-invoice printable">
        <header className="amz-header">
          <div className="header-left">
            <h2 className="tax-invoice-tag">ESTIMATE / BILL</h2>
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
            <p><b>Invoice : </b> {bill.invoiceNo}</p>
            <p><b>Place of Supply:</b> {bill.placeOfSupply}</p>
          </div>
          <div className="meta-col">
            <p><b>Invoice Date:</b> {bill.invoiceDate}</p>
          </div>
        </section>

        <section className="address-grid single-col">
          <div className="address-col">
            <p className="address-title">Customer Details:</p>
            <p>{bill.clientName}</p>
          </div>
          <div className="address-col full-width">
            <p className="address-title">Billing Address:</p>
            <p style={{whiteSpace: 'pre-wrap'}}>{bill.clientAddress}</p>
          </div>
        </section>

        <div className="amz-table-wrapper">
          <table className="amz-table">
            <thead>
              <tr>
                <th style={{width: '40px'}}>#</th>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Rate/Item</th>
                <th colSpan="2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <p style={{fontWeight: 'bold', margin: '0 0 5px 0'}}>{item.particulars}</p>
                  </td>
                  <td>{item.qty}</td>
                  <td>₹{parseFloat(item.rate).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td colSpan="2">₹{item.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-summary-row">
                <td colSpan="4"></td>
                <td className="total-label">Subtotal</td>
                <td className="total-value">₹{totals.taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr className="grand-total-amz">
                <td colSpan="4" className="amount-words-cell">
                  <span>Total Amount (in words):</span>
                  <p>{numberToWords(totals.grandTotal)}</p>
                </td>
                <td className="total-label">Total</td>
                <td className="total-value">₹{totals.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
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
              <li>Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</li>
              <li>Subject to local Jurisdiction.</li>
            </ol>
          </div>
          
          <p className="footer-disclaimer">This is a digitally signed document generated by Sagar Graphics Billing System.</p>
        </section>
      </div>
    </div>
  );
};

export default ViewBill;


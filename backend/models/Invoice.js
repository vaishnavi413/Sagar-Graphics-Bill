import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
    invoiceNo: Number,
    invoiceDate: String,
    dueDate: String,
    clientName: String,
    clientAddress: String,
    placeOfSupply: String,
    items: [
        {
            particulars: String,
            qty: Number,
            rate: Number,
            amount: Number,
        },
    ],
    totals: {
        taxableAmount: Number,
        taxAmount: Number,
        roundOff: Number,
        grandTotal: Number,
    },
    businessName: String
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", InvoiceSchema, "sagar_graphics_invoices");
export default Invoice;

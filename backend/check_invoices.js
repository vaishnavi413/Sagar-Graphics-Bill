import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

async function checkInvoices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);
        console.log(JSON.stringify(invoices, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkInvoices();

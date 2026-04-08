import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';
import { appendToExcel, sendBackupEmail } from './utils/backup.js';

dotenv.config();

async function triggerBackup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find invoices created today (based on server time)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const invoices = await Invoice.find({
            createdAt: { $gte: startOfToday }
        });
        
        console.log(`Found ${invoices.length} invoices created today.`);
        
        for (const invoice of invoices) {
            await appendToExcel(invoice);
        }
        
        if (invoices.length > 0) {
            await sendBackupEmail();
            console.log("Email triggered.");
        } else {
            console.log("No invoices found for today. Checking all invoices to ensure file is generated if that's what user wants.");
            // If they just want the file, even if empty or from some specific bills
            // they might have saved in the last hour.
            const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);
            for (const invoice of recentInvoices) {
                await appendToExcel(invoice);
            }
            await sendBackupEmail();
        }
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

triggerBackup();

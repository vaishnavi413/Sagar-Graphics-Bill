import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    console.log("Start of Today (Local):", startOfToday);
    console.log("Start of Today (ISO):", startOfToday.toISOString());
    
    const todayCount = await Invoice.countDocuments({
        $or: [
            { createdAt: { $gte: startOfToday } },
            { updatedAt: { $gte: startOfToday } }
        ]
    });
    console.log("Today's Invoice Count:", todayCount);
    
    const lastOne = await Invoice.findOne().sort({ createdAt: -1 });
    if (lastOne) {
        console.log("Last Invoice CreatedAt:", lastOne.createdAt);
        console.log("Last Invoice UpdatedAt:", lastOne.updatedAt);
    }
    process.exit(0);
}

check();

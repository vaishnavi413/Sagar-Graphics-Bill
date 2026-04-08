import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const EXCEL_FILE_PATH = path.join(process.cwd(), 'backups', 'invoices_backup.xlsx');

import Invoice from '../models/Invoice.js';

export const appendToExcel = async (invoice) => {
  try {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    console.log(`--- Syncing daily backup for ${today} ---`);
    
    // Find all invoices and filter for today/yesterday to handle morning reports
    const allInvoices = await Invoice.find().sort({ invoiceNo: 1 });
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    let todayInvoices = allInvoices.filter(inv => {
      const createdDate = inv.createdAt.toLocaleDateString('en-CA');
      const updatedDate = inv.updatedAt.toLocaleDateString('en-CA');
      // Include anything from today or yesterday for the morning report logic
      return createdDate === todayStr || updatedDate === todayStr || 
             createdDate === yesterdayStr || updatedDate === yesterdayStr;
    });

    // Fallback: If the current invoice we just saved isn't caught, add it
    if (invoice && invoice._id && !todayInvoices.find(inv => String(inv._id) === String(invoice._id))) {
      todayInvoices.push(invoice);
    }

    console.log(`Final backup list includes ${todayInvoices.length} invoices (Today + Yesterday).`);



    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Invoices');

    worksheet.columns = [
      { header: 'Invoice No', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'invoiceDate', width: 15 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Client Address', key: 'clientAddress', width: 30 },
      { header: 'Place of Supply', key: 'placeOfSupply', width: 20 },
      { header: 'Taxable Amount', key: 'taxableAmount', width: 15 },
      { header: 'Tax Amount', key: 'taxAmount', width: 15 },
      { header: 'Grand Total', key: 'grandTotal', width: 15 },
      { header: 'Items (Particulars)', key: 'items', width: 40 },
    ];

    for (const inv of todayInvoices) {
      const itemsText = (inv.items || []).map(item => `${item.particulars} (Qty: ${item.qty}, Rate: ${item.rate})`).join('; ');
      
      worksheet.addRow({
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        clientName: inv.clientName,
        clientAddress: inv.clientAddress,
        placeOfSupply: inv.placeOfSupply,
        taxableAmount: inv.totals?.taxableAmount || 0,
        taxAmount: inv.totals?.taxAmount || 0,
        grandTotal: inv.totals?.grandTotal || 0,
        items: itemsText
      });
    }

    // Ensure directory exists
    const folderPath = path.dirname(EXCEL_FILE_PATH);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    console.log(`Excel backup file rebuilt successfully with ${todayInvoices.length} bills.`);
  } catch (error) {
    console.error('CRITICAL ERROR in appendToExcel:', error);
  }
};





export const sendBackupEmail = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not set. Skipping backup email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,
    subject: 'Daily Invoice Backup - Sagar Graphics',
    text: `Hello, please find the attached daily backup of your invoices for ${new Date().toLocaleDateString('en-CA')}.`,
    attachments: [
      {
        filename: 'invoices_backup.xlsx',
        path: EXCEL_FILE_PATH
      }
    ]
  };

  try {
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      await transporter.sendMail(mailOptions);
      console.log('Daily backup email sent successfully');
    } else {
      console.log('No backup file found to send.');
    }
  } catch (error) {
    console.error('Error sending backup email:', error);
  }
};

// Schedule: Every day at 08:00 AM
cron.schedule('0 8 * * *', () => {
  console.log('Running morning backup email task...');
  sendBackupEmail();
});



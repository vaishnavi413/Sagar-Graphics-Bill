import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceByCustomer,
  downloadInvoicePDF,
  deleteInvoice,
  updateInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.get("/", getInvoices);
router.get("/search/:name", getInvoiceByCustomer);
router.get("/download/:id", downloadInvoicePDF);
router.delete("/:id", deleteInvoice);

export default router;

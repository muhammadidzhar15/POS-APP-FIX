import Router from "express";
import { authenticate } from "../controllers/error.controller.js";
import {
  createPurchase,
  generateExcel,
  generatePdf,
  getAllPurchase,
  getPurchaseById,
  purchaseYearly,
} from "../controllers/purchase.controller.js";

const purchaseRouter = Router();

purchaseRouter.post("/purchases", authenticate, createPurchase);
purchaseRouter.get("/purchases", authenticate, getAllPurchase);
purchaseRouter.get("/purchases/:id", authenticate, getPurchaseById);
purchaseRouter.post("/purchases-pdf", authenticate, generatePdf);
purchaseRouter.post("/purchases-excel", authenticate, generateExcel);
purchaseRouter.get("/purchases-year", authenticate, purchaseYearly);

export default purchaseRouter;

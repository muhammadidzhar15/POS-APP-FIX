import { Router } from "express";
import { authenticate } from "../controllers/error.controller.js";
import {
  generateExcel,
  generatePdf,
  getAllOrder,
  getOrderById,
  insertOrder,
  orderYearly,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/orders/:userId", authenticate, insertOrder);
orderRouter.get("/orders/:id", authenticate, getOrderById);
orderRouter.get("/orders", authenticate, getAllOrder);
orderRouter.get("/orders-pdf", authenticate, generatePdf);
orderRouter.get("/orders-excel", authenticate, generateExcel);
orderRouter.get("/orders-year", authenticate, orderYearly);
export default orderRouter;

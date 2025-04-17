import { Router } from "express";
import { authenticate } from "../controllers/error.controller.js";
import { insertOrderReturn } from "../controllers/orderReturn.controller.js";

const orderReturnRouter = Router();

orderReturnRouter.post("/orders-returns", authenticate, insertOrderReturn);

export default orderReturnRouter;

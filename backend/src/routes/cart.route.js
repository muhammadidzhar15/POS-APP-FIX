import { Router } from "express";
import { authenticate } from "../controllers/error.controller.js";
import {
  createCart,
  deleteAllCart,
  deleteCart,
  getAllCart,
  getCartByProductId,
  updateCart,
} from "../controllers/cart.controller.js";
const cartRoute = Router();

cartRoute.post("/carts", authenticate, createCart);
cartRoute.get("/carts", authenticate, getAllCart);
cartRoute.get("/carts/product/:id/:userId", authenticate, getCartByProductId);
cartRoute.put("/carts/:id", authenticate, updateCart);
cartRoute.delete("/carts/:id/:userId", authenticate, deleteCart);
cartRoute.delete("/carts/:userId", authenticate, deleteAllCart);
export default cartRoute;

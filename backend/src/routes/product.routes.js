import { Router } from "express";
import { authenticate } from "../controllers/error.controller.js";
import {
  createProduct,
  deleteProduct,
  generateExcel,
  generatePdf,
  getAllProduct,
  getProductByCategory,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";

const productRoute = Router();

productRoute.post("/products", authenticate, createProduct);
productRoute.get("/products", authenticate, getAllProduct);
productRoute.get("/products/:id", authenticate, getProductById);
productRoute.get("/products/category/:id", authenticate, getProductByCategory);
productRoute.put("/products/:id", authenticate, updateProduct);
productRoute.delete("/products/:id", authenticate, deleteProduct);
productRoute.get("/products-pdf", authenticate, generatePdf);
productRoute.get("/products-excel", authenticate, generateExcel);

export default productRoute;

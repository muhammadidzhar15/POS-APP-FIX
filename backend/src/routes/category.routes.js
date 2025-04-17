import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
} from "../controllers/kategory.controller.js";
import { authenticate } from "../controllers/error.controller.js";
const categoryRoute = Router();

categoryRoute.get("/categorys",authenticate, getAllCategory);
categoryRoute.get("/categorys/:id",authenticate, getCategoryById);
categoryRoute.post("/categorys", authenticate, createCategory);
categoryRoute.put("/categorys/:id", authenticate, updateCategory);
categoryRoute.delete("/categorys/:id", authenticate, deleteCategory);

export default categoryRoute;

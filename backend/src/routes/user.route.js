import { Router } from "express";
import {
  createUser,
  deleteUSer,
  getAllUser,
  getUserById,
  loginUser,
  setRefreshToken,
  updateUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../controllers/error.controller.js";
const userRouter = Router();

// create user
userRouter.post("/users", createUser);
// update user
userRouter.put("/users/:id", authenticate, updateUser);
// login user
userRouter.post("/users/login", loginUser);
// delete user
userRouter.delete("/users/:id", authenticate, deleteUSer);
// gett all user
userRouter.get("/users", authenticate, getAllUser);
// 
userRouter.get("/users/refresh", authenticate, setRefreshToken);
// get user by id
userRouter.get("/users/:id", authenticate, getUserById);
export default userRouter;

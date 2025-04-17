import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Verify Token Failed: No token provided",
      result: null,
    });
  }

  try {
    const user = verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({
        message: "Verify Token Failed: Invalid token",
        result: null,
      });
    }

    // Simpan data user ke dalam request agar bisa digunakan pada middleware berikutnya
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: `Verify Token Failed: ${error.message}`,
      result: null,
    });
  }
};

import JsonWebToken from "jsonwebtoken";
import "dotenv/config";
import { logger } from "./winston.js";

const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username, // Pastikan ini sesuai dengan field di database
    role: user.role,
    // field lain yang diperlukan
  };
  return JsonWebToken.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
};

const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username, // Pastikan ini sesuai dengan field di database
    // field lain yang diperlukan
  };
  return JsonWebToken.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "1h",
  });
};

function verifyRefreshToken(token) {
  try {
    return JsonWebToken.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    logger.error("controllers/user.controller.js:verifyRefreshToken - " + err);
    return null;
  }
}

const parseJwt = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (err) {
    logger.error("controllers/user.controller.js:parseJwt - " + err);
    return null;
  }
};

const verifyAccessToken = (token) => {
  try {
    return JsonWebToken.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    logger.error("utils/jwt.js:verifyAccessToken - " + err);
    throw err; // Lempar error agar dapat ditangkap oleh middleware
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseJwt,
  verifyAccessToken,
};

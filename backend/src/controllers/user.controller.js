import prisma from "../utils/client.js";
import {
  userUpdateValidation,
  userValidation,
} from "../validations/user.validation.js";
import { encrypt } from "../utils/bcript.js";
import winston from "winston";
import { compare } from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  parseJwt,
  verifyRefreshToken,
} from "../utils/jwt.js";

// Inisialisasi logger jika belum ada
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log" }),
  ],
});

export const createUser = async (req, res) => {
  // Perbaiki validasi Joi dengan `.validate()`
  const { error, value } = userValidation(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }

  try {
    const result = await prisma.user.create({
      data: {
        name: value.name,
        username: value.userName, //
        password: encrypt(value.password),
        role: value.role,
      },
    });

    // Hindari mengirim password ke client
    result.password = "xxxxxxxxxxxxxx";

    return res.status(201).json({
      message: "User created successfully",
      result,
    });
  } catch (error) {
    logger.error(`controller/user.controller.js:createUser - ${error.message}`);

    return res.status(500).json({
      message: "Internal Server Error",
      result: null,
    });
  }
};

export const updateUser = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!user) {
    return res.status(404).json({
      message: "User Not Found",
      result: null,
    });
  }

  // Data validasi
  const { error, value } = userUpdateValidation(req.body); //
  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }

  // Periksa apakah password diubah
  let pass = user.password;
  if (value.password && value.password.length > 0) {
    pass = encrypt(value.password);
  }

  try {
    const result = await prisma.user.update({
      where: { id: Number(req.params.id) }, // Perbaikan: "number()" ke "Number()"
      data: {
        name: value.name,
        username: value.userName,
        password: pass,
        role: value.role,
      },
    });

    // Sembunyikan password dari response
    result.password = "xxxxxxxxxxxxx";

    return res.status(200).json({
      message: "Success",
      result,
    });
  } catch (error) {
    logger.error("controller/user.controller.js:UpdateUser - " + error.message);
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await prisma.user.findUnique({
      where: {
        username: req.body.userName,
      },
    });
    if (result) {
      if (compare(req.body.password, result.password)) {
        // generate token
        result.password = "xxxxxxxxxxx";
        const accessToken = generateAccessToken(result);
        const refreshToken = generateRefreshToken(result);
        return res.status(200).json({
          message: "login Success",
          result,
          accessToken,
          refreshToken,
        });
      } else {
        return res.status(500).json({
          message: "Password Not Match",
          result: null,
        });
      }
    } else {
      return res.status(500).json({
        message: "User Not Found",
        result: null,
      });
    }
  } catch (error) {
    logger.error("controllers/user.controller.js:loginUser - " + error.message);
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const deleteUSer = async (req, res) => {
  try {
    const result = await prisma.user.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    result.password = "xxxxxxxxxxx";
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/user.controller.js:deleteUser - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const result = await prisma.user.findMany({});
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers / user.controller.js: getAllUser - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    result.password = "xxxxxxxxx";
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers / user.controller.js: getUserById - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const setRefreshToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "verify token Failed",
        result: null,
      });
    }

    // Verifikasi token
    const verify = verifyRefreshToken(token);
    if (!verify || verify instanceof Error) {
      return res.status(401).json({
        message: "verify token failed",
        result: null,
      });
    }

    // Parse token untuk mendapatkan data
    let data = await parseJwt(token);
    console.log("Token payload:", data); // Debug

    // Cari user berdasarkan username dari token
    if (!data || !data.username) {
      return res.status(401).json({
        message: "Invalid token payload",
        result: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: data.username, // Gunakan username dari token
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not Found",
        result: null,
      });
    }

    // Generate token baru
    user.password = "xxxxxxxxxxxxxx";
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json({
      message: "Refresh success",
      result: user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error(
      "controllers/user.controller.js:setRefreshToken - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};
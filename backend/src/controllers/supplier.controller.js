import path, { format } from "path";
import prisma from "../utils/client.js";
import { logger } from "../utils/winston.js";
import { supplierValidation } from "../validations/supplier.validation.js";
import fs from "fs";
import pdf from "pdf-creator-node";
import { fileURLToPath } from "url";
import excelJS from "exceljs";

export const getAllSupplier = async (req, res) => {
  try {
    const last_id = parseInt(req.query.lastId) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search_query || "";

    const whereCondition = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { address: { contains: search } },
          ],
        }
      : {};

    const suppliers =
      last_id > 0
        ? await prisma.supplier.findMany({
            where: {
              ...whereCondition,
              id: { lt: last_id },
            },
            take: limit,
            orderBy: { id: "desc" },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              address: true,
            },
          })
        : await prisma.supplier.findMany({
            where: whereCondition,
            take: limit,
            orderBy: { id: "desc" },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              address: true,
            },
          });

    return res.status(200).json({
      message: "Success",
      result: suppliers,
      lastId: suppliers.length > 0 ? suppliers[suppliers.length - 1].id : 0,
      hasMore: suppliers.length >= limit,
    });
  } catch (error) {
    console.error("Error in getAllSupplier:", error);
    logger.error(
      "controllers/supplier.controller.js:getAllSupplier - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
      lastId: 0,
      hasMore: false,
    });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const result = await prisma.supplier.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js:getAllSupplierById - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const createSupplier = async (req, res) => {
  const { error, value } = supplierValidation(req.body);
  if (error != null) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }
  try {
    const result = await prisma.supplier.create({
      data: {
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone,
        email: value.email ? value.email : null,
        address: value.address,
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js:createSupplier - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const updateSupplier = async (req, res) => {
  const { error, value } = supplierValidation(req.body);
  if (error != null) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }
  try {
    const result = await prisma.supplier.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone,
        email: value.email ? value.email : null,
        address: value.address,
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js:updateSupplier - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const result = await prisma.supplier.delete({
      where: {
        id: Number(req.params.id),
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js:deleteSupplier - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const generatePdf = async (req, res) => {
  const htmlPath = path.join(__dirname, "../templates/SupplierTemplate.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  const pathFile = path.join(__dirname, "../../public/pdf");
  const fileName = "supplier.pdf";
  const fullPath = path.join(pathFile, fileName);
  let options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "0.1mm",
      contents: "",
    },
    footer: {
      height: "28mm",
      contents: {
        default:
          '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
      },
    },
  };
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    const data = await prisma.supplier.findMany({});
    let suppliers = [];
    data.forEach((supplier, no) => {
      suppliers.push({
        no: no + 1,
        name:
          supplier.firstName +
          " " +
          (supplier.lastName ? supplier.lastName : ""),
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
      });
    });
    let document = {
      html: html,
      data: {
        suppliers: suppliers,
      },
      path: fullPath,
      type: "",
    };
    const process = await pdf.create(document, options);
    if (process) {
      return res.status(200).json({
        message: "success",
        result: "/pdf/" + fileName,
      });
    }
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js: generatePdf - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const generateExcel = async (req, res) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Supplier");

  // Aplikasi berjalan dari folder backend, jadi path relatif dari sana
  const excelDir = path.join(process.cwd(), "public", "excel");
  const excelFilePath = path.join(excelDir, "Supplier.xlsx");

  try {
    // Pastikan folder ada
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true });
    }

    // Hapus file jika sudah ada
    if (fs.existsSync(excelFilePath)) {
      fs.unlinkSync(excelFilePath);
    }

    const data = await prisma.supplier.findMany({});

    worksheet.columns = [
      { header: "No", key: "s_no", width: 5 },
      { header: "Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 35 },
      { header: "Address", key: "address", width: 50 },
    ];

    let counter = 1;
    data.forEach((supplier) => {
      supplier.s_no = counter;
      supplier.name =
        supplier.firstName + " " + (supplier.lastName ? supplier.lastName : "");
      worksheet.addRow(supplier);
      counter++;
    });

    let list = ["A", "B", "C", "D", "E"];
    for (let i = 1; i <= counter; i++) {
      list.forEach((item) => {
        worksheet.getCell(item + i).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Tambahkan logging untuk membantu debug
    console.log("Writing Excel file to:", excelFilePath);

    await workbook.xlsx.writeFile(excelFilePath);

    // URL yang akan dikembalikan ke client
    return res.status(200).json({
      message: "success",
      result: `/public/excel/Supplier.xlsx`, // Sesuaikan dengan URL yang benar
    });
  } catch (error) {
    logger.error(
      "controllers/supplier.controller.js:generateExcel - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

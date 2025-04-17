import "dotenv/config";
import { productValidation } from "../validations/product.validation.js";
import prisma from "../utils/client.js";
import { setCode } from "../utils/documentPatern.js";
import { logger } from "../utils/winston.js";
import path, { format } from "path";
import fs from "fs"; // Tambahkan import fs
import pdf from "pdf-creator-node";
import { dirname } from "path";
import { fileURLToPath } from "url";
import excelJS from "exceljs";

export const createProduct = async (req, res) => {
  const fileMaxSize = process.env.FILE_MAX_SIZE;
  const allowFileExt = process.env.FILE_EXTENSION;
  const msgFileSize = process.env.FILE_MAX_MESSAGE;
  const { error, value } = productValidation(req.body);

  if (error != null) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }

  if (req.file === null || req.files.file === undefined)
    return res.status(400).json({
      message: "image cannot be empty",
      result: null,
    });

  //jika semua lolos
  const file = req.files.file;
  const fileSize = file.data.length;
  const ext = path.extname(file.name);
  const fileName = file.md5 + ext;
  const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
  const allowedType = allowFileExt;

  if (!allowedType.includes(ext.toLowerCase()))
    return res.status(422).json({
      message: "invalid File Type",
      result: null,
    });

  if (fileSize > fileMaxSize)
    return res.status(422).json({
      message: msgFileSize,
      result: null,
    });

  try {
    // Membuat path absolut ke direktori image
    const imagePath = path.join(process.cwd(), "public", "image");

    // Pastikan direktori ada
    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(imagePath, { recursive: true });
    }

    // Gunakan path.join untuk membuat path yang benar
    const filePath = path.join(imagePath, fileName);

    file.mv(filePath, async (err) => {
      if (err)
        return res.status(500).json({
          message: err.message,
          result: null,
        });

      const result = await prisma.product.create({
        data: {
          code: setCode("PRD-"),
          barcode: value.barcode ? value.barcode : null,
          productName: value.productName,
          image: fileName,
          url: url,
          qty: parseInt(value.qty),
          price: parseInt(value.price),
          kategoryId: parseInt(value.kategoryId),
          supplierId: parseInt(value.supplierId),
        },
      });

      // PERBAIKAN: Status seharusnya 201 untuk created, bukan 500
      return res.status(201).json({
        message: "success",
        result,
      });
    });
  } catch (error) {
    logger.error(
      "controllers/products.controller.js:createProduct - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getAllProduct = async (req, res) => {
  const last_id = parseInt(req.query.last_id) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search_query || "";
  let result = [];
  try {
    if (last_id < 1) {
      result = await prisma.$queryRaw`
      SELECT 
            id,
            code,
            barcode,
            productName,
            image,
            url,
            qty,
            price,
            kategoryId,
            supplierId,
            createdAt,
            updatedAt
        FROM 
            Product
        WHERE
            (
              code LIKE ${`%${search}%`}
              OR productName LIKE ${`%${search}%`}
              OR barcode LIKE ${`%${search}%`}
              OR qty LIKE ${`%${search}%`}
              OR price LIKE ${`%${search}%`}
            )
            ORDER BY 
              id DESC
          LIMIT ${limit};
          `;
    } else {
      result = await prisma.$queryRaw`
      SELECT 
            id,
            code,
            barcode,
            productName,
            image,
            url,
            qty,
            price,
            kategoryId,
            supplierId,
            createdAt,
            updatedAt
        FROM 
            Product
        WHERE
        (
              code LIKE ${`%${search}%`}
              OR productName LIKE ${`%${search}%`}
              OR barcode LIKE ${`%${search}%`}
              OR CAST (qty AS CHAR) LIKE ${`%${search}%`}
              OR CAST (price AS CHAR) LIKE ${`%${search}%`}
            )
            AND id < ${last_id}
        ORDER BY 
              id DESC
          LIMIT ${limit};
          `;
    }
    return res.status(200).json({
      message: "success",
      result,
      last_id: result.length > 0 ? result[result.length - 1].id : 0,
      hasMore: result.length >= limit ? true : false,
    });
  } catch (error) {
    logger.error(
      "controllers/product.controller.js:getAllProduct - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
      last_id: result.length > 0 ? result[result.length - 1].id : 0,
      hasMore: result.length >= limit ? true : false,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log("ID param:", req.params.id, "Parsed ID:", id);

    const result = await prisma.product.findUnique({
      include: {
        kategory: true,
        supplier: true,
      },
      where: {
        id,
      },
    });

    console.log("Query result:", result);

    if (!result) {
      return res.status(404).json({
        message: "Product not found",
        result: null,
      });
    }

    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    console.error("Error getProductById:", error.message);
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.product.findMany({
      where: {
        kategoryId: Number(id),
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/product.controller.js:getProductByCategory - " +
        error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  // Define the imagePath that was missing
  const imagePath = path.join("./public/images");

  try {
    // 1. Check if product with the ID exists
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        result: null,
      });
    }

    // 2. Validate input
    const { error, value } = productValidation(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        result: null,
      });
    }

    // 3. Handle file upload
    let fileName = product.image;
    let url = product.url;

    if (req.files && req.files.file) {
      const file = req.files.file;
      const fileSize = file.data.length;
      const ext = path.extname(file.name).toLowerCase();
      const allowedExt = process.env.FILE_EXTENSION || ".jpg,.jpeg,.png"; // Default value added
      const fileMaxSize = parseInt(process.env.FILE_MAX_SIZE) || 5000000; // Default 5MB if not defined
      const msgFileSize =
        process.env.FILE_MAX_MESSAGE || "File size exceeds the limit";

      if (!allowedExt.includes(ext)) {
        return res.status(422).json({
          message: "Invalid image type",
          result: null,
        });
      }

      if (fileSize > fileMaxSize) {
        return res.status(422).json({
          message: msgFileSize,
          result: null,
        });
      }

      // Make sure the directory exists
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath, { recursive: true });
      }

      fileName = file.md5 + ext;
      url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
      const filePath = path.join(imagePath, fileName);

      // Move file to public folder
      await file.mv(filePath);

      // Delete old image if exists and different from new image
      if (product.image && product.image !== fileName) {
        const oldFilePath = path.join(imagePath, product.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    // 4. Update product data
    const result = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        // Keep the original code if not changed in the request
        code: value.code || product.code, // This allows updating the code if provided
        barcode: value.barcode || product.barcode || null,
        productName: value.productName,
        image: fileName,
        url: url,
        qty: parseInt(value.qty || 0),
        price: parseInt(value.price || 0),
        kategoryId: parseInt(value.kategoryId),
        supplierId: parseInt(value.supplierId),
      },
    });

    return res.status(200).json({
      message: "Product updated successfully",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/product.controller.js:updateProduct - " + error.message
    );
    return res.status(500).json({
      message: "Failed to update product: " + error.message,
      result: null,
    });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek dulu produk-nya ada atau tidak
    const product = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "product not found",
        result: null,
      });
    }

    // Hapus produk dari database
    const result = await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    // Jika produk punya gambar, hapus juga file-nya
    if (product.image) {
      const filePath = `./public/images/${product.image}`;
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.error("Failed to delete image file - " + err.message);
        // Gak return error di sini karena delete DB-nya sudah sukses
      }
    }

    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/product.controller.js:deleteProduct - " + error.message
    );
    return res.status(500).json({
      message: "Internal server error",
      result: null,
    });
  }
};

export const generatePdf = async (req, res) => {
  const fileName = "product.pdf";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outputDir = path.join(__dirname, "../../public/pdf");
  const outputPath = path.join(outputDir, fileName);
  const templatePath = path.join(
    __dirname,
    "../templates/ProductTemplate.html"
  );

  try {
    // Cek & buat folder pdf kalau belum ada
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Baca template HTML
    let html;
    try {
      html = fs.readFileSync(templatePath, "utf-8");
    } catch (err) {
      logger.error("Gagal baca template - " + err.message);
      return res.status(500).json({
        message: "Template file not found",
        result: null,
      });
    }

    // Hapus file PDF lama kalau ada
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const data = await prisma.product.findMany({});
    const barangs = data.map((barang, no) => ({
      no: no + 1,
      id: barang.code,
      nama_barang: barang.productName,
      jumlah: Number(barang.qty).toLocaleString("id-ID"),
      harga_satuan: Number(barang.price).toLocaleString("id-ID"),
    }));

    const document = {
      html,
      data: { barangs },
      path: outputPath,
      type: "",
    };

    const options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
      header: {
        height: "0.1mm",
        content: "",
      },
      footer: {
        height: "28mm",
        content: {
          default:
            '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>',
        },
      },
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
      "controllers/product.controller.js:generatePdf - " + error.message
    );
    return res.status(500).json({
      message: "Failed to generate PDF",
      result: null,
    });
  }
};

export const generateExcel = async (req, res) => {
  const workbook = new excelJS.Workbook(); // ✅ Fix: "Workbook" bukan "WorkBook"
  const worksheet = workbook.addWorksheet("Product");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pathFile = path.join(__dirname, "../../public/excel"); // ✅ path lebih stabil & portable
  const fileName = "Product.xlsx";
  const filePath = path.join(pathFile, fileName);

  try {
    // Buat folder kalau belum ada (optional safety)
    if (!fs.existsSync(pathFile)) {
      fs.mkdirSync(pathFile, { recursive: true });
    }

    // Hapus file lama jika ada
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const data = await prisma.product.findMany();

    worksheet.columns = [
      // ✅ Fix: "columns", bukan "colums"
      { header: "No", key: "s_no", width: 5 },
      { header: "Nama Product", key: "productName", width: 20 },
      { header: "Jumlah", key: "qty", width: 10 },
      { header: "Harga Satuan", key: "price", width: 20 },
    ];

    let counter = 1;
    data.forEach((barang) => {
      worksheet.addRow({
        s_no: counter++,
        productName: barang.productName,
        qty: Number(barang.qty).toLocaleString("id-ID"),
        price: Number(barang.price).toLocaleString("id-ID"),
      });
    });

    // Styling border untuk semua sel
    const columnKeys = ["A", "B", "C", "D"];
    for (let i = 1; i <= worksheet.rowCount; i++) {
      columnKeys.forEach((col) => {
        worksheet.getCell(`${col}${i}`).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    // Bold header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    await workbook.xlsx.writeFile(filePath);

    return res.status(200).json({
      message: "success",
      result: `/excel/${fileName}`,
    });
  } catch (error) {
    logger.error(
      "controllers/product.controller.js:generateExcel - " + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

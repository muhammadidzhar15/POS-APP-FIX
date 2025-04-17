import prisma from "../utils/client.js";
import { setOrderCode } from "../utils/documentPatern.js";
import { logger } from "../utils/winston.js";
import prism from "@prisma/client";
import fs from "fs";
import pdf from "pdf-creator-node";
import excelJS from "exceljs";

export const insertOrder = async (req, res) => {
  try {
    const data = await prisma.$transaction(async (prisma) => {
      // insert order
      const post = await prisma.orders.create({
        data: {
          code: setOrderCode("ORD-"),
          date: req.body.date,
          total: req.body.total,
          ppn: req.body.ppn,
          grandTotal: req.body.grandTotal,
          userId: Number(req.params.userId),
        },
      });
      // insert detail

      for (let i = 0; i < req.body.detail.length; i++) {
        await prisma.orderdetail.create({
          data: {
            price: req.body.detail[i].price,
            productName: req.body.detail[i].productName,
            qty: req.body.detail[i].qty,
            totalPrice: req.body.detail[i].totalPrice,
            note: req.body.detail[i].note,
            orderId: post.id,
            productId: req.body.detail[i].productId,
          },
        });
        // update stock
        await prisma.product.update({
          where: {
            id: req.body.detail[i].productId,
          },
          data: {
            qty: {
              decrement: req.body.detail[i].qty,
            },
          },
        });
        // delete cart
      }
      await prisma.carts.deleteMany({
        where: {
          userId: Number(req.params.userId),
        },
      });
      return post;
    });
    return res.status(200).json({
      message: "success",
      result: data,
    });
  } catch (error) {
    logger.error(
      "controllers/order.controller.js:inserOrder -" + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const result = await prisma.orders.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        Orderdetail: true,
      },
    });
    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/order.controller.js:getOrderById -" + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const getAllOrder = async (req, res) => {
  const last_id = parseInt(req.query.last_Id) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search_query || "";
  let result = [];

  try {
    if (last_id < 1) {
      result = await prisma.$queryRaw(
        prism.sql`
          SELECT id, code, date, total, ppn, grandTotal
          FROM orders
          WHERE (
            code LIKE CONCAT('%', ${search}, '%')
            OR date LIKE CONCAT('%', ${search}, '%')
            OR total LIKE CONCAT('%', ${search}, '%')
            OR ppn LIKE CONCAT('%', ${search}, '%')
            OR grandTotal LIKE CONCAT('%', ${search}, '%')
          )
          ORDER BY id DESC
          LIMIT ${limit};
        `
      );
    } else {
      result = await prisma.$queryRaw(
        prism.sql`
          SELECT id, code, date, total, ppn, grandTotal
          FROM orders
          WHERE (
            code LIKE CONCAT('%', ${search}, '%')
            OR date LIKE CONCAT('%', ${search}, '%')
            OR total LIKE CONCAT('%', ${search}, '%')
            OR ppn LIKE CONCAT('%', ${search}, '%')
            OR grandTotal LIKE CONCAT('%', ${search}, '%')
          )
          AND id < ${last_id}
          ORDER BY id DESC
          LIMIT ${limit};
        `
      );
    }

    return res.status(200).json({
      message: "success",
      result,
    });
  } catch (error) {
    logger.error(
      "controllers/order.controller.js:getAllOrder -" + error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

export const generatePdf = async (req, res) => {
  let pathFile = "./public/pdf";
  let fileName = "order.pdf";
  let fullPath = pathFile + "/" + fileName;
  let html = fs.readFileSync("./src/templates/SalesTemplate.html", "utf-8");
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
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (isNaN(startDate) && isNaN(endDate)) {
      return res.status(400).json({
        message: "invalid date format",
        result: null,
      });
    }
    const data = await prisma.orders.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        Orderdetail: true,
      },
    });
    let orders = [];
    data.forEach((order, no) => {
      orders.push({
        no: no + 1,
        code: order.code,
        date: new Date(order.date).toLocaleDateString("id-ID"),
        total: Number(order.total).toLocaleString("id-ID"),
        ppn: Number(order.ppn).toLocaleString("id-ID"),
        grandTotal: Number(order.grandTotal).toLocaleString("id-ID"),
        user: order.user.name,
        orderdetail: order.Orderdetail,
      });
    });
    let document = {
      html: html,
      data: {
        orders: orders,
      },
      path: fullPath,
      type: " ",
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
      message: error.message,
      result: null,
    });
  }
};

export const generateExcel = async (req, res) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("order");
  const path = "./public/excel";

  try {
    // Hapus file lama jika ada
    const filePath = `${path}/order.xlsx`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Validasi tanggal
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({
        message: "Invalid date format",
        result: null,
      });
    }

    // Ambil data dari database
    const data = await prisma.$queryRaw`
      SELECT 
        o.code, 
        o.date, 
        o.total, 
        o.ppn, 
        o.grandTotal,
        d.productName,
        d.price,
        d.qty,
        d.totalPrice 
      FROM orders o
      INNER JOIN Orderdetail d ON d.orderId = o.id
      WHERE o.date BETWEEN ${startDate} AND ${endDate}
    `;

    // Setup kolom worksheet
    worksheet.columns = [
      { header: "No", key: "s_no", width: 5 },
      { header: "Date", key: "date", width: 15 },
      { header: "Code", key: "code", width: 20 },
      { header: "Total", key: "total", width: 25 },
      { header: "PPN", key: "ppn", width: 20 },
      { header: "Grand Total", key: "grandTotal", width: 30 },
      { header: "Product", key: "productName", width: 25 },
      { header: "Price", key: "price", width: 20 },
      { header: "QTY", key: "qty", width: 10 },
      { header: "Total Price", key: "totalPrice", width: 25 },
    ];

    // Tambahkan data ke worksheet
    let counter = 1;
    data.forEach((order) => {
      worksheet.addRow({
        s_no: counter,
        date: order.date,
        code: order.code,
        total: Number(order.total).toLocaleString("id-ID"),
        ppn: Number(order.ppn).toLocaleString("id-ID"),
        grandTotal: Number(order.grandTotal).toLocaleString("id-ID"),
        productName: order.productName,
        price: Number(order.price).toLocaleString("id-ID"),
        qty: order.qty,
        totalPrice: Number(order.totalPrice).toLocaleString("id-ID"),
      });
      counter++;
    });

    // Styling header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Tambahkan border ke semua sel
    const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    for (let i = 1; i <= worksheet.rowCount; i++) {
      columns.forEach((col) => {
        const cell = worksheet.getCell(`${col}${i}`);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    // Simpan file excel
    await workbook.xlsx.writeFile(filePath);

    return res.status(200).json({
      message: "Success",
      result: "/public/excel/order.xlsx", // pastikan URL ini bisa diakses oleh client
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

export const orderYearly = async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  try {
    const result = await prisma.$queryRaw`
      SELECT
        IFNULL(SUM(CASE WHEN MONTH(date) = 1 THEN grandTotal ELSE 0 END), 0) AS order_01,
        IFNULL(SUM(CASE WHEN MONTH(date) = 2 THEN grandTotal ELSE 0 END), 0) AS order_02,
        IFNULL(SUM(CASE WHEN MONTH(date) = 3 THEN grandTotal ELSE 0 END), 0) AS order_03,
        IFNULL(SUM(CASE WHEN MONTH(date) = 4 THEN grandTotal ELSE 0 END), 0) AS order_04,
        IFNULL(SUM(CASE WHEN MONTH(date) = 5 THEN grandTotal ELSE 0 END), 0) AS order_05,
        IFNULL(SUM(CASE WHEN MONTH(date) = 6 THEN grandTotal ELSE 0 END), 0) AS order_06,
        IFNULL(SUM(CASE WHEN MONTH(date) = 7 THEN grandTotal ELSE 0 END), 0) AS order_07,
        IFNULL(SUM(CASE WHEN MONTH(date) = 8 THEN grandTotal ELSE 0 END), 0) AS order_08,
        IFNULL(SUM(CASE WHEN MONTH(date) = 9 THEN grandTotal ELSE 0 END), 0) AS order_09,
        IFNULL(SUM(CASE WHEN MONTH(date) = 10 THEN grandTotal ELSE 0 END), 0) AS order_10,
        IFNULL(SUM(CASE WHEN MONTH(date) = 11 THEN grandTotal ELSE 0 END), 0) AS order_11,
        IFNULL(SUM(CASE WHEN MONTH(date) = 12 THEN grandTotal ELSE 0 END), 0) AS order_12
      FROM orders
      WHERE YEAR(date) = ${year}
    `;

    const row = result[0] || {};

    const monthlyTotals = [
      Number(row.order_01),
      Number(row.order_02),
      Number(row.order_03),
      Number(row.order_04),
      Number(row.order_05),
      Number(row.order_06),
      Number(row.order_07),
      Number(row.order_08),
      Number(row.order_09),
      Number(row.order_10),
      Number(row.order_11),
      Number(row.order_12),
    ];

    return res.status(200).json({
      message: "success",
      result: monthlyTotals,
    });
  } catch (error) {
    logger.error(
      `controllers/order.controller.js:orderYearly - ${error.message}`
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

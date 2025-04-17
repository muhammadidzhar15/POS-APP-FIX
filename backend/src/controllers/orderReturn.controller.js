import prisma from "../utils/client.js";
import { setOrderCode } from "../utils/documentPatern.js";
import { logger } from "../utils/winston.js";
import { orderReturnValidation } from "../validations/orderReturn.validation.js";

export const insertOrderReturn = async (req, res) => {
  const { error, value } = orderReturnValidation(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
      result: null,
    });
  }

  try {
    const data = await prisma.$transaction(async (prisma) => {
      // Insert ke tabel orderreturn
      const retur = await prisma.orderreturn.create({
        data: {
          code: setOrderCode("ORDR-"),
          date: value.date,
          note: value.note,
          userId: Number(value.userId),
          orderId: Number(value.orderId),
        },
      });

      // Loop detail produk yang direturn
      for (let i = 0; i < value.detail.length; i++) {
        const detail = value.detail[i];

        // Validasi input produk dan quantity
        if (
          Number(detail.qty) === 0 ||
          detail.qty === " " ||
          !detail.product ||
          !detail.product.productId
        ) {
          throw new Error("Qty and product cannot be empty");
        }

        // Insert ke orderreturndetail
        await prisma.orderreturndetail.create({
          data: {
            returnId: retur.id, // ✅ sesuai relasi model
            productId: Number(detail.product.productId),
            productName: detail.product.productName,
            price: parseFloat(detail.product.price),
            qty: Number(detail.qty),
            total: parseFloat(detail.product.price) * Number(detail.qty),
          },
        });

        // Update stok produk
        await prisma.product.update({
          where: {
            id: Number(detail.product.productId),
          },
          data: {
            qty: {
              increment: Number(detail.qty),
            },
          },
        });
      }

      return retur;
    });

    return res.status(200).json({
      message: "success",
      result: data,
    });
  } catch (error) {
    logger.error(
      "controllers/orderReturn.controller.js:insertOrderReturn - " +
        error.message
    );
    return res.status(500).json({
      message: error.message,
      result: null,
    });
  }
};

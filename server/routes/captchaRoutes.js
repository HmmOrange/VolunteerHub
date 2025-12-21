import express from "express";
import jwt from "jsonwebtoken";

/**
 * Route: /api/captcha
 * - Định nghĩa endpoint liên quan tới việc tạo CAPTCHA
 * - GET /: Tạo câu hỏi toán học ngẫu nhiên và token chứa đáp án (đã mã hóa)
 */
const router = express.Router();

router.get("/", (req, res) => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const answer = a + b;

  const token = jwt.sign(
    { answer },
    process.env.CAPTCHA_SECRET,
    { expiresIn: "5m" }
  );

  res.json({
    question: `${a} + ${b}`,
    token,
  });
});

export default router;
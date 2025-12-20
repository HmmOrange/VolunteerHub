// routes/captcha.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/", (req, res) => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const answer = a + b;

  // Sign answer so client cannot change it
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

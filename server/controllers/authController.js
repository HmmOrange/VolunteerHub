import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ---------------------- REGISTER ----------------------
export const register = async (req, res) => {
  try {
    let { email, username, password } = req.body;

    // Normalize
    email = email.toLowerCase().trim();
    username = username.trim();

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email đã được sử dụng. Vui lòng sử dụng email khác!",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: "Tên đăng nhập đã được sử dụng. Vui lòng sử dụng tên đăng nhập khác!",
      });
    }

    const { captchaAnswer, captchaToken } = req.body;

    if (!captchaAnswer || !captchaToken) {
      return res.status(400).json({ message: "Thiếu captcha" });
    }

    try {
      const decoded = jwt.verify(
        captchaToken,
        process.env.CAPTCHA_SECRET
      );

      if (Number(captchaAnswer) !== decoded.answer) {
        return res.status(400).json({ message: "Captcha không đúng" });
      }
    } catch (err) {
      return res.status(400).json({ message: "Captcha đã hết hạn" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password: hashed,

      // ✅ REQUIRED by schema
      fullName: username,

      // Optional defaults (explicit is better than implicit)
      isEmailVerified: false,
    });

    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------- LOGIN ----------------------
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
      ],
    });

    if (!user) {
      return res.status(400).json({
        message: "Thông tin đăng nhập không hợp lệ",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Thông tin đăng nhập không hợp lệ",
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        message:
          "Tài khoản của bạn đang bị khóa, vui lòng liên hệ admin để biết thêm chi tiết",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

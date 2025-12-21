import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Register a new user account.
 * @route POST /api/auth/register
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email
 * @param {string} req.body.username
 * @param {string} req.body.password
 * @param {string|number} req.body.captchaAnswer
 * @param {string} req.body.captchaToken
 * @returns {Object} JWT token and user info
 */
export const register = async (req, res) => {
  try {
    let {
      email,
      username,
      password,
      captchaAnswer,
      captchaToken,
    } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
    }

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
    } catch {
      return res.status(400).json({ message: "Captcha đã hết hạn" });
    }

    email = email.toLowerCase().trim();
    username = username.trim();

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      fullName: username,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Authenticate user and issue JWT.
 * @route POST /api/auth/login
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.identifier
 * @param {string} req.body.password
 * @returns {Object} JWT token and user info
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Thiếu thông tin đăng nhập" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.trim() },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    if (user.isLocked) {
      return res.status(403).json({
        message: "Tài khoản của bạn đang bị khóa\nVui lòng liên hệ Admin để biết thêm chi tiết",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });
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
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

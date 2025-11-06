import User from "../models/User.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email đã được sử dụng. Vui lòng sử dụng email khác! " });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Tên đăng nhập đã được sử dụng. Vui lòng sử dụng tên đăng nhập khác! " });
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, username, password: hashed });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OR username

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { email: user.email, username: user.username, role: user.role} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


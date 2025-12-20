import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* ======================================================
   INTERNAL HELPER — ADMIN ONLY CHECK
   (minimal, reused, no magic)
====================================================== */
const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Chỉ Admin mới được phép thực hiện thao tác này" });
    return false;
  }
  return true;
};

/* ======================================================
   GET ALL USERS (ADMIN ONLY)
====================================================== */
export const getAllUsers = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   CREATE MANAGER (ADMIN ONLY)  ✅ NEW
====================================================== */
export const createManager = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const {
      username,
      email,
      password,
      fullName = "",
      dateOfBirth = null,
      address = "",
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email và password là bắt buộc",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username hoặc email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "manager",
      fullName,
      dateOfBirth,
      address,
      isLocked: false,
    });

    await newUser.save();

    res.status(201).json({
      message: "Tạo tài khoản Manager thành công",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   UPDATE USER ROLE (ADMIN ONLY)
====================================================== */
export const updateUserRole = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;
    const { newRole } = req.body;

    if (!["volunteer", "manager"].includes(newRole)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ message: "Không thể thay đổi quyền của Admin" });
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({ message: `Đã cập nhật thành ${newRole}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   TOGGLE USER LOCK (ADMIN ONLY)
====================================================== */
export const toggleUserLock = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(403).json({ message: "Không thể khóa tài khoản Admin" });
    }

    user.isLocked = !user.isLocked;
    await user.save();

    res.status(200).json({
      message: user.isLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET PROFILE (AUTHENTICATED)
====================================================== */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   UPDATE PROFILE (AUTHENTICATED)
====================================================== */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, dateOfBirth, address, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName;
    user.dateOfBirth = dateOfBirth || null;
    user.address = address || "";
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: "Profile updated",
      user: {
        username: user.username,
        avatar: user.avatar,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   UPDATE AVATAR (AUTHENTICATED)
====================================================== */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Cập nhật ảnh đại diện thành công",
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

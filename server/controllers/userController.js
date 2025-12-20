import User from "../models/User.js";

// Lấy danh sách tất cả user (chỉ Admin)
export const getAllUsers = async (req, res) => {
  try {
    // Lấy tất cả user nhưng bỏ trường password
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đổi role user (chỉ Admin)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body; // 'volunteer' hoặc 'manager'

    // Validate role hợp lệ
    if (!['volunteer', 'manager'].includes(newRole)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Không cho phép đổi role của chính admin (hoặc các admin khác nếu muốn chặt chẽ hơn)
    if (user.role === 'admin') {
      return res.status(403).json({ message: "Không thể thay đổi quyền của Admin" });
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({ message: `Đã cập nhật thành ${newRole}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleUserLock = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === 'admin') {
      return res.status(403).json({ message: "Không thể khóa tài khoản Admin" });
    }

    // Đảo ngược trạng thái (True -> False, False -> True)
    user.isLocked = !user.isLocked;
    await user.save();

    res.status(200).json({ 
      message: user.isLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", 
      user 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

import User from "../models/User.js";
import Event from "../models/Event.js";
import bcrypt from "bcryptjs";

/**
 * Helper nội bộ: kiểm tra quyền Admin (ensureAdmin)
 * - Input: `req` chứa `req.user`.
 * - Hành động: nếu không phải admin sẽ trả 403 và trả về false, ngược lại trả true.
 */
const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Chỉ Admin mới được phép thực hiện thao tác này" });
    return false;
  }
  return true;
};

/**
 * Lấy tất cả user (ADMIN only) (getAllUsers)
 * - Input: none (sử dụng req.user để check quyền).
 * - Hành động: nếu là admin thì trả về danh sách users (không bao gồm password).
 * - Output: mảng users hoặc lỗi.
 */
export const getAllUsers = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Tạo tài khoản Manager (ADMIN only) (createManager)
 * - Input: `req.body` chứa username, email, password, optional fields.
 * - Hành động: validate input, kiểm tra tồn tại, hash password, tạo user với role = manager.
 * - Output: trả về user mới hoặc lỗi.
 */
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

/**
 * Cập nhật role của user (ADMIN only) (updateUserRole)
 * - Input: `req.params.userId`, `req.body.newRole`.
 * - Hành động: validate quyền admin, không cho thay đổi role của admin, cập nhật role.
 * - Output: user đã cập nhật hoặc lỗi.
 */
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

/**
 * Toggle trạng thái khoá tài khoản user (ADMIN only) (toggleUserLock)
 * - Input: `req.params.userId`.
 * - Hành động: kiểm tra quyền admin, không cho khoá admin, đổi trạng thái `isLocked`.
 * - Output: user đã cập nhật hoặc lỗi.
 */
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

/**
 * Lấy profile người dùng hiện tại (getProfile)
 * - Input: sử dụng `req.user.id` (được set bởi middleware xác thực).
 * - Hành động: lấy user, bổ sung thông tin `eventEndDate` cho badges nếu có.
 * - Output: object user hoặc lỗi.
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v").lean();

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // If user has badges, fetch corresponding events to get endDate
    const badges = Array.isArray(user.badges) ? user.badges : [];
    const eventIds = badges
      .map(b => (b && b.eventId ? (b.eventId._id ? b.eventId._id : b.eventId) : null))
      .filter(Boolean)
      .map(id => id.toString());

    if (eventIds.length > 0) {
      const events = await Event.find({ _id: { $in: eventIds } }).select('endDate date').lean();
      const eventsById = Object.fromEntries(events.map(e => [e._id.toString(), e.endDate || e.date]));

      user.badges = badges.map(b => {
        const rawId = b && b.eventId ? (b.eventId._id ? b.eventId._id.toString() : b.eventId.toString()) : null;
        return {
          ...b,
          eventEndDate: rawId ? (eventsById[rawId] || null) : null
        };
      });
    } else {
      user.badges = badges;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật profile người dùng (updateProfile)
 * - Input: `req.body` chứa `fullName`, `dateOfBirth`, `address`, `avatar`.
 * - Hành động: cập nhật các trường trong document User hiện tại.
 * - Output: trả về message và thông tin user cập nhật hoặc lỗi.
 */
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

/**
 * Cập nhật avatar (updateAvatar)
 * - Input: file upload trong `req.file`.
 * - Hành động: lưu path avatar vào trường `avatar` của user (dùng findByIdAndUpdate để tránh validate toàn bộ schema).
 * - Output: message và path avatar hoặc lỗi.
 */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Sử dụng findByIdAndUpdate với validateBeforeSave: false
    // để tránh validate các field required khác (như fullName)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true, runValidators: false } // runValidators: false để bỏ qua validation
    );

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json({
      message: "Cập nhật ảnh đại diện thành công",
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Import danh sách users từ file JSON hoặc CSV (importUsers)
 * - Input: file upload (`req.file`) và quyền admin.
 * - Hành động: parse file, validate mỗi bản ghi, hash password và tạo user mới nếu chưa tồn tại.
 * - Output: thống kê số created và skipped.
 */
export const importUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const raw = req.file.buffer.toString("utf-8");
    let users = [];

    /* ===== PARSE FILE ===== */
    if (req.file.originalname.endsWith(".json")) {
      users = JSON.parse(raw);
    } else if (req.file.originalname.endsWith(".csv")) {
      const lines = raw.split("\n").filter(Boolean);
      const headers = lines.shift().split(",").map(h => h.trim());

      users = lines.map(line => {
        const values = line.split(",");
        return headers.reduce((obj, key, i) => {
          obj[key] = values[i]?.trim();
          return obj;
        }, {});
      });
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    let created = 0;
    let skipped = 0;

    for (const u of users) {
      const {
        username,
        email,
        password,
        fullName,
        role,
        dateOfBirth,
        address,
        avatar,
        isLocked,
        isEmailVerified,
      } = u;

      // REQUIRED CORE FIELDS
      if (!username || !email || !password) {
        skipped++;
        continue;
      }

      const exists = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (exists) {
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        username,
        email,
        password: hashedPassword,

        // 🔑 REQUIRED BY SCHEMA — DEFAULT IF MISSING
        fullName: fullName?.trim() || username,

        // OPTIONAL FIELDS
        role: ["admin", "manager", "volunteer"].includes(role)
          ? role
          : "volunteer",

        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || "",
        avatar: avatar || "",

        isLocked: isLocked === "true" || isLocked === true,
        isEmailVerified: isEmailVerified === "true" || isEmailVerified === true,
      });

      created++;
    }

    res.json({
      message: "Import completed",
      created,
      skipped,
    });
  } catch (err) {
    console.error("IMPORT USERS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật username hoặc email (cần confirmPassword) (updateCredentials)
 * - Input: `req.body` chứa `username`, `email`, `confirmPassword`.
 * - Hành động: xác thực mật khẩu hiện tại, cập nhật username/email.
 * - Output: thông tin cập nhật hoặc lỗi.
 */
export const updateCredentials = async (req, res) => {
  try {
    const { username, email, confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu để xác nhận",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(confirmPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Mật khẩu xác nhận không đúng" });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.json({
      message: "Cập nhật thông tin đăng nhập thành công",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Đổi mật khẩu (changePassword)
 * - Input: `req.body` chứa `oldPassword` và `newPassword`.
 * - Hành động: xác thực mật khẩu cũ, hash mật khẩu mới và lưu.
 * - Output: message success hoặc lỗi.
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu mật khẩu" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Mật khẩu cũ không đúng" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cập nhật hiển thị badge của user (setBadgeVisibility)
 * - Input: `req.body` chứa `eventId` và `visible`.
 * - Hành động: tìm badge tương ứng trong user.badges và set thuộc tính `visible`.
 * - Output: message và badge đã cập nhật hoặc lỗi.
 */
export const setBadgeVisibility = async (req, res) => {
  try {
    const { eventId, visible } = req.body;
    if (!eventId) return res.status(400).json({ message: 'eventId is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.badges = user.badges || [];
    const idx = user.badges.findIndex(b => b.eventId && b.eventId.toString() === eventId);
    if (idx === -1) return res.status(404).json({ message: 'Badge not found' });

    user.badges[idx].visible = !!visible;
    await user.save();

    res.json({ message: 'Badge visibility updated', badge: user.badges[idx] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

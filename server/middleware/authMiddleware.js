import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware bảo vệ route bắt buộc xác thực (protect)
 * - Input: header `Authorization: Bearer <token>`.
 * - Hành động: verify JWT, load user (không trả về password) và gán vào `req.user`.
 * - Output: gọi `next()` nếu hợp lệ, trả 401 nếu không có hoặc token không hợp lệ.
 */
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Middleware chỉ cho phép Admin truy cập (adminOnly)
 * - Input: `req.user` phải được set bởi middleware trước đó (protect/optionalAuth).
 * - Hành động: kiểm tra role, nếu không phải admin trả 403.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
/**
 * Middleware xác thực tuỳ chọn (optionalAuth)
 * - Input: header Authorization optional.
 * - Hành động: nếu có token thì verify và set `req.user`, nếu không hoặc invalid thì set `req.user = null`.
 * - Output: luôn gọi `next()` để cho phép cả requests có và không có xác thực.
 */
export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    // Không có token thì tiếp tục nhưng req.user = null
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch (err) {
    // Token không hợp lệ thì cũng tiếp tục nhưng req.user = null
    req.user = null;
  }
  
  next();
};
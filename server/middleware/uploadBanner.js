import multer from "multer";
import path from "path";
import fs from "fs";

// Tạo thư mục nếu chưa tồn tại
const uploadDir = "uploads/banners";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `banner-${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload ảnh"), false);
  }
};

/**
 * Middleware multer để xử lý upload banner cho event (uploadBanner)
 * - Lưu file vào `uploads/banners` với tên gồm timestamp.
 * - Chỉ cho phép image/* và giới hạn kích thước 2MB.
 */
export const uploadBanner = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

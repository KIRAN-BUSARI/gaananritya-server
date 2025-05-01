import multer from "multer";
import path from "path";
import fs from "fs";

// Create temp directory if it doesn't exist
const createTempDir = () => {
  const tempPath = path.resolve("public/temp");
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
};

createTempDir();

// Use disk storage for handling multiple files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("public/temp"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
    }
  },
});

import multer from "multer";
import path from "path";
import fs from "fs";

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const getTempPath = () => {
  return isServerless ? '/tmp' : path.resolve("public/temp");
};

const createTempDir = () => {
  const tempPath = getTempPath();
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
};

createTempDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getTempPath());
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
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
    }
  },
});

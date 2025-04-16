import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (_req, file, cb) {
    cb(null, file.originalname)
  }
});

export const upload = multer({
  storage,
});

export const cleanupTempFiles = (files) => {
  if (!files) return;

  // Handle single file
  if (!Array.isArray(files) && files.path) {
    fs.unlink(files.path, (err) => {
      if (err) console.error(`Error deleting temp file ${files.path}:`, err);
      else console.log(`Successfully deleted temp file: ${files.path}`);
    });
    return;
  }

  // Handle array of files
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error(`Error deleting temp file ${file.path}:`, err);
          else console.log(`Successfully deleted temp file: ${file.path}`);
        });
      }
    });
    return;
  }

  // Handle multer's req.files object with field names
  Object.keys(files).forEach(fieldname => {
    const fieldFiles = files[fieldname];
    if (Array.isArray(fieldFiles)) {
      fieldFiles.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error(`Error deleting temp file ${file.path}:`, err);
          else console.log(`Successfully deleted temp file: ${file.path}`);
        });
      });
    }
  });
};
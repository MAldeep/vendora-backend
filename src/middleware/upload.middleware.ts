import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/appError.js";

// 1. Memory Storage configuration
const storage = multer.memoryStorage();

// 2. File Filter (PNG, JPG, JPEG, WEBP only)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only image files are allowed!", 400) as unknown as null,
      false,
    );
  }
};

// 3. Multer Instance Setup (Max size 5MB per file)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Middleware array handling for multiple images
export const uploadProductImages = upload.array("images", 5);

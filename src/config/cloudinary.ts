import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { AppError } from "../utils/appError.js";
import { env } from "./env.js";
import sharp from "sharp";

export interface ProcessedImageResult {
  url: string;
  publicId: string;
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a raw/processed Buffer directly to Cloudinary using Upload Stream
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "products",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vendora/${folder}`,
        format: "webp",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(
              `Image upload failed: ${error?.message || "Unknown error"}`,
              500,
            ),
          );
        }
        resolve(result);
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Optimize image buffer using Sharp AND upload the WebP buffer to Cloudinary
 */
export const processAndUploadImage = async (
  fileBuffer: Buffer,
  folder: string = "products",
): Promise<ProcessedImageResult> => {
  const processedBuffer = await sharp(fileBuffer)
    .resize(1000, 1000, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat("webp", { quality: 80 })
    .toBuffer();

  const uploadResult = await uploadToCloudinary(processedBuffer, folder);

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
};

/**
 * Process and upload multiple image buffers in parallel
 */
export const processAndUploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = "products",
): Promise<ProcessedImageResult[]> => {
  const uploadPromises = files.map((file) =>
    processAndUploadImage(file.buffer, folder),
  );

  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary by its public_id
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new AppError("Failed to delete image from cloud storage", 500);
  }
};

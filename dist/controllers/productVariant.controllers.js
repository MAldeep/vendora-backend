import { ProductVariantsServices } from "../services/productVariants.services.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
export class ProductVariantsControllers {
    static create = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant ID is required", 400);
        }
        const { id } = req.params;
        if (!id) {
            throw new AppError("Product ID is Required", 400);
        }
        const variantData = req.body;
        const { data, message } = await ProductVariantsServices.create(tenantId, id, variantData);
        res.status(201).json({
            status: "success",
            message,
            data,
        });
    });
    static getAllByProductId = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant ID is required", 400);
        }
        const { id } = req.params;
        if (!id) {
            throw new AppError("Product ID is required", 400);
        }
        const { data, message } = await ProductVariantsServices.getAllByProductId(tenantId, id);
        res.status(200).json({
            status: "success",
            message,
            data,
        });
    });
    static getById = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant ID is required", 400);
        }
        const { id, variantId } = req.params;
        if (!id || !variantId) {
            throw new AppError("Product ID and Variant ID are required", 400);
        }
        const { data, message } = await ProductVariantsServices.getById(tenantId, id, variantId);
        res.status(200).json({
            status: "success",
            message,
            data,
        });
    });
    static update = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant ID is required", 400);
        }
        const { id, variantId } = req.params;
        if (!id || !variantId) {
            throw new AppError("Product ID and Variant ID are required", 400);
        }
        const updateData = req.body;
        const { data, message } = await ProductVariantsServices.update(tenantId, id, variantId, updateData);
        res.status(200).json({
            status: "success",
            message,
            data,
        });
    });
    static delete = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant ID is required", 400);
        }
        const { id, variantId } = req.params;
        if (!id || !variantId) {
            throw new AppError("Product ID and Variant ID are required", 400);
        }
        const { message } = await ProductVariantsServices.delete(tenantId, id, variantId);
        res.status(200).json({
            status: "success",
            message,
        });
    });
}

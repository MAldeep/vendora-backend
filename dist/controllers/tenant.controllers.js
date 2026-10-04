import { TenantServices } from "../services/tenant.services.js";
import { AppError } from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
export class TenantControllers {
    static create = catchAsync(async (req, res, next) => {
        const ownerId = req.user?.id;
        const data = req.body;
        if (!ownerId) {
            return next(new AppError("Unauthorized for adding a new tenant", 401));
        }
        const tenant = await TenantServices.create(ownerId, data);
        res.status(201).json({
            status: "success",
            message: "Tenant created successfully !",
            data: { tenant },
        });
    });
    static getAll = catchAsync(async (req, res) => {
        const { tenants, meta } = await TenantServices.getAll(req.query);
        res.status(200).json({
            status: "success",
            results: tenants.length,
            data: {
                tenants,
                meta,
            },
        });
    });
    static getBySlug = catchAsync(async (req, res) => {
        const slug = req.body;
        const tenant = await TenantServices.getBySlug(slug);
        res.status(200).json({
            status: "success",
            message: "Tenant found",
            data: { tenant },
        });
    });
    static update = catchAsync(async (req, res) => {
        const { id } = req.params;
        const data = { id, ...req.body };
        const tenant = await TenantServices.update(data);
        res.status(200).json({
            status: "success",
            message: "Tenant Updated Successfully !",
            data: {
                tenant,
            },
        });
    });
    static toggleStatus = catchAsync(async (req, res) => {
        const data = req.body;
        const tenant = await TenantServices.toggleStatus(data);
        res.status(200).json({
            status: "success",
            message: "Tenant's Status Updated Successfully !",
            data: { tenant },
        });
    });
    static delete = catchAsync(async (req, res) => {
        const { id } = req.params;
        const message = await TenantServices.delete({ id: String(id) });
        res.status(200).json({
            status: "success",
            message,
        });
    });
    static addOrUpdateLogo = catchAsync(async (req, res) => {
        const tenantId = req.tenantId;
        if (!tenantId) {
            throw new AppError("Tenant Id must be provided", 400);
        }
        const file = req.file;
        const tenant = await TenantServices.addOrUpdateLogo(tenantId, file);
        res.status(200).json({
            status: "success",
            message: "Tenant Logo Updated Successfully !",
            data: { tenant },
        });
    });
}

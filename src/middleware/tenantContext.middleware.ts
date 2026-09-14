import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma.js";
import { tenantStorage } from "../context/tenant.context.js";

export async function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let tenantIdentifier: string | undefined;
    if (!tenantIdentifier && req.subdomains.length > 0) {
      tenantIdentifier = req.subdomains[0];
    }
    if (!tenantIdentifier) {
      return res.status(400).json({
        error: "Tenant-ID or Subdomain is required to perform this action.",
      });
    }
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantIdentifier }, { slug: tenantIdentifier }],
        isActive: true,
      },
    });
    if (!tenant) {
      return res.status(404).json({
        error: "Tenant not found or account is deactivated.",
      });
    }
    tenantStorage.run({ tenantId: tenant.id }, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
}

import swaggerJSDoc from "swagger-jsdoc";
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Vendora Multi-Tenant E-Commerce API",
            version: "1.0.0",
            description: "Enterprise-grade backend documentation for Vendora platform.",
            contact: { name: "Mohamed ElDeep" },
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local Development Server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
                TenantHeader: {
                    type: "apiKey",
                    in: "header",
                    name: "x-tenant-id",
                },
            },
            schemas: {
                AppErrorResponse: {
                    type: "object",
                    properties: {
                        status: { type: "string", example: "fail" },
                        message: { type: "string", example: "Error description message" },
                    },
                },
            },
        },
    },
    apis: ["./src/modules/**/*.routes.ts", "./src/routes/*.ts"],
};
export const swaggerSpec = swaggerJSDoc(options);

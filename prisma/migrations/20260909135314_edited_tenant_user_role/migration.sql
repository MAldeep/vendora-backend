-- DropForeignKey
ALTER TABLE "tenant_user_roles" DROP CONSTRAINT "tenant_user_roles_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_user_roles" DROP CONSTRAINT "tenant_user_roles_user_id_fkey";

-- AddForeignKey
ALTER TABLE "tenant_user_roles" ADD CONSTRAINT "tenant_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_user_roles" ADD CONSTRAINT "tenant_user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

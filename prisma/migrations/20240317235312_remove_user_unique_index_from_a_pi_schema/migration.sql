-- DropIndex
DROP INDEX "ApiSchema_userId_key";

-- AlterTable
ALTER TABLE "OrganizationUser" ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true;

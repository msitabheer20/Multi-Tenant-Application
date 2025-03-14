/*
  Warnings:

  - Added the required column `name` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serverId` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "serverId" TEXT NOT NULL,
ADD COLUMN     "type" "ChannelType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Channel_profileId_idx" ON "Channel"("profileId");

-- CreateIndex
CREATE INDEX "Channel_serverId_idx" ON "Channel"("serverId");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

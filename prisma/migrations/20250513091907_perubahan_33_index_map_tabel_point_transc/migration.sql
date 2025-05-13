-- CreateIndex
CREATE INDEX "PointTransactions_userId_is_expired_idx" ON "PointTransactions"("userId", "is_expired");

-- CreateIndex
CREATE INDEX "PointTransactions_expiry_date_idx" ON "PointTransactions"("expiry_date");

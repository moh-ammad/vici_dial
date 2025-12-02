-- CreateTable
CREATE TABLE `Agent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NULL,
    `userGroup` VARCHAR(191) NULL,

    UNIQUE INDEX `Agent_user_key`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` VARCHAR(191) NOT NULL,
    `campaignName` VARCHAR(191) NULL,
    `active` VARCHAR(191) NULL,
    `dialMethod` VARCHAR(191) NULL,
    `callerIdName` VARCHAR(191) NULL,
    `hopperLevel` VARCHAR(191) NULL,
    `nextAgentRouting` VARCHAR(191) NULL,
    `dialStatus` VARCHAR(191) NULL,
    `dialTimeout` VARCHAR(191) NULL,
    `cidOverride` VARCHAR(191) NULL,
    `cidAlt` VARCHAR(191) NULL,

    UNIQUE INDEX `Campaign_campaignId_key`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentCampaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `campaignId` INTEGER NOT NULL,

    UNIQUE INDEX `AgentCampaign_agentId_campaignId_key`(`agentId`, `campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentStats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `calls` INTEGER NULL,
    `loginTime` VARCHAR(191) NULL,
    `totalTalkTime` VARCHAR(191) NULL,
    `avgTalkTime` VARCHAR(191) NULL,
    `avgWaitTime` VARCHAR(191) NULL,
    `pctOfQueue` VARCHAR(191) NULL,
    `pauseTime` VARCHAR(191) NULL,
    `sessions` INTEGER NULL,
    `avgSession` VARCHAR(191) NULL,
    `pauses` INTEGER NULL,
    `avgPauseTime` VARCHAR(191) NULL,
    `pausePct` VARCHAR(191) NULL,
    `pausesPerSession` VARCHAR(191) NULL,
    `waitTime` VARCHAR(191) NULL,
    `talkTime` VARCHAR(191) NULL,
    `dispoTime` VARCHAR(191) NULL,
    `deadTime` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AgentCampaign` ADD CONSTRAINT `AgentCampaign_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentCampaign` ADD CONSTRAINT `AgentCampaign_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentStats` ADD CONSTRAINT `AgentStats_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

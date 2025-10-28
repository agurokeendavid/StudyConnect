-- SQL Script for StudyGroupMessages Table
-- Run this if you prefer to create the table manually instead of using migrations

CREATE TABLE `StudyGroupMessages` (
 `Id` int NOT NULL AUTO_INCREMENT,
    `StudyGroupId` int NOT NULL,
    `UserId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Message` varchar(5000) CHARACTER SET utf8mb4 NOT NULL,
    `PostedAt` datetime(6) NOT NULL,
    `CreatedBy` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedByName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `ModifiedBy` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ModifiedByName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ModifiedAt` datetime(6) NOT NULL,
    `DeletedBy` longtext CHARACTER SET utf8mb4 NULL,
    `DeletedByName` longtext CHARACTER SET utf8mb4 NULL,
    `DeletedAt` datetime(6) NULL,
    CONSTRAINT `PK_StudyGroupMessages` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_StudyGroupMessages_AspNetUsers_UserId` FOREIGN KEY (`UserId`) REFERENCES `AspNetUsers` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_StudyGroupMessages_StudyGroups_StudyGroupId` FOREIGN KEY (`StudyGroupId`) REFERENCES `StudyGroups` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_StudyGroupMessages_StudyGroupId` ON `StudyGroupMessages` (`StudyGroupId`);
CREATE INDEX `IX_StudyGroupMessages_UserId` ON `StudyGroupMessages` (`UserId`);

-- Insert into migrations history (if using EF Core migrations tracking)
-- UPDATE THE PRODUCT VERSION TO MATCH YOUR CURRENT EF CORE VERSION
INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250101000000_AddStudyGroupMessagesTable', '9.0.0');

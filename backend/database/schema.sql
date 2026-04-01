-- =============================================================================
-- TenderHub Kenya – MySQL Database Schema
-- Run this in MySQL Workbench against an empty "tenderhub" schema,
-- OR let EF Core handle it automatically (dotnet ef database update).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `tenderhub`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `tenderhub`;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Users` (
    `Id`           CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `Email`        VARCHAR(255) NOT NULL,
    `Name`         VARCHAR(200) NOT NULL,
    `PasswordHash` TEXT         NOT NULL,
    `Role`         VARCHAR(20)  NOT NULL DEFAULT 'Client',
    `CreatedAt`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uq_users_email UNIQUE (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tenders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Tenders` (
    `Id`                CHAR(36)       NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `ExternalId`        VARCHAR(100)   NOT NULL DEFAULT '',
    `Title`             VARCHAR(500)   NOT NULL,
    `TenderNumber`      VARCHAR(100)   NOT NULL,
    `ProcuringEntity`   VARCHAR(300)   NOT NULL,
    `Deadline`          DATETIME(6)    NOT NULL,
    `Industry`          TEXT           NOT NULL,
    `BidBondRequired`   BOOLEAN     NOT NULL DEFAULT 0,
    `BidBondAmount`     DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    `Category`          VARCHAR(20)    NOT NULL DEFAULT 'Government',
    `SubCategory`       VARCHAR(20)    NOT NULL DEFAULT 'Goods',
    `Summary`           TEXT           NOT NULL,
    `Description`       LONGTEXT       NOT NULL,
    `DocumentUrl`       TEXT           NOT NULL,
    `RequiredDocuments` JSON,
    `CreatedAt`         DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt`         DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_tenders_external_id   (`ExternalId`),
    INDEX idx_tenders_tender_number (`TenderNumber`),
    INDEX idx_tenders_deadline      (`Deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Banks ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Banks` (
    `Id`             CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `Name`           VARCHAR(200)  NOT NULL,
    `Logo`           VARCHAR(500)  NOT NULL DEFAULT '',
    `ProcessingTime` VARCHAR(100)  NOT NULL DEFAULT '',
    `Fees`           VARCHAR(300)  NOT NULL DEFAULT '',
    `DigitalOption`  BOOLEAN    NOT NULL DEFAULT 0,
    `Rating`         DECIMAL(3,1)  NOT NULL DEFAULT 0.0,
    `IsActive`       BOOLEAN    NOT NULL DEFAULT 1,
    `CreatedAt`      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt`      DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Applications ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Applications` (
    `Id`                         CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `UserId`                     CHAR(36)      NOT NULL,
    `TenderId`                   CHAR(36)      NOT NULL,
    `BankId`                     CHAR(36),

    -- Denormalized display fields
    `TenderTitle`                VARCHAR(500)  NOT NULL DEFAULT '',
    `TenderNumber`               VARCHAR(100)  NOT NULL DEFAULT '',
    `BankName`                   VARCHAR(200),

    -- Status
    `Status`                     VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    `RejectionReason`            TEXT,
    `DocumentUrl`                TEXT,

    -- Financial
    `BondAmount`                 DECIMAL(18,2),

    -- Step 1 – Company Information
    `CompanyName`                VARCHAR(300)  NOT NULL DEFAULT '',
    `BusinessRegistrationNumber` VARCHAR(100)  NOT NULL DEFAULT '',
    `ContactPerson`              VARCHAR(200)  NOT NULL DEFAULT '',
    `PhoneNumber`                VARCHAR(50)   NOT NULL DEFAULT '',
    `ContactEmail`               VARCHAR(255)  NOT NULL DEFAULT '',
    `PhysicalAddress`            TEXT          NOT NULL,

    -- Step 2 – Financial Details
    `AnnualRevenue`              DECIMAL(18,2),
    `CompanyNetWorth`            DECIMAL(18,2),
    `BankAccountNumber`          VARCHAR(100),

    -- Timestamps
    `SubmittedAt`                DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `ApprovedAt`                 DATETIME(6),
    `UpdatedAt`                  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_app_user   FOREIGN KEY (`UserId`)   REFERENCES `Users`(`Id`)   ON DELETE RESTRICT,
    CONSTRAINT fk_app_tender FOREIGN KEY (`TenderId`) REFERENCES `Tenders`(`Id`) ON DELETE RESTRICT,
    CONSTRAINT fk_app_bank   FOREIGN KEY (`BankId`)   REFERENCES `Banks`(`Id`)   ON DELETE SET NULL,

    INDEX idx_applications_user_id   (`UserId`),
    INDEX idx_applications_tender_id (`TenderId`),
    INDEX idx_applications_status    (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── ApplicationDocuments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ApplicationDocuments` (
    `Id`            CHAR(36)      NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `ApplicationId` CHAR(36)      NOT NULL,
    `Name`          VARCHAR(200)  NOT NULL DEFAULT '',
    `FileName`      VARCHAR(300)  NOT NULL DEFAULT '',
    `ContentType`   VARCHAR(100)  NOT NULL DEFAULT '',
    `StoragePath`   TEXT          NOT NULL,
    `FileSizeBytes` BIGINT        NOT NULL DEFAULT 0,
    `UploadedAt`    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_doc_application FOREIGN KEY (`ApplicationId`)
        REFERENCES `Applications`(`Id`) ON DELETE CASCADE,
    INDEX idx_documents_application_id (`ApplicationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── StatusHistories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `StatusHistories` (
    `Id`              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
    `ApplicationId`   CHAR(36)     NOT NULL,
    `Status`          VARCHAR(50)  NOT NULL,
    `Notes`           TEXT         NOT NULL,
    `ChangedByUserId` CHAR(36),
    `ChangedAt`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_history_application FOREIGN KEY (`ApplicationId`)
        REFERENCES `Applications`(`Id`) ON DELETE CASCADE,
    INDEX idx_status_history_application_id (`ApplicationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- Seed Data
-- =============================================================================

-- Default admin  (password: Admin@1234 – change in production!)
INSERT IGNORE INTO `Users` (`Id`, `Email`, `Name`, `PasswordHash`, `Role`)
VALUES (
    UUID(),
    'admin@tenderhub.co.ke',
    'TenderHub Admin',
    '$2a$11$rX8KJSQ.MKzmb2N6Jj5aZuCRg0Tsk6MZQX6m6.OPrjyMT9Z8FRKi',
    'Admin'
);

-- Six Kenyan banks
INSERT INTO `Banks` (`Id`, `Name`, `Logo`, `ProcessingTime`, `Fees`, `DigitalOption`, `Rating`) VALUES
    (UUID(), 'Kenya Commercial Bank', '/logos/kcb.png',    '2-3 business days', 'KES 15,000 + 1.5% of bond value', 1, 4.5),
    (UUID(), 'Equity Bank Kenya',     '/logos/equity.png', '3-5 business days', 'KES 12,000 + 1.8% of bond value', 1, 4.3),
    (UUID(), 'Co-operative Bank',     '/logos/coop.png',   '3-4 business days', 'KES 10,000 + 2.0% of bond value', 0, 4.1),
    (UUID(), 'Standard Chartered',    '/logos/sc.png',     '2-3 business days', 'KES 20,000 + 1.2% of bond value', 1, 4.7),
    (UUID(), 'Absa Bank Kenya',       '/logos/absa.png',   '4-5 business days', 'KES 14,000 + 1.6% of bond value', 0, 4.0),
    (UUID(), 'NCBA Bank',             '/logos/ncba.png',   '3-4 business days', 'KES 11,000 + 1.9% of bond value', 1, 4.2);

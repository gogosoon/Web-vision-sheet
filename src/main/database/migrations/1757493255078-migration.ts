import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1757493255078 implements MigrationInterface {
    name = 'Migration1757493255078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Waitlist" ("id" character varying(191) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" character varying(191) NOT NULL, "ipAddress" character varying(191), "userAgent" text, CONSTRAINT "UQ_9e44e0c714841db9b21fcccb458" UNIQUE ("email"), CONSTRAINT "PK_3715dd6b79ec38b3d76e8ff568e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e44e0c714841db9b21fcccb45" ON "Waitlist" ("email") `);
        await queryRunner.query(`CREATE TABLE "User" ("id" character varying(191) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying, "email" character varying, "emailVerified" TIMESTAMP WITH TIME ZONE, "image" character varying, "bio" text, "credits" integer NOT NULL DEFAULT '50', CONSTRAINT "UQ_4a257d2c9837248d70640b3e36e" UNIQUE ("email"), CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "CreditTransaction" ("id" character varying(191) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" character varying(191) NOT NULL, "creditAmount" integer NOT NULL, "type" character varying NOT NULL, "usageDetailsComments" text, "usageDetailsJsonDump" text, CONSTRAINT "PK_66905b6a17371ab4a6e06b302a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e79c26771df25bc056a37b81b8" ON "CreditTransaction" ("userId") `);
        await queryRunner.query(`CREATE TABLE "DesktopToken" ("id" character varying(191) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "token" character varying(191) NOT NULL, "userId" character varying(191) NOT NULL, "expires" TIMESTAMP WITH TIME ZONE NOT NULL, "logged_in_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e699675bdf137fed014146d1b9a" UNIQUE ("token"), CONSTRAINT "PK_13c6f12891703700fcac88416c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e699675bdf137fed014146d1b9" ON "DesktopToken" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_66c2bb9429490f0daa511bdce9" ON "DesktopToken" ("userId") `);
        await queryRunner.query(`ALTER TABLE "CreditTransaction" ADD CONSTRAINT "FK_e79c26771df25bc056a37b81b8f" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "DesktopToken" ADD CONSTRAINT "FK_66c2bb9429490f0daa511bdce94" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "DesktopToken" DROP CONSTRAINT "FK_66c2bb9429490f0daa511bdce94"`);
        await queryRunner.query(`ALTER TABLE "CreditTransaction" DROP CONSTRAINT "FK_e79c26771df25bc056a37b81b8f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66c2bb9429490f0daa511bdce9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e699675bdf137fed014146d1b9"`);
        await queryRunner.query(`DROP TABLE "DesktopToken"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e79c26771df25bc056a37b81b8"`);
        await queryRunner.query(`DROP TABLE "CreditTransaction"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e44e0c714841db9b21fcccb45"`);
        await queryRunner.query(`DROP TABLE "Waitlist"`);
    }

}

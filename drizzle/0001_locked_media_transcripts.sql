ALTER TABLE "responses"
  ADD COLUMN "transcript_locked" boolean DEFAULT false NOT NULL,
  ADD COLUMN "transcript_status" varchar(20) DEFAULT 'READY' NOT NULL;
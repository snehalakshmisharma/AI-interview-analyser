-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."difficulty" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."interview_mode" AS ENUM('TEXT', 'AUDIO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('CREATED', 'IN_PROGRESS', 'COMPLETED', 'ANALYZED');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('HR', 'TECHNICAL', 'BEHAVIORAL', 'MIXED');--> statement-breakpoint
CREATE TYPE "public"."question_category" AS ENUM('GENERAL', 'CS', 'DATA_SCIENCE_AI', 'SOFTWARE_DEV', 'HR', 'BEHAVIORAL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."response_type" AS ENUM('TEXT', 'AUDIO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'FACULTY', 'ADMIN');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_text" text NOT NULL,
	"category" "question_category" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"interview_type" "interview_type" NOT NULL,
	"expected_concepts" jsonb NOT NULL,
	"evaluation_guidance" text NOT NULL,
	"time_limit" integer DEFAULT 120 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'STUDENT' NOT NULL,
	"department" varchar(255),
	"year" varchar(50),
	"skills" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_question_id" uuid NOT NULL,
	"response_type" "response_type" NOT NULL,
	"text_content" text,
	"audio_path" text,
	"video_path" text,
	"transcript_text" text,
	"duration" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"technical_score" integer NOT NULL,
	"relevance_score" integer NOT NULL,
	"communication_score" integer NOT NULL,
	"fluency_score" integer NOT NULL,
	"grammar_score" integer NOT NULL,
	"vocabulary_score" integer NOT NULL,
	"problem_solving_score" integer NOT NULL,
	"structure_score" integer NOT NULL,
	"confidence_score" integer NOT NULL,
	"overall_score" integer NOT NULL,
	"explanation" text NOT NULL,
	"strengths" jsonb NOT NULL,
	"improvement_areas" jsonb NOT NULL,
	"missing_concepts" jsonb NOT NULL,
	"recommendations" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"type" "interview_type" NOT NULL,
	"category" "question_category" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"mode" "interview_mode" NOT NULL,
	"status" "interview_status" DEFAULT 'CREATED' NOT NULL,
	"total_questions" integer NOT NULL,
	"overall_score" integer,
	"technical_score" integer,
	"communication_score" integer,
	"fluency_score" integer,
	"relevance_score" integer,
	"placement_readiness" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speech_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"duration" integer,
	"speaking_rate" real,
	"pause_count" integer,
	"avg_pause_duration" real,
	"filler_words_count" integer,
	"fluency_score" integer,
	"confidence_indicator" integer,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_interview_question_id_interview_questions_id_fk" FOREIGN KEY ("interview_question_id") REFERENCES "public"."interview_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speech_analyses" ADD CONSTRAINT "speech_analyses_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;
*/
import { pgTable, uuid, text, jsonb, integer, timestamp, unique, varchar, foreignKey, real, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const difficulty = pgEnum("difficulty", ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export const interviewMode = pgEnum("interview_mode", ['TEXT', 'AUDIO', 'VIDEO'])
export const interviewStatus = pgEnum("interview_status", ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'ANALYZED'])
export const interviewType = pgEnum("interview_type", ['HR', 'TECHNICAL', 'BEHAVIORAL', 'MIXED'])
export const questionCategory = pgEnum("question_category", ['GENERAL', 'CS', 'DATA_SCIENCE_AI', 'SOFTWARE_DEV', 'HR', 'BEHAVIORAL', 'CUSTOM'])
export const responseType = pgEnum("response_type", ['TEXT', 'AUDIO', 'VIDEO'])
export const userRole = pgEnum("user_role", ['STUDENT', 'FACULTY', 'ADMIN'])


export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionText: text("question_text").notNull(),
	category: questionCategory().notNull(),
	difficulty: difficulty().notNull(),
	interviewType: interviewType("interview_type").notNull(),
	expectedConcepts: jsonb("expected_concepts").notNull(),
	evaluationGuidance: text("evaluation_guidance").notNull(),
	timeLimit: integer("time_limit").default(120).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash"),
	role: userRole().default('STUDENT').notNull(),
	department: varchar({ length: 255 }),
	year: varchar({ length: 50 }),
	skills: text(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const responses = pgTable("responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interviewQuestionId: uuid("interview_question_id").notNull(),
	responseType: responseType("response_type").notNull(),
	textContent: text("text_content"),
	audioPath: text("audio_path"),
	videoPath: text("video_path"),
	transcriptText: text("transcript_text"),
	duration: integer(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.interviewQuestionId],
			foreignColumns: [interviewQuestions.id],
			name: "responses_interview_question_id_interview_questions_id_fk"
		}).onDelete("cascade"),
]);

export const evaluations = pgTable("evaluations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	responseId: uuid("response_id").notNull(),
	technicalScore: integer("technical_score").notNull(),
	relevanceScore: integer("relevance_score").notNull(),
	communicationScore: integer("communication_score").notNull(),
	fluencyScore: integer("fluency_score").notNull(),
	grammarScore: integer("grammar_score").notNull(),
	vocabularyScore: integer("vocabulary_score").notNull(),
	problemSolvingScore: integer("problem_solving_score").notNull(),
	structureScore: integer("structure_score").notNull(),
	confidenceScore: integer("confidence_score").notNull(),
	overallScore: integer("overall_score").notNull(),
	explanation: text().notNull(),
	strengths: jsonb().notNull(),
	improvementAreas: jsonb("improvement_areas").notNull(),
	missingConcepts: jsonb("missing_concepts").notNull(),
	recommendations: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.responseId],
			foreignColumns: [responses.id],
			name: "evaluations_response_id_responses_id_fk"
		}).onDelete("cascade"),
]);

export const interviews = pgTable("interviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	type: interviewType().notNull(),
	category: questionCategory().notNull(),
	difficulty: difficulty().notNull(),
	mode: interviewMode().notNull(),
	status: interviewStatus().default('CREATED').notNull(),
	totalQuestions: integer("total_questions").notNull(),
	overallScore: integer("overall_score"),
	technicalScore: integer("technical_score"),
	communicationScore: integer("communication_score"),
	fluencyScore: integer("fluency_score"),
	relevanceScore: integer("relevance_score"),
	placementReadiness: integer("placement_readiness"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "interviews_student_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const interviewQuestions = pgTable("interview_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interviewId: uuid("interview_id").notNull(),
	questionId: uuid("question_id").notNull(),
	sequence: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.interviewId],
			foreignColumns: [interviews.id],
			name: "interview_questions_interview_id_interviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "interview_questions_question_id_questions_id_fk"
		}),
]);

export const oauthAccounts = pgTable("oauth_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	provider: varchar({ length: 50 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "oauth_accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const speechAnalyses = pgTable("speech_analyses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	responseId: uuid("response_id").notNull(),
	duration: integer(),
	speakingRate: real("speaking_rate"),
	pauseCount: integer("pause_count"),
	avgPauseDuration: real("avg_pause_duration"),
	fillerWordsCount: integer("filler_words_count"),
	fluencyScore: integer("fluency_score"),
	confidenceIndicator: integer("confidence_indicator"),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.responseId],
			foreignColumns: [responses.id],
			name: "speech_analyses_response_id_responses_id_fk"
		}).onDelete("cascade"),
]);

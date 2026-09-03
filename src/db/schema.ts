import { pgTable, text, varchar, integer, timestamp, pgEnum, jsonb, uuid, real, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["STUDENT", "FACULTY", "ADMIN"]);
export const interviewTypeEnum = pgEnum("interview_type", ["HR", "TECHNICAL", "BEHAVIORAL", "MIXED"]);
export const difficultyEnum = pgEnum("difficulty", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const interviewModeEnum = pgEnum("interview_mode", ["TEXT", "AUDIO", "VIDEO"]);
export const interviewStatusEnum = pgEnum("interview_status", ["CREATED", "IN_PROGRESS", "COMPLETED", "ANALYZED"]);
export const responseTypeEnum = pgEnum("response_type", ["TEXT", "AUDIO", "VIDEO"]);
export const questionCategoryEnum = pgEnum("question_category", ["GENERAL", "CS", "DATA_SCIENCE_AI", "SOFTWARE_DEV", "HR", "BEHAVIORAL", "CUSTOM"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").default("STUDENT").notNull(),
  department: varchar("department", { length: 255 }),
  year: varchar("year", { length: 50 }),
  skills: text("skills"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerAccountUnique: uniqueIndex("oauth_accounts_provider_account_idx").on(table.provider, table.providerAccountId),
}));

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionText: text("question_text").notNull(),
  category: questionCategoryEnum("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  interviewType: interviewTypeEnum("interview_type").notNull(),
  expectedConcepts: jsonb("expected_concepts").$type<string[]>().notNull(),
  evaluationGuidance: text("evaluation_guidance").notNull(),
  timeLimit: integer("time_limit").default(120).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: interviewTypeEnum("type").notNull(),
  category: questionCategoryEnum("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  mode: interviewModeEnum("mode").notNull(),
  status: interviewStatusEnum("status").default("CREATED").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  overallScore: integer("overall_score"),
  technicalScore: integer("technical_score"),
  communicationScore: integer("communication_score"),
  fluencyScore: integer("fluency_score"),
  relevanceScore: integer("relevance_score"),
  placementReadiness: integer("placement_readiness"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewId: uuid("interview_id").references(() => interviews.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questions.id).notNull(),
  sequence: integer("sequence").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responses = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  interviewQuestionId: uuid("interview_question_id").references(() => interviewQuestions.id, { onDelete: "cascade" }).notNull(),
  responseType: responseTypeEnum("response_type").notNull(),
  textContent: text("text_content"),
  audioPath: text("audio_path"),
  videoPath: text("video_path"),
  transcriptText: text("transcript_text"),
  duration: integer("duration"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const speechAnalyses = pgTable("speech_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id").references(() => responses.id, { onDelete: "cascade" }).notNull(),
  duration: integer("duration"),
  speakingRate: real("speaking_rate"),
  pauseCount: integer("pause_count"),
  avgPauseDuration: real("avg_pause_duration"),
  fillerWordsCount: integer("filler_words_count"),
  fluencyScore: integer("fluency_score"),
  confidenceIndicator: integer("confidence_indicator"),
  rawData: jsonb("raw_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id").references(() => responses.id, { onDelete: "cascade" }).notNull(),
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
  explanation: text("explanation").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  improvementAreas: jsonb("improvement_areas").$type<string[]>().notNull(),
  missingConcepts: jsonb("missing_concepts").$type<string[]>().notNull(),
  recommendations: jsonb("recommendations").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  student: one(users, { fields: [interviews.studentId], references: [users.id] }),
  questions: many(interviewQuestions),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one, many }) => ({
  interview: one(interviews, { fields: [interviewQuestions.interviewId], references: [interviews.id] }),
  question: one(questions, { fields: [interviewQuestions.questionId], references: [questions.id] }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  interviewQuestion: one(interviewQuestions, { fields: [responses.interviewQuestionId], references: [interviewQuestions.id] }),
  speechAnalysis: one(speechAnalyses),
  evaluation: one(evaluations),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  interviewQuestions: many(interviewQuestions),
}));

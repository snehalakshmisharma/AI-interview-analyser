import { relations } from "drizzle-orm/relations";
import { interviewQuestions, responses, evaluations, users, interviews, questions, oauthAccounts, speechAnalyses } from "./schema";

export const responsesRelations = relations(responses, ({one, many}) => ({
	interviewQuestion: one(interviewQuestions, {
		fields: [responses.interviewQuestionId],
		references: [interviewQuestions.id]
	}),
	evaluations: many(evaluations),
	speechAnalyses: many(speechAnalyses),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({one, many}) => ({
	responses: many(responses),
	interview: one(interviews, {
		fields: [interviewQuestions.interviewId],
		references: [interviews.id]
	}),
	question: one(questions, {
		fields: [interviewQuestions.questionId],
		references: [questions.id]
	}),
}));

export const evaluationsRelations = relations(evaluations, ({one}) => ({
	response: one(responses, {
		fields: [evaluations.responseId],
		references: [responses.id]
	}),
}));

export const interviewsRelations = relations(interviews, ({one, many}) => ({
	user: one(users, {
		fields: [interviews.studentId],
		references: [users.id]
	}),
	interviewQuestions: many(interviewQuestions),
}));

export const usersRelations = relations(users, ({many}) => ({
	interviews: many(interviews),
	oauthAccounts: many(oauthAccounts),
}));

export const questionsRelations = relations(questions, ({many}) => ({
	interviewQuestions: many(interviewQuestions),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({one}) => ({
	user: one(users, {
		fields: [oauthAccounts.userId],
		references: [users.id]
	}),
}));

export const speechAnalysesRelations = relations(speechAnalyses, ({one}) => ({
	response: one(responses, {
		fields: [speechAnalyses.responseId],
		references: [responses.id]
	}),
}));
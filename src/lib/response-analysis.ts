import { eq } from "drizzle-orm";
import { db } from "@/db";
import { evaluations, questions, speechAnalyses } from "@/db/schema";
import { evaluateResponse } from "@/lib/ai-evaluation";
import { analyzeSpeechMetrics } from "@/lib/speech";

type AnalyzeResponseInput = {
  responseId: string;
  question: typeof questions.$inferSelect;
  candidateResponse: string;
  duration?: number | null;
};

export async function analyzeAndPersistResponse({
  responseId,
  question,
  candidateResponse,
  duration,
}: AnalyzeResponseInput) {
  const speechMetrics = analyzeSpeechMetrics(candidateResponse, duration ?? undefined);
  const speechValues = {
    duration: speechMetrics.duration,
    speakingRate: speechMetrics.speakingRate,
    pauseCount: speechMetrics.pauseCount,
    avgPauseDuration: speechMetrics.avgPauseDuration,
    fillerWordsCount: speechMetrics.fillerWordsCount,
    fluencyScore: speechMetrics.fluencyScore,
    confidenceIndicator: speechMetrics.confidenceIndicator,
    rawData: speechMetrics.rawData,
  };

  const [existingSpeechAnalysis] = await db.select().from(speechAnalyses)
    .where(eq(speechAnalyses.responseId, responseId)).limit(1);
  if (existingSpeechAnalysis) {
    await db.update(speechAnalyses).set(speechValues)
      .where(eq(speechAnalyses.id, existingSpeechAnalysis.id));
  } else {
    await db.insert(speechAnalyses).values({ responseId, ...speechValues });
  }

  const { result, mode } = await evaluateResponse({
    question: question.questionText,
    expectedConcepts: question.expectedConcepts as string[],
    evaluationGuidance: question.evaluationGuidance,
    candidateResponse,
    speechInfo: {
      duration: speechMetrics.duration,
      speakingRate: speechMetrics.speakingRate,
      pauseCount: speechMetrics.pauseCount,
      fluencyScore: speechMetrics.fluencyScore,
    },
  });
  const evaluationValues = {
    technicalScore: result.technical_score,
    relevanceScore: result.relevance_score,
    communicationScore: result.communication_score,
    fluencyScore: result.fluency_score,
    grammarScore: result.grammar_score,
    vocabularyScore: result.vocabulary_score,
    problemSolvingScore: result.problem_solving_score,
    structureScore: result.structure_score,
    confidenceScore: result.confidence_indicator,
    overallScore: result.overall_score,
    explanation: result.explanation,
    strengths: result.strengths,
    improvementAreas: result.improvement_areas,
    missingConcepts: result.missing_concepts,
    recommendations: result.recommendations,
  };

  const [existingEvaluation] = await db.select().from(evaluations)
    .where(eq(evaluations.responseId, responseId)).limit(1);
  let evaluation;
  if (existingEvaluation) {
    [evaluation] = await db.update(evaluations).set(evaluationValues)
      .where(eq(evaluations.id, existingEvaluation.id)).returning();
  } else {
    [evaluation] = await db.insert(evaluations)
      .values({ responseId, ...evaluationValues }).returning();
  }

  return { speechMetrics, evaluation, mode };
}
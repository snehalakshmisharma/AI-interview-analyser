// Centralized scoring configuration
export const SCORING_WEIGHTS = {
  technical: 0.25,
  relevance: 0.15,
  communication: 0.15,
  fluency: 0.10,
  grammar: 0.10,
  vocabulary: 0.05,
  problemSolving: 0.10,
  structure: 0.05,
  confidence: 0.05,
} as const;

export type DimensionScores = {
  technical_score: number;
  relevance_score: number;
  communication_score: number;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  problem_solving_score: number;
  structure_score: number;
  confidence_score: number;
};

export function calculateOverallScore(scores: DimensionScores): number {
  const weighted =
    scores.technical_score * SCORING_WEIGHTS.technical +
    scores.relevance_score * SCORING_WEIGHTS.relevance +
    scores.communication_score * SCORING_WEIGHTS.communication +
    scores.fluency_score * SCORING_WEIGHTS.fluency +
    scores.grammar_score * SCORING_WEIGHTS.grammar +
    scores.vocabulary_score * SCORING_WEIGHTS.vocabulary +
    scores.problem_solving_score * SCORING_WEIGHTS.problemSolving +
    scores.structure_score * SCORING_WEIGHTS.structure +
    scores.confidence_score * SCORING_WEIGHTS.confidence;

  return Math.round(Math.min(100, Math.max(0, weighted)));
}

export function calculatePlacementReadiness(avgScores: {
  technical: number;
  communication: number;
  overall: number;
}): { technicalReadiness: number; communicationReadiness: number; overallReadiness: number; level: string } {
  const technicalReadiness = Math.round(avgScores.technical);
  const communicationReadiness = Math.round(avgScores.communication);
  const overallReadiness = Math.round((avgScores.technical * 0.5 + avgScores.communication * 0.3 + avgScores.overall * 0.2));

  let level = "Needs Improvement";
  if (overallReadiness >= 85) level = "Highly Ready";
  else if (overallReadiness >= 70) level = "Ready";
  else if (overallReadiness >= 55) level = "Moderately Ready";
  else if (overallReadiness >= 40) level = "Developing";

  return { technicalReadiness, communicationReadiness, overallReadiness, level };
}

export function validateScore(score: number): number {
  if (isNaN(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export const DIMENSIONS = [
  { key: "technical_score", label: "Technical Knowledge", weight: "25%", color: "#1E3A8A" },
  { key: "relevance_score", label: "Response Relevance", weight: "15%", color: "#2563EB" },
  { key: "communication_score", label: "Communication", weight: "15%", color: "#0E7490" },
  { key: "fluency_score", label: "Fluency", weight: "10%", color: "#059669" },
  { key: "grammar_score", label: "Grammar", weight: "10%", color: "#7C3AED" },
  { key: "vocabulary_score", label: "Vocabulary", weight: "5%", color: "#DB2777" },
  { key: "problem_solving_score", label: "Problem Solving", weight: "10%", color: "#D97706" },
  { key: "structure_score", label: "Answer Structure", weight: "5%", color: "#4B5563" },
  { key: "confidence_score", label: "Confidence", weight: "5%", color: "#1F2937" },
] as const;

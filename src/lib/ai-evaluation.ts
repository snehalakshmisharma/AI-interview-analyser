import { calculateOverallScore, validateScore } from "./scoring";

export interface EvaluationInput {
  question: string;
  expectedConcepts: string[];
  evaluationGuidance: string;
  candidateResponse: string;
  speechInfo?: {
    duration?: number;
    speakingRate?: number;
    pauseCount?: number;
    fluencyScore?: number;
  };
}

export interface AIEvaluationResult {
  overall_score: number;
  technical_score: number;
  relevance_score: number;
  communication_score: number;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  problem_solving_score: number;
  structure_score: number;
  confidence_indicator: number;
  strengths: string[];
  improvement_areas: string[];
  missing_concepts: string[];
  recommendations: string[];
  explanation: string;
}

const AI_MODE = process.env.AI_MODE || "demo";

function mockEvaluation(input: EvaluationInput): AIEvaluationResult {
  const response = (input.candidateResponse || "").trim();
  const lowerResp = response.toLowerCase();
  const wordCount = response.split(/\s+/).filter(Boolean).length;

  // Strict check for empty, trivial, refusal, or gibberish responses
  const isRefusalOrEmpty =
    wordCount < 4 ||
    lowerResp === "i don't know" ||
    lowerResp === "idk" ||
    lowerResp === "no idea" ||
    lowerResp === "skip" ||
    lowerResp === "pass" ||
    lowerResp === "nothing" ||
    lowerResp.includes("don't know") ||
    lowerResp.includes("dont know") ||
    lowerResp.includes("no clue");

  if (isRefusalOrEmpty) {
    const technical_score = Math.min(10, Math.max(0, wordCount));
    const relevance_score = 5;
    const communication_score = Math.min(20, Math.max(5, wordCount * 2));
    const fluency_score = 15;
    const grammar_score = 25;
    const vocabulary_score = 15;
    const problem_solving_score = 0;
    const structure_score = 5;
    const confidence_indicator = 10;

    const overall_score = calculateOverallScore({
      technical_score,
      relevance_score,
      communication_score,
      fluency_score,
      grammar_score,
      vocabulary_score,
      problem_solving_score,
      structure_score,
      confidence_score: confidence_indicator,
    });

    return {
      overall_score,
      technical_score,
      relevance_score,
      communication_score,
      fluency_score,
      grammar_score,
      vocabulary_score,
      problem_solving_score,
      structure_score,
      confidence_indicator,
      strengths: ["Attended the question prompt"],
      improvement_areas: [
        "Provide a substantive answer addressing the core question concepts",
        "Explain key principles rather than skipping or providing one-line responses",
        "Use technical terminology relevant to the subject matter",
      ],
      missing_concepts: input.expectedConcepts.slice(0, 5),
      recommendations: [
        "Review foundational concepts for this topic before placement interviews",
        "Even when unsure, attempt to break down the problem using first principles",
        "Aim for at least 40-80 words explaining definition, mechanism, and examples",
      ],
      explanation: "No substantive technical response was provided to address the question. In placement interviews, non-answers or one-word replies result in zero technical credit.",
    };
  }

  // Calculate concept match rigorously
  const conceptMatches = input.expectedConcepts.filter(concept => {
    const words = concept.toLowerCase().split(/[\s-_]+/);
    return words.some(w => w.length > 3 && lowerResp.includes(w));
  });
  const conceptCoverage = conceptMatches.length;
  const totalConcepts = Math.max(1, input.expectedConcepts.length);
  const coverageRatio = conceptCoverage / totalConcepts;

  // Strict scoring logic
  let technical_score = 0;
  let relevance_score = 0;

  if (conceptCoverage === 0) {
    // Completely missed all expected concepts (off-topic or incorrect answer)
    technical_score = Math.min(25, Math.round(wordCount * 0.4));
    relevance_score = Math.min(30, Math.round(wordCount * 0.5));
  } else {
    // Proportional to concept coverage + depth
    technical_score = Math.round(coverageRatio * 75 + Math.min(wordCount * 0.25, 20));
    relevance_score = Math.round(coverageRatio * 65 + 20);
  }

  const communication_score = Math.min(90, Math.max(25, 35 + Math.min(wordCount, 60) * 0.8));
  const grammar_score = response.includes("  ") || wordCount < 10 ? 45 : Math.min(92, 60 + Math.min(wordCount, 50) * 0.6);
  const vocabulary_score = conceptCoverage > 0 ? Math.min(90, 50 + conceptCoverage * 12) : 35;
  const problem_solving_score = conceptCoverage > 1 ? Math.min(90, 45 + coverageRatio * 45) : (conceptCoverage === 1 ? 40 : 15);
  const structure_score = wordCount > 25 && response.includes(".") ? Math.min(88, 50 + (response.split(".").length - 1) * 10) : 35;
  const fluency_score = input.speechInfo?.fluencyScore || (wordCount > 20 ? Math.min(85, 45 + wordCount * 0.5) : 35);
  const confidence_indicator = Math.min(90, Math.max(20, (technical_score * 0.5) + (communication_score * 0.5)));

  technical_score = validateScore(technical_score);
  relevance_score = validateScore(relevance_score);

  const overall_score = calculateOverallScore({
    technical_score,
    relevance_score,
    communication_score: validateScore(communication_score),
    fluency_score: validateScore(fluency_score),
    grammar_score: validateScore(grammar_score),
    vocabulary_score: validateScore(vocabulary_score),
    problem_solving_score: validateScore(problem_solving_score),
    structure_score: validateScore(structure_score),
    confidence_score: validateScore(confidence_indicator),
  });

  const missingConcepts = input.expectedConcepts.filter(
    c => !conceptMatches.includes(c)
  );

  const strengths: string[] = [];
  if (conceptCoverage > 0) strengths.push(`Addressed key concepts: ${conceptMatches.slice(0, 2).join(", ")}`);
  if (wordCount > 35) strengths.push("Provided a structured explanation with adequate elaboration");
  if (relevance_score >= 65) strengths.push("Response remained closely focused on the core interview question");
  if (strengths.length === 0) strengths.push("Attempted to respond to the prompt");

  const improvementAreas: string[] = [];
  if (missingConcepts.length > 0) {
    improvementAreas.push(`Missing critical technical concepts: ${missingConcepts.slice(0, 3).join(", ")}`);
  }
  if (wordCount < 30) improvementAreas.push("Elaborate further with real-world examples and trade-off analysis");
  if (structure_score < 60) improvementAreas.push("Organize your response into definition, mechanism, and application");
  if (technical_score < 50) improvementAreas.push("Review fundamental principles to ensure technical accuracy");

  const recommendations: string[] = [];
  if (missingConcepts.length > 0) {
    recommendations.push(`Deepen preparation on: ${missingConcepts.slice(0, 3).join(", ")}`);
  }
  recommendations.push("Use the STAR (Situation, Task, Action, Result) method for structured technical and behavioral answers");
  if (wordCount < 40) recommendations.push("Aim for 60-120 words to demonstrate thorough domain mastery in campus interviews");

  return {
    overall_score,
    technical_score,
    relevance_score,
    communication_score: validateScore(communication_score),
    fluency_score: validateScore(fluency_score),
    grammar_score: validateScore(grammar_score),
    vocabulary_score: validateScore(vocabulary_score),
    problem_solving_score: validateScore(problem_solving_score),
    structure_score: validateScore(structure_score),
    confidence_indicator: validateScore(confidence_indicator),
    strengths: strengths.slice(0, 3),
    improvement_areas: improvementAreas.slice(0, 3),
    missing_concepts: missingConcepts.slice(0, 5),
    recommendations: recommendations.slice(0, 4),
    explanation: overall_score >= 65
      ? `Solid response covering ${conceptCoverage} of ${totalConcepts} expected concepts with good technical clarity.`
      : conceptCoverage === 0
      ? "The response did not match the expected technical concepts. Review the topic fundamentals and include specific domain terminology."
      : `Partial answer covering ${conceptCoverage} of ${totalConcepts} concepts. Expand on missing concepts (${missingConcepts.slice(0, 2).join(", ")}) to achieve a competitive placement score.`,
  };
}

async function realEvaluation(input: EvaluationInput): Promise<AIEvaluationResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiApiKey) {
    console.warn("GEMINI_API_KEY not set, falling back to demo heuristic mode");
    return mockEvaluation(input);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `You are a strict, professional campus placement interview evaluator assessing candidates for software engineering and corporate roles.

INTERVIEW QUESTION: ${input.question}
EXPECTED TECHNICAL CONCEPTS: ${JSON.stringify(input.expectedConcepts)}
EVALUATION GUIDANCE: ${input.evaluationGuidance}
CANDIDATE RESPONSE: ${input.candidateResponse}
${input.speechInfo ? `SPEECH METRICS: Duration ${input.speechInfo.duration}s, Speaking Rate ${input.speechInfo.speakingRate} WPM, Pauses ${input.speechInfo.pauseCount}` : ""}

STRICT SCORING INSTRUCTIONS:
1. If the candidate's response is empty, irrelevant, off-topic, gibberish, or says "I don't know" / "idk" / "skip", you MUST assign technical_score <= 10, relevance_score <= 10, and overall_score <= 15. Do NOT give passing marks to non-answers.
2. If the response is partially correct, score technical_score strictly based on how many of the expected concepts were accurately explained.
3. If the response is excellent, accurate, structured, and covers the expected concepts with examples, score technical_score between 80 and 100.
4. All scores must be integers between 0 and 100.

Return ONLY valid JSON matching this exact schema:
{
  "overall_score": number,
  "technical_score": number,
  "relevance_score": number,
  "communication_score": number,
  "fluency_score": number,
  "grammar_score": number,
  "vocabulary_score": number,
  "problem_solving_score": number,
  "structure_score": number,
  "confidence_indicator": number,
  "strengths": ["string"],
  "improvement_areas": ["string"],
  "missing_concepts": ["string"],
  "recommendations": ["string"],
  "explanation": "string"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
        systemInstruction: {
          parts: [
            {
              text: "You are a strict campus placement interview assessor. Return valid JSON only. Grade rigorously and accurately according to the instructions.",
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return mockEvaluation(input);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return mockEvaluation(input);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr) as AIEvaluationResult;

    const validated: AIEvaluationResult = {
      technical_score: validateScore(parsed.technical_score),
      relevance_score: validateScore(parsed.relevance_score),
      communication_score: validateScore(parsed.communication_score),
      fluency_score: validateScore(parsed.fluency_score),
      grammar_score: validateScore(parsed.grammar_score),
      vocabulary_score: validateScore(parsed.vocabulary_score),
      problem_solving_score: validateScore(parsed.problem_solving_score),
      structure_score: validateScore(parsed.structure_score),
      confidence_indicator: validateScore(parsed.confidence_indicator),
      overall_score: 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
      improvement_areas: Array.isArray(parsed.improvement_areas) ? parsed.improvement_areas.slice(0, 4) : [],
      missing_concepts: Array.isArray(parsed.missing_concepts) ? parsed.missing_concepts.slice(0, 5) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [],
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "Evaluation completed.",
    };

    validated.overall_score = calculateOverallScore({
      technical_score: validated.technical_score,
      relevance_score: validated.relevance_score,
      communication_score: validated.communication_score,
      fluency_score: validated.fluency_score,
      grammar_score: validated.grammar_score,
      vocabulary_score: validated.vocabulary_score,
      problem_solving_score: validated.problem_solving_score,
      structure_score: validated.structure_score,
      confidence_score: validated.confidence_indicator,
    });

    return validated;
  } catch (error) {
    console.error("Gemini AI evaluation failed:", error);
    return mockEvaluation(input);
  }
}

export async function evaluateResponse(input: EvaluationInput): Promise<{ result: AIEvaluationResult; mode: "real" | "demo" }> {
  if (AI_MODE === "real") {
    const result = await realEvaluation(input);
    return { result, mode: "real" };
  } else {
    const result = mockEvaluation(input);
    return { result, mode: "demo" };
  }
}

export function getAIMode(): "real" | "demo" {
  return (process.env.AI_MODE as "real" | "demo") || "demo";
}

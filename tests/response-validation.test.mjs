import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { validateResponseEdit, validateResponseSubmission, validateTextResponseEdit } from "../src/lib/response-validation.ts";
import { MediaTranscriptPanel } from "../src/components/interview/media-transcript-panel.ts";

test("media API submissions reject transcript and text aliases from clients", () => {
  for (const payload of [
    { interviewQuestionId: "question-1", responseType: "AUDIO", transcript: "forged" },
    { interviewQuestionId: "question-1", responseType: "VIDEO", transcriptText: "forged" },
    { interviewQuestionId: "question-1", responseType: "AUDIO", textContent: "forged" },
  ]) {
    const result = validateResponseSubmission(payload);
    assert.equal(result.success, false);
    assert.equal(result.status, 403);
  }
});

test("text responses remain editable through submission and update validation", () => {
  assert.equal(validateResponseSubmission({
    interviewQuestionId: "question-1",
    responseType: "TEXT",
    textContent: "An editable text answer",
  }).success, true);
  assert.deepEqual(validateTextResponseEdit({ textContent: "A corrected text answer" }), {
    success: true,
    textContent: "A corrected text answer",
  });
});

test("media transcript component renders read-only content and no text editor", () => {
  const markup = renderToStaticMarkup(createElement(MediaTranscriptPanel, {
    transcript: "A server-generated transcript",
    status: "READY",
    onRerecord: () => {},
  }));

  assert.match(markup, /Auto-transcribed — cannot be edited/);
  assert.match(markup, /A server-generated transcript/);
  assert.match(markup, /Re-record response/);
  assert.doesNotMatch(markup, /<(?:input|textarea)\b|contenteditable|onchange/i);
});

test("PATCH validation rejects transcript edits for audio and video responses", () => {
  for (const responseType of ["AUDIO", "VIDEO"]) {
    const result = validateResponseEdit({ transcript: "forged" }, responseType, true);
    assert.equal(result.success, false);
    assert.equal(result.status, 403);
  }
  assert.equal(validateResponseEdit({ textContent: "Text can still be corrected" }, "TEXT", false).success, true);
});
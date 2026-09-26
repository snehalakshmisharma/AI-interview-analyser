import { createElement } from "react";
import { RotateCcw } from "lucide-react";

type MediaTranscriptPanelProps = {
  transcript: string | null;
  status: string;
  onRerecord: () => void;
};

export function MediaTranscriptPanel({ transcript, status, onRerecord }: MediaTranscriptPanelProps) {
  const message = status === "UNAVAILABLE"
    ? "Transcription unavailable. Re-record your response to try again."
    : status === "NO_SPEECH"
      ? "No speech detected. Re-record your response."
      : transcript || "";

  return createElement("div", { className: "space-y-3 rounded-xl border border-slate-200 bg-white p-4" },
    createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" },
      createElement("h4", { className: "text-xs font-bold uppercase text-slate-900" }, "Transcript"),
      createElement("span", {
        title: "This transcript is generated from the recording and cannot be edited",
        className: "rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800",
      }, "Auto-transcribed — cannot be edited"),
    ),
    createElement("div", {
      "aria-readonly": true,
      className: "min-h-16 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700",
    }, message),
    createElement("button", {
      type: "button",
      onClick: onRerecord,
      className: "inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
    }, createElement(RotateCcw, { className: "mr-2 h-4 w-4" }), "Re-record response"),
  );
}
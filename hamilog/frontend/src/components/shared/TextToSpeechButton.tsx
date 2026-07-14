"use client";

import Icon from "@/components/shared/Icon";

type TextToSpeechButtonProps = {
  text: string;
};

// Renders the text to speech button component.
export default function TextToSpeechButton({ text }: TextToSpeechButtonProps) {
  // Handles the speak logic.
  function speak() {
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0590-\u05FF]/.test(text) ? "he-IL" : "en-US";

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      className="inline-flex items-center justify-center rounded-xl border border-app px-3 py-2 text-main transition hover:bg-card-soft"
      title="Read aloud"
      aria-label="Read aloud"
    >
      <Icon name="sound" className="h-4 w-4" />
    </button>
  );
}
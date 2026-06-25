"use client";

type TextToSpeechButtonProps = {
  text: string;
};

export default function TextToSpeechButton({ text }: TextToSpeechButtonProps) {
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
      className="rounded-xl border border-app px-3 py-2 text-sm font-semibold text-main transition hover:bg-card-soft"
      title="Read aloud"
    >
      🔊
    </button>
  );
}
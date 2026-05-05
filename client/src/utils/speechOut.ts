function stripMarkdownish(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function preferVoice(): SpeechSynthesisVoice | null {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefers = (v: SpeechSynthesisVoice) =>
    v.lang.toLowerCase().startsWith("en") &&
    /google|microsoft|premium|natural|sam|neural|rishi|aria|david|emma/i.test(
      `${v.name} ${v.voiceURI}`,
    );
  return (
    voices.find(prefers) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    voices[0]
  );
}

/** Browser TTS tuned for interviewer lines; gracefully handles voices loading asynchronously. */
export function speakInterviewerText(text: string, maxChars = 420): void {
  const raw = stripMarkdownish(text);
  const snippet =
    raw.length > maxChars ? `${raw.slice(0, maxChars).trim()}…` : raw;
  if (!snippet || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const speak = (): void => {
    const utterance = new SpeechSynthesisUtterance(snippet);
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.volume = 0.92;
    const v = preferVoice();
    if (v) utterance.voice = v;
    utterance.lang = v?.lang || "en-US";
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
    return;
  }

  window.speechSynthesis.addEventListener("voiceschanged", () => speak(), {
    once: true,
  });
}

export function silenceInterviewerSpeech(): void {
  window.speechSynthesis?.cancel();
}

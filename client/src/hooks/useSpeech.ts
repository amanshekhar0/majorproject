import { useState, useCallback, useRef } from 'react';

interface UseSpeechReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => void;
    isSpeaking: boolean;
    isSupported: boolean;
    clearTranscript: () => void;
}

export const useSpeech = (onTranscriptChange?: (text: string) => void): UseSpeechReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const isSupported =
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    const startListening = useCallback(() => {
        if (!isSupported) return;
        const SpeechRecognitionApi =
            (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition ||
            window.SpeechRecognition;
        const recognition = new SpeechRecognitionApi();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (e: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalTranscript += t;
            }
            if (finalTranscript) {
                setTranscript(finalTranscript);
                onTranscriptChange?.(finalTranscript);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isSupported, onTranscriptChange]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, []);

    const clearTranscript = useCallback(() => setTranscript(''), []);

    return { isListening, transcript, startListening, stopListening, speak, isSpeaking, isSupported, clearTranscript };
};

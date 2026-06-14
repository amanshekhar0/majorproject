import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Bot, User } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { useSpeech } from '../hooks/useSpeech';

const C = {
    bg: '#0C0C0C',
    border: '#1F1F1F',
    inputBg: '#050505',
    text: '#F5F5F5',
    muted: '#A3A3A3',
    blue: '#FFFFFF',
    aiBubbleBg: '#171717',
    userBubbleBg: '#262626',
};

export default function ChatPanel() {
    const { chatHistory, sendMessage, isAITyping, currentQuestion } = useInterview();
    const [inputText, setInputText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const { isListening, startListening, stopListening, isSupported } = useSpeech((t) => {
        setInputText(prev => prev + (prev ? ' ' : '') + t);
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isAITyping]);

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text) return;
        setInputText('');
        await sendMessage(text, {
            currentQuestion: currentQuestion?.question,
            questionType: currentQuestion?.type,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleMic = () => {
        if (isListening) stopListening();
        else startListening();
    };

    return (
        <div className="flex flex-col h-full" style={{ background: C.bg }}>
            {/* Chat header */}
            <div
                className="px-4 py-2.5 flex items-center gap-2 flex-shrink-0"
                style={{ borderBottom: `1px solid ${C.border}` }}
            >
                <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#171717' }}
                >
                    <Bot size={12} style={{ color: C.blue }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: C.text }}>AI Interviewer</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Online
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <AnimatePresence initial={false}>
                    {chatHistory.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div
                                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                style={{
                                    background: msg.role === 'assistant' ? '#171717' : '#262626',
                                }}
                            >
                                {msg.role === 'assistant'
                                    ? <Bot size={11} style={{ color: C.blue }} />
                                    : <User size={11} style={{ color: '#aaa' }} />
                                }
                            </div>

                            {/* Bubble */}
                            <div
                                className="text-xs leading-relaxed px-3 py-2 rounded-xl max-w-[82%] whitespace-pre-wrap"
                                style={{
                                    background: msg.role === 'assistant' ? C.aiBubbleBg : C.userBubbleBg,
                                    color: msg.role === 'assistant' ? C.text : '#050505',
                                    border: `1px solid ${msg.role === 'assistant' ? '#262626' : '#FFFFFF'}`,
                                    borderRadius: msg.role === 'assistant'
                                        ? '4px 12px 12px 12px'
                                        : '12px 4px 12px 12px',
                                }}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isAITyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: '#171717' }}
                        >
                            <Bot size={11} style={{ color: C.blue }} />
                        </div>
                        <div
                            className="px-3 py-2 rounded-xl flex items-center gap-1"
                            style={{ background: C.aiBubbleBg, border: `1px solid #262B36` }}
                        >
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                                    style={{ background: '#555', animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
                <div
                    className="flex items-end gap-2 rounded-lg px-3 py-2"
                    style={{ background: C.inputBg, border: `1px solid #262626` }}
                >
                    <textarea
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask the interviewer..."
                        rows={1}
                        className="flex-1 bg-transparent text-xs resize-none outline-none max-h-20 leading-relaxed"
                        style={{ color: C.text }}
                        onInput={e => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
                        }}
                    />
                    {isSupported && (
                        <button
                            onClick={toggleMic}
                            className="p-1.5 rounded-md flex-shrink-0 transition-colors"
                            style={{
                                background: isListening ? '#7f1d1d' : '#161A22',
                                color: isListening ? '#fca5a5' : C.muted,
                            }}
                            title={isListening ? 'Stop' : 'Voice input'}
                        >
                            {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        </button>
                    )}
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() || isAITyping}
                        className="p-1.5 rounded-md flex-shrink-0 transition-opacity disabled:opacity-30"
                        style={{ background: C.blue, color: '#050505' }}
                    >
                        <Send size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

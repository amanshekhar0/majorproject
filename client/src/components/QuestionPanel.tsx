import { useInterview } from '../context/InterviewContext';
import { Code, ListChecks, Bug, Briefcase } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
    mcq: ListChecks,
    output_guess: Code,
    debugging: Bug,
    dsa: Code,
    resume_deep: Briefcase,
};

const SECTION_LABEL: Record<string, string> = {
    mcq: 'MULTIPLE CHOICE',
    output_guess: 'OUTPUT GUESS',
    debugging: 'DEBUGGING',
    dsa: 'CODING',
    resume_deep: 'RESUME',
};

const DIFF_COLOR: Record<string, string> = {
    Easy: '#22c55e',
    Medium: '#f59e0b',
    Hard: '#ef4444',
};

// Professional arena colours
const C = {
    sidebar: '#0C0C0C',
    border: '#1F1F1F',
    activeRow: 'rgba(255, 255, 255, 0.05)',
    activeBorder: '#FFFFFF',
    text: '#F5F5F5',
    muted: '#A3A3A3',
    sectionLabel: '#737373',
};

export default function QuestionPanel() {
    const { questions, currentIndex, setCurrentIndex } = useInterview();

    // Group questions by type for section headers
    const sections: { type: string; label: string; items: typeof questions }[] = [];
    const seen = new Set<string>();

    questions.forEach(q => {
        const sectionType = q.type === 'mcq' ? 'mcq' : 'coding';
        if (!seen.has(sectionType)) {
            seen.add(sectionType);
            sections.push({ type: sectionType, label: sectionType === 'coding' ? 'CODING' : 'MULTIPLE CHOICE', items: [] });
        }
        sections[sections.length - 1].items.push(q);
    });

    return (
        <div className="h-full overflow-y-auto" style={{ background: C.sidebar }}>
            {/* Panel header */}
            <div
                className="px-4 py-3 text-xs font-bold uppercase tracking-widest"
                style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}
            >
                Questions
            </div>

            {sections.length === 0 && (
                <div className="px-4 py-6 text-xs" style={{ color: C.muted }}>
                    Loading questions...
                </div>
            )}

            {sections.map(section => (
                <div key={section.type}>
                    {/* Section header */}
                    <div
                        className="px-4 pt-4 pb-1.5 text-xs font-bold tracking-widest"
                        style={{ color: C.sectionLabel }}
                    >
                        {section.label}
                    </div>

                    {section.items.map(q => {
                        const idx = questions.indexOf(q);
                        const isActive = idx === currentIndex;
                        const Icon = TYPE_ICONS[q.type] || Code;
                        const diff = (q as any).difficulty as string | undefined;

                        return (
                            <div
                                key={q.id}
                                onClick={() => setCurrentIndex(idx)}
                                className="relative flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/5"
                                style={{
                                    background: isActive ? C.activeRow : 'transparent',
                                    borderLeft: isActive ? `3px solid ${C.activeBorder}` : '3px solid transparent',
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                                    style={{ background: isActive ? '#262626' : '#171717' }}
                                >
                                    <Icon size={12} style={{ color: isActive ? '#FFFFFF' : C.muted }} />
                                </div>

                                {/* Label */}
                                <div className="min-w-0 flex-1">
                                    <div
                                        className="text-xs font-medium truncate leading-snug"
                                        style={{ color: isActive ? '#e5e5e5' : '#aaa' }}
                                    >
                                        {q.type === 'mcq'
                                            ? `Question ${idx + 1}`
                                            : (q.question?.split('\n')[0]?.substring(0, 28) || `Question ${idx + 1}`)}
                                    </div>
                                    {diff && (
                                        <div
                                            className="text-[10px] mt-0.5 font-medium"
                                            style={{ color: DIFF_COLOR[diff] || C.muted }}
                                        >
                                            {diff}
                                        </div>
                                    )}
                                    {!diff && (
                                        <div className="text-[10px] mt-0.5" style={{ color: C.sectionLabel }}>
                                            {SECTION_LABEL[q.type] || q.type.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

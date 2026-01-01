import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Question {
    id: number;
    code: string;
    text_ru: string;
    type: 'scale' | 'choice';
    module: string;
    category?: string;
}

interface AssessmentState {
    sessionId: number | null;
    responses: Record<number, number>; // questionId -> value
    currentIndex: number;
    isFinished: boolean;

    setSessionId: (id: number) => void;
    setAnswer: (questionId: number, value: number) => void;
    nextQuestion: (totalQuestions: number) => void;
    prevQuestion: () => void;
    reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            responses: {},
            currentIndex: 0,
            isFinished: false,

            setSessionId: (id: number) => set({ sessionId: id }),

            setAnswer: (questionId, value) => {
                set((state) => ({
                    responses: { ...state.responses, [questionId]: value }
                }));
            },

            nextQuestion: (totalQuestions) => {
                const { currentIndex } = get();
                // Ensure we don't go out of bounds
                if (currentIndex < totalQuestions - 1) {
                    set({ currentIndex: currentIndex + 1 });
                } else {
                    set({ isFinished: true });
                }
            },

            prevQuestion: () => set((state) => ({
                currentIndex: Math.max(state.currentIndex - 1, 0)
            })),

            reset: () => set({
                responses: {},
                currentIndex: 0,
                isFinished: false,
                sessionId: null
            })
        }),
        {
            name: 'assessment-storage',
            storage: createJSONStorage(() => localStorage),
            version: 3, // Bump version to clear potential old stale state structure
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as AssessmentState;
                if (version < 3) {
                    return {
                        sessionId: null,
                        responses: {},
                        currentIndex: 0,
                        isFinished: false
                    } as AssessmentState;
                }
                return state;
            },
        }
    )
);

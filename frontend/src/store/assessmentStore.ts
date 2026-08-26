import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface QuestionOption {
    /** Weights stay on the server: they are the answer key. */
    text: string;
}

export type AssessmentModule = 'RIASEC' | 'BIG5' | 'COGNITIVE' | 'SJT';

const DEFAULT_MODULES: AssessmentModule[] = ['RIASEC', 'BIG5', 'COGNITIVE', 'SJT'];

export interface Question {
    id: number;
    code: string;
    text_ru: string;
    text_kz?: string;
    text_en?: string;
    type: 'scale' | 'choice';
    module: string;
    category?: string;
    options?: QuestionOption[];
}

interface AssessmentState {
    sessionId: number | null;
    responses: Record<number, number>; // questionId -> value
    currentIndex: number;
    isFinished: boolean;
    results: any | null; // Added results to state
    selectedModules: AssessmentModule[];
    startModule: AssessmentModule;

    setSessionId: (id: number) => void;
    setAnswer: (questionId: number, value: number) => void;
    nextQuestion: (totalQuestions: number) => void;
    prevQuestion: () => void;
    setSelectedModules: (modules: AssessmentModule[]) => void;
    setStartModule: (module: AssessmentModule) => void;
    finishAssessment: () => void;
    resetAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            responses: {},
            currentIndex: 0,
            isFinished: false,
            results: null,
            selectedModules: DEFAULT_MODULES,
            startModule: 'RIASEC',

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

            setSelectedModules: (modules) => set({ selectedModules: modules }),
            setStartModule: (module) => set({ startModule: module }),
            finishAssessment: () => set({ isFinished: true }),

            resetAssessment: () => set({
                sessionId: null,
                responses: {},
                currentIndex: 0,
                isFinished: false,
                results: null
            })
        }),
        {
            name: 'assessment-storage',
            storage: createJSONStorage(() => localStorage),
            version: 4, // Bump version to add module selection fields
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as Partial<AssessmentState> | undefined;
                if (version < 4) {
                    return {
                        sessionId: null,
                        responses: {},
                        currentIndex: 0,
                        isFinished: false,
                        results: null,
                        selectedModules: state?.selectedModules ?? DEFAULT_MODULES,
                        startModule: state?.startModule ?? 'RIASEC',
                    } as AssessmentState;
                }
                return state as AssessmentState;
            },
        }
    )
);

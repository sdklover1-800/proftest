import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { assessmentApi } from '../api/assessmentApi';

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
    questions: Question[];
    responses: Record<number, number>; // questionId -> value
    currentIndex: number;
    isLoading: boolean;
    isFinished: boolean;

    initSession: () => Promise<void>;
    startAssessment: () => Promise<number>;
    fetchQuestions: () => Promise<void>;
    setAnswer: (questionId: number, value: number) => Promise<void>;
    nextQuestion: () => void;
    prevQuestion: () => void;
    reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
    persist(
        (set, get) => ({
            sessionId: null,
            questions: [],
            responses: {},
            currentIndex: 0,
            isLoading: false,
            isFinished: false,

            initSession: async () => {
                set({ isLoading: true });
                try {
                    const session = await assessmentApi.startSession();
                    set({ sessionId: session.id });
                } catch (error) {
                    console.error("Failed to start session", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            startAssessment: async () => {
                set({ isLoading: true });
                try {
                    const session = await assessmentApi.startSession();
                    set({
                        sessionId: session.id,
                        currentIndex: 0,
                        responses: {},
                        isFinished: false
                    });
                    return session.id;
                } catch (error) {
                    console.error("Failed to start assessment", error);
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchQuestions: async () => {
                set({ isLoading: true });
                console.log('Fetching questions from API...');
                try {
                    const questions = await assessmentApi.getQuestions();
                    console.log('API Response Questions:', questions);
                    set({ questions });
                } catch (error) {
                    console.error("Failed to fetch questions", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            setAnswer: async (questionId, value) => {
                const { sessionId } = get();
                // Optimistic update
                set((state) => ({
                    responses: { ...state.responses, [questionId]: value }
                }));

                if (sessionId) {
                    try {
                        await assessmentApi.submitAnswer(sessionId, questionId, value);
                    } catch (error) {
                        console.error("Failed to submit answer", error);
                    }
                }
            },

            nextQuestion: () => {
                const { currentIndex, questions } = get();
                if (currentIndex < questions.length - 1) {
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
            version: 2, // Bump to 2 to force clear questions
            migrate: (persistedState: any, version: number) => {
                // If version is old, we want to clear questions so they are re-fetched
                if (version < 2) {
                    return {
                        ...persistedState,
                        questions: [], // FORCE CLEAR QUESTIONS
                        isLoading: false
                    };
                }
                return persistedState;
            },
            // partialization: (state) => ({ ... }), // Optional: if we want to pick what to persist
        }
    )
);

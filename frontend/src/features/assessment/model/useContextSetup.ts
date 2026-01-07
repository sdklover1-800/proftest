/**
 * Custom hook for ContextSetupPage logic.
 * Follows View/Logic separation pattern - contains all state and handlers.
 */

import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useStartSession } from '../api/queries';
import { useAssessmentStore } from '@/store/assessmentStore';
import type { ContextData } from '@/api/assessmentApi';

export type StressLevel = 'low' | 'medium' | 'high';
export type MoodLevel = 'sad' | 'neutral' | 'happy';

interface MoodOption {
    value: MoodLevel;
    emoji: string;
    label: string;
}

interface StressOption {
    value: StressLevel;
    label: string;
}

interface UseContextSetupReturn {
    // State
    sleep: number;
    stress: StressLevel;
    mood: MoodLevel;
    isLoading: boolean;

    // Handlers
    setSleep: (value: number) => void;
    setStress: (value: StressLevel) => void;
    setMood: (value: MoodLevel) => void;
    handleStartTest: () => void;

    // Options for rendering
    moodEmojis: readonly MoodOption[];
    stressLevels: readonly StressOption[];
}

/**
 * Hook containing all logic for the Context Setup page.
 * The component only needs to render UI using values from this hook.
 */
export const useContextSetup = (): UseContextSetupReturn => {
    const { t } = useTranslation();
    const history = useHistory();
    const setSessionId = useAssessmentStore((state) => state.setSessionId);
    const resetAssessment = useAssessmentStore((state) => state.resetAssessment);

    // Local state for context questions
    const [sleep, setSleep] = useState<number>(7);
    const [stress, setStress] = useState<StressLevel>('medium');
    const [mood, setMood] = useState<MoodLevel>('neutral');

    const startSessionMutation = useStartSession();

    const handleStartTest = () => {
        // Reset any previous session data
        resetAssessment();

        const contextData: ContextData = {
            sleep,
            stress,
            mood,
        };

        startSessionMutation.mutate(contextData, {
            onSuccess: (data) => {
                setSessionId(data.id);
                history.push('/assessment');
            },
            onError: (error) => {
                console.error('Failed to start assessment:', error);
            },
        });
    };

    // Localized options for rendering
    const moodEmojis: readonly MoodOption[] = [
        { value: 'sad', emoji: '😔', label: t('context.mood_sad') },
        { value: 'neutral', emoji: '😐', label: t('context.mood_neutral') },
        { value: 'happy', emoji: '😊', label: t('context.mood_happy') },
    ];

    const stressLevels: readonly StressOption[] = [
        { value: 'low', label: t('context.stress_low') },
        { value: 'medium', label: t('context.stress_medium') },
        { value: 'high', label: t('context.stress_high') },
    ];

    return {
        sleep,
        stress,
        mood,
        isLoading: startSessionMutation.isPending,
        setSleep,
        setStress,
        setMood,
        handleStartTest,
        moodEmojis,
        stressLevels,
    };
};

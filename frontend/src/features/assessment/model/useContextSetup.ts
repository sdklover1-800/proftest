/**
 * Custom hook for ContextSetupPage logic.
 * Follows View/Logic separation pattern - contains all state and handlers.
 */

import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useStartSession } from '../api/queries';
import { useAssessmentStore } from '@/store/assessmentStore';
import type { AssessmentModule } from '@/store/assessmentStore';
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
    age: number;
    isLoading: boolean;
    testMode: 'full' | 'single';
    startModule: AssessmentModule;
    singleModule: AssessmentModule;

    // Handlers
    setSleep: (value: number) => void;
    setStress: (value: StressLevel) => void;
    setMood: (value: MoodLevel) => void;
    setAge: (value: number) => void;
    setTestMode: (mode: 'full' | 'single') => void;
    setStartModule: (module: AssessmentModule) => void;
    setSingleModule: (module: AssessmentModule) => void;
    handleStartTest: () => void;

    // Options for rendering
    moodEmojis: readonly MoodOption[];
    stressLevels: readonly StressOption[];
    moduleOptions: readonly { value: AssessmentModule; label: string }[];
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
    const selectedModules = useAssessmentStore((state) => state.selectedModules);
    const startModuleStore = useAssessmentStore((state) => state.startModule);
    const setSelectedModules = useAssessmentStore((state) => state.setSelectedModules);
    const setStartModuleStore = useAssessmentStore((state) => state.setStartModule);

    // Local state for context questions
    const [sleep, setSleep] = useState<number>(7);
    const [stress, setStress] = useState<StressLevel>('medium');
    const [mood, setMood] = useState<MoodLevel>('neutral');
    const [age, setAge] = useState<number>(18);
    const [testMode, setTestMode] = useState<'full' | 'single'>(
        selectedModules.length === 1 ? 'single' : 'full'
    );
    const [startModule, setStartModule] = useState<AssessmentModule>(
        startModuleStore || 'RIASEC'
    );
    const [singleModule, setSingleModule] = useState<AssessmentModule>(
        selectedModules[0] || 'RIASEC'
    );

    const startSessionMutation = useStartSession();

    const handleStartTest = () => {
        // Reset any previous session data
        resetAssessment();

        const allModules: AssessmentModule[] = ['RIASEC', 'BIG5', 'COGNITIVE', 'SJT'];
        const modulesToUse = testMode === 'single' ? [singleModule] : allModules;
        const startModuleToUse = testMode === 'single' ? singleModule : startModule;

        setSelectedModules(modulesToUse);
        setStartModuleStore(startModuleToUse);

        const contextData: ContextData = {
            sleep,
            stress,
            mood,
            age,
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

    const moduleOptions: readonly { value: AssessmentModule; label: string }[] = [
        { value: 'RIASEC', label: t('assessment.module_names.riasec') },
        { value: 'BIG5', label: t('assessment.module_names.big5') },
        { value: 'COGNITIVE', label: t('assessment.module_names.cognitive') },
        { value: 'SJT', label: t('assessment.module_names.sjt') },
    ];

    return {
        sleep,
        stress,
        mood,
        age,
        isLoading: startSessionMutation.isPending,
        testMode,
        startModule,
        singleModule,
        setSleep,
        setStress,
        setMood,
        setAge,
        setTestMode,
        setStartModule,
        setSingleModule,
        handleStartTest,
        moodEmojis,
        stressLevels,
        moduleOptions,
    };
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonPage,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonRange,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonIcon,
} from '@ionic/react';
import { moonOutline, happyOutline, flashOutline } from 'ionicons/icons';

import { useContextSetup } from '../model/useContextSetup';

/**
 * Pre-assessment context setup page.
 * Captures user state (Sleep, Mood, Stress) before starting the test.
 *
 * This component follows the View/Logic separation pattern:
 * - All state and handlers are in useContextSetup hook
 * - This file contains ONLY the JSX (UI)
 */
const ContextSetupPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        sleep,
        stress,
        mood,
        age,
        isLoading,
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
    } = useContextSetup();

    const activeModule = testMode === 'single' ? singleModule : startModule;

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>{t('context.title')}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto space-y-8 pb-8">
                    {/* Header */}
                    <div className="text-center pt-4">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {t('context.header')}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {t('context.subtitle')}
                        </p>
                    </div>

                    {/* Sleep Question */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <IonIcon icon={moonOutline} aria-hidden="true" className="text-indigo-600 text-xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    {t('context.sleep_question')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('context.sleep_hint')}
                                </p>
                            </div>
                        </div>
                        <IonRange
                            min={0}
                            max={12}
                            step={1}
                            snaps={true}
                            pin={true}
                            value={sleep}
                            onIonChange={(e) => setSleep(e.detail.value as number)}
                            className="mt-2"
                        >
                            <IonLabel slot="start">0{t('context.hours_short', 'h')}</IonLabel>
                            <IonLabel slot="end">12{t('context.hours_short', 'h')}</IonLabel>
                        </IonRange>
                        <div className="text-center text-2xl font-bold text-indigo-600 mt-2">
                            {sleep} {t('context.hours')}
                        </div>
                    </div>

                    {/* Stress Question */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <IonIcon icon={flashOutline} aria-hidden="true" className="text-orange-600 text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800">
                                {t('context.stress_question')}
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            {stressLevels.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => setStress(level.value)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${stress === level.value
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood Question */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <IonIcon icon={happyOutline} aria-hidden="true" className="text-green-600 text-xl" />
                            </div>
                            <h3 className="font-semibold text-gray-800">
                                {t('context.mood_question')}
                            </h3>
                        </div>
                        <div className="flex justify-center gap-4">
                            {moodEmojis.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setMood(m.value)}
                                    className={`flex flex-col items-center p-4 rounded-2xl transition-all ${mood === m.value
                                        ? 'bg-green-100 ring-2 ring-green-500 scale-110'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-4xl mb-1">{m.emoji}</span>
                                    <span className="text-xs text-gray-600">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age Question */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 text-lg font-bold">A</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    {t('context.age_question')}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {t('context.age_hint')}
                                </p>
                            </div>
                        </div>
                        <IonRange
                            min={1}
                            max={99}
                            step={1}
                            snaps={true}
                            pin={true}
                            value={age}
                            onIonChange={(e) => setAge(e.detail.value as number)}
                            className="mt-2"
                        >
                            <IonLabel slot="start">1</IonLabel>
                            <IonLabel slot="end">99</IonLabel>
                        </IonRange>
                        <div className="text-center text-2xl font-bold text-purple-600 mt-2">
                            {age} {t('context.years')}
                        </div>
                    </div>

                    {/* Test Mode */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 text-lg font-bold">T</span>
                            </div>
                            <h3 className="font-semibold text-gray-800">
                                {t('context.test_mode_title')}
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTestMode('full')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${testMode === 'full'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {t('context.test_mode_full')}
                            </button>
                            <button
                                onClick={() => setTestMode('single')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${testMode === 'single'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {t('context.test_mode_single')}
                            </button>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">
                                {testMode === 'single'
                                    ? t('context.choose_module')
                                    : t('context.start_from')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {moduleOptions.map((module) => (
                                    <button
                                        key={module.value}
                                        onClick={() => {
                                            if (testMode === 'single') {
                                                setSingleModule(module.value);
                                            } else {
                                                setStartModule(module.value);
                                            }
                                        }}
                                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeModule === module.value
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {module.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <IonButton
                        expand="block"
                        shape="round"
                        size="large"
                        onClick={handleStartTest}
                        disabled={isLoading}
                        className="h-14 font-bold text-lg"
                    >
                        {isLoading ? t('common.loading') : t('context.start_test')}
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ContextSetupPage;

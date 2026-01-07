import React from 'react';
import { Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IonPage, IonContent } from '@ionic/react';
import AssessmentLayout from './AssessmentLayout';
import QuestionCard from './QuestionCard';
import { useAssessment } from '../model/useAssessment';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';

/**
 * Assessment page - ultra-thin wrapper.
 * All logic is in useAssessment hook, this only renders.
 */
const AssessmentPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        isLoading,
        isFinished,
        currentQuestion,
        currentIndex,
        totalQuestions,
        responses,
        progress,
        handleSelect,
        retry
    } = useAssessment();

    const handleClose = () => {
        if (window.confirm(t('assessment.exit_confirm'))) {
            window.location.href = '/home';
        }
    };

    if (isLoading) {
        return (
            <AssessmentLayout>
                <div className="flex items-center justify-center h-full">
                    {/* Keep content centered, overlay will handle the spinner */}
                    <LoadingOverlay isOpen={isLoading} />
                </div>
            </AssessmentLayout>
        );
    }

    if (isFinished) {
        return <Redirect to="/results" />;
    }

    if (!currentQuestion) {
        return (
            <AssessmentLayout>
                <div className="p-8 text-center mt-20">
                    <p className="text-gray-500">{t('assessment.no_questions')}</p>
                    <button onClick={retry} className="mt-4 text-blue-600 font-semibold">
                        {t('assessment.retry')}
                    </button>
                </div>
            </AssessmentLayout>
        );
    }

    return (
        <IonPage className="bg-gray-50">
            {/* Custom Header with Thick Progress Bar */}
            <div className="bg-white shadow-sm z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="text-sm font-semibold text-gray-500">
                        {t('assessment.question_count', { current: currentIndex + 1, total: totalQuestions })}
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600">
                        {/* Close Icon SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Thick Progress Bar */}
                <div className="w-full h-3 bg-gray-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            </div>

            <IonContent className="bg-gray-50">
                {/* Mobile Container - Vertically Centered */}
                <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto px-4 pb-12">
                    <QuestionCard
                        question={currentQuestion}
                        selectedValue={responses[currentQuestion.id]}
                        onSelect={handleSelect}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AssessmentPage;

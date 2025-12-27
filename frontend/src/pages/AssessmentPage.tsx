import React from 'react';
import { Redirect } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import AssessmentLayout from '../components/AssessmentLayout';
import QuestionCard from '../components/QuestionCard';
import { useAssessmentPage } from '../hooks/useAssessmentPage';

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
    } = useAssessmentPage();

    if (isLoading) {
        return (
            <AssessmentLayout>
                <div className="flex items-center justify-center h-full">
                    <IonSpinner name="crescent" color="primary" />
                </div>
            </AssessmentLayout>
        );
    }

    if (isFinished) {
        // Redirect to results page
        return <Redirect to="/results" />;
    }

    if (!currentQuestion) {
        return (
            <AssessmentLayout>
                <div className="p-8 text-center mt-20">
                    <p className="text-gray-500">{t('assessment.no_questions')}</p>
                    <button onClick={() => retry()} className="mt-4 text-blue-600 font-semibold">{t('assessment.retry')}</button>
                </div>
            </AssessmentLayout>
        )
    }

    return (
        <AssessmentLayout
            title={t('assessment.question_count', { current: currentIndex + 1, total: totalQuestions })}
            progress={progress}
        >
            <QuestionCard
                question={currentQuestion}
                selectedValue={responses[currentQuestion.id]}
                onSelect={handleSelect}
            />
        </AssessmentLayout>
    );
};

export default AssessmentPage;

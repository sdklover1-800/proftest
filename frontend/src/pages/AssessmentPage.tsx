import React from 'react';
import { Redirect } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import AssessmentLayout from '../components/AssessmentLayout';
import QuestionCard from '../components/QuestionCard';
import { useAssessmentPage } from '../hooks/useAssessmentPage';

const AssessmentPage: React.FC = () => {
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
                    <p className="text-gray-500">No questions loaded.</p>
                    <button onClick={() => retry()} className="mt-4 text-blue-600 font-semibold">Retry</button>
                </div>
            </AssessmentLayout>
        )
    }

    return (
        <AssessmentLayout title={`Question ${currentIndex + 1} of ${totalQuestions}`} progress={progress}>
            <QuestionCard
                question={currentQuestion}
                selectedValue={responses[currentQuestion.id]}
                onSelect={handleSelect}
            />
        </AssessmentLayout>
    );
};

export default AssessmentPage;

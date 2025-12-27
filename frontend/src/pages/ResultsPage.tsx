import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSpinner, IonButton } from '@ionic/react';
import { useAssessmentStore } from '../store/assessmentStore';
import { useResults } from '../hooks/useResults';
import PsychometricRadar from '../components/charts/PsychometricRadar';
import RecommendationList from '../components/results/RecommendationList';

const ResultsPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const storeSessionId = useAssessmentStore((state) => state.sessionId);
    const reset = useAssessmentStore((state) => state.reset);

    // Get session ID from multiple sources:
    // 1. URL query params (e.g., /results?session=123)
    // 2. LocalStorage (viewSessionId set from Home page)
    // 3. Assessment store (current active session)
    const getSessionId = (): number | null => {
        // Check URL params first
        const params = new URLSearchParams(location.search);
        const urlSessionId = params.get('session');
        if (urlSessionId) {
            return parseInt(urlSessionId, 10);
        }

        // Check localStorage for viewSessionId (set when clicking history item)
        const viewSessionId = localStorage.getItem('viewSessionId');
        if (viewSessionId) {
            localStorage.removeItem('viewSessionId'); // Clean up after reading
            return parseInt(viewSessionId, 10);
        }

        // Fallback to store
        return storeSessionId;
    };

    const [sessionId] = useState<number | null>(getSessionId);
    const { results, recommendations, loading, error } = useResults(sessionId);
    const [activeTab, setActiveTab] = useState<'RIASEC' | 'BIG5'>('RIASEC');

    const handleHome = () => {
        reset();
        history.push('/home');
    };

    if (loading) {
        return (
            <IonPage>
                <IonContent className="ion-padding flex items-center justify-center h-full">
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <IonSpinner name="crescent" />
                        <p className="text-gray-500">Calculating your profile...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (error || !results) {
        return (
            <IonPage>
                <IonContent className="ion-padding">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
                        <p className="text-gray-600 mb-6">{error || "No results found."}</p>
                        <IonButton onClick={handleHome}>Back to Home</IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Your Profile</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding bg-gray-50">
                <div className="max-w-md mx-auto space-y-6 pb-10">

                    {/* Tab Switcher */}
                    <div className="flex rounded-lg bg-gray-200 p-1">
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'RIASEC' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            onClick={() => setActiveTab('RIASEC')}
                        >
                            Interests (RIASEC)
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'BIG5' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600 hover:text-gray-800'
                                }`}
                            onClick={() => setActiveTab('BIG5')}
                        >
                            Personality (Big5)
                        </button>
                    </div>

                    {/* Chart Area */}
                    <div className="transition-all duration-300">
                        {activeTab === 'RIASEC' && (
                            <div className="space-y-4 animate-fade-in">
                                <PsychometricRadar
                                    data={results.RIASEC}
                                    title="Career Interests"
                                    color="#4F46E5" // Indigo-600
                                />
                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-2">Top Interests</h4>
                                    <ul className="space-y-2">
                                        {results.RIASEC
                                            .sort((a, b) => b.A - a.A)
                                            .slice(0, 3)
                                            .map((item) => (
                                                <li key={item.subject} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">{item.subject}</span>
                                                    <span className="font-medium text-indigo-600">{item.A}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'BIG5' && (
                            <div className="space-y-4 animate-fade-in">
                                <PsychometricRadar
                                    data={results.BIG5}
                                    title="Personality Traits"
                                    color="#10B981" // Emerald-500
                                />
                                <div className="bg-white p-4 rounded-xl shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-2">Trait Breakdown</h4>
                                    <ul className="space-y-2">
                                        {results.BIG5.map((item) => (
                                            <li key={item.subject} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.subject}</span>
                                                <span className="font-medium text-emerald-600">{item.A}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recommendations Section */}
                    {results && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                    <span>🚀</span> Development Plan
                                </h3>
                                <button
                                    onClick={() => alert("Save as PDF is coming soon!")}
                                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800 hover:underline"
                                >
                                    ⬇ Save as PDF
                                </button>
                            </div>

                            <RecommendationList recommendations={recommendations} />
                        </div>
                    )}

                    <div className="pt-6">
                        <IonButton expand="block" shape="round" onClick={handleHome} className="h-12 font-medium">
                            Back to Home
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ResultsPage;

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
} from '@ionic/react';
import { useAuthStore } from '../store/authStore';
import { useAssessmentStore } from '../store/assessmentStore';
import { client } from '../api/client';

interface AssessmentSession {
    id: number;
    status: string;
    start_time: string;
    raw_scores?: any;
}

const Home: React.FC = () => {
    const history = useHistory();
    const user = useAuthStore((state) => state.user);
    const { startAssessment } = useAssessmentStore();
    const [sessions, setSessions] = useState<AssessmentSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    const fetchHistory = async () => {
        try {
            const response = await client.get('/api/v1/assessment/history');
            setSessions(response.data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRefresh = async (event: CustomEvent) => {
        await fetchHistory();
        event.detail.complete();
    };

    const handleStartAssessment = async () => {
        setStarting(true);
        try {
            await startAssessment();
            history.push('/assessment');
        } catch (error) {
            console.error('Failed to start assessment:', error);
        } finally {
            setStarting(false);
        }
    };

    const getTopScore = (scores: any) => {
        if (!scores?.RIASEC) return 'N/A';
        const entries = Object.entries(scores.RIASEC) as [string, number][];
        const top = entries.sort((a, b) => b[1] - a[1])[0];
        return top ? top[0] : 'N/A';
    };

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const lastSession = completedSessions[0];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Youth Assessment</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent />
                </IonRefresher>

                <div className="max-w-2xl mx-auto space-y-6 pb-10">
                    {/* Greeting */}
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold text-gray-800">
                            Hello, {user?.email.split('@')[0] || 'User'}! 👋
                        </h1>
                        <p className="text-gray-500 mt-1">Ready to discover more about yourself?</p>
                    </div>

                    {/* Main Action Card */}
                    <IonCard className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600">
                        <IonCardContent className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Start New Assessment
                            </h2>
                            <p className="text-blue-100 mb-4">
                                Discover your personality traits and career interests
                            </p>
                            <IonButton
                                expand="block"
                                color="light"
                                onClick={handleStartAssessment}
                                disabled={starting}
                                className="font-semibold"
                            >
                                {starting ? (
                                    <>
                                        <IonSpinner name="crescent" className="mr-2" />
                                        Starting...
                                    </>
                                ) : (
                                    'Begin Now →'
                                )}
                            </IonButton>
                        </IonCardContent>
                    </IonCard>

                    {/* Quick Stats */}
                    {loading ? (
                        <IonCard>
                            <IonCardHeader>
                                <IonSkeletonText animated style={{ width: '60%' }} />
                            </IonCardHeader>
                            <IonCardContent>
                                <IonSkeletonText animated style={{ width: '80%' }} />
                            </IonCardContent>
                        </IonCard>
                    ) : lastSession ? (
                        <IonCard className="shadow-sm">
                            <IonCardHeader>
                                <IonCardTitle className="text-lg">Last Result</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 text-sm">Top RIASEC Type</p>
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {getTopScore(lastSession.raw_scores)}
                                        </p>
                                    </div>
                                    <IonButton
                                        fill="outline"
                                        onClick={() => {
                                            localStorage.setItem('viewSessionId', lastSession.id.toString());
                                            history.push('/results');
                                        }}
                                    >
                                        View Details
                                    </IonButton>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    ) : null}

                    {/* Recent Activities */}
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            Your Recent Results
                        </h3>

                        {loading ? (
                            <IonList>
                                {[1, 2, 3].map((i) => (
                                    <IonItem key={i}>
                                        <IonLabel>
                                            <IonSkeletonText animated style={{ width: '60%' }} />
                                            <IonSkeletonText animated style={{ width: '40%' }} />
                                        </IonLabel>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : completedSessions.length > 0 ? (
                            <IonList className="rounded-lg">
                                {completedSessions.slice(0, 5).map((session) => (
                                    <IonItem
                                        key={session.id}
                                        button
                                        onClick={() => {
                                            localStorage.setItem('viewSessionId', session.id.toString());
                                            history.push('/results');
                                        }}
                                        className="hover:bg-gray-50"
                                    >
                                        <IonLabel>
                                            <h3 className="font-medium text-gray-800">
                                                Assessment #{session.id}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(session.start_time).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </IonLabel>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                Completed
                                            </span>
                                        </div>
                                    </IonItem>
                                ))}
                            </IonList>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No assessments yet. Start your first one above!</p>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Home;

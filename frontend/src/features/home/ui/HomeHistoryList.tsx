import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { IonSkeletonText, IonIcon } from '@ionic/react';
import { chevronForwardOutline, timeOutline } from 'ionicons/icons';
import type { SessionSummary } from '../model/useHome';

interface Props {
    sessions: SessionSummary[];
    loading: boolean;
    onViewResults: (id: number) => void;
}

const HomeHistoryList: React.FC<Props> = ({ sessions, loading, onViewResults }) => {
    const { t } = useTranslation();

    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'd MMM, HH:mm', { locale: ru });
        } catch {
            return dateString;
        }
    };

    const getScoreFromResult = (result: string | null): number => {
        if (!result) return 0;
        const parts = result.split(' - ');
        return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    };

    const getMaxScore = () => 40; // Approx max for RIASEC

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <IonSkeletonText animated style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
                    </div>
                ))}
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                <p className="text-gray-500 text-lg">{t('home.no_history')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('home.no_history_hint')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sessions.map((session) => {
                const score = getScoreFromResult(session.top_result);
                const progress = Math.min((score / getMaxScore()) * 100, 100);

                return (
                    <div
                        key={session.id}
                        onClick={() => onViewResults(session.id)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                    {session.top_result || t('home.test_number', { id: session.id })}
                                </h3>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <IonIcon icon={timeOutline} className="mr-1" />
                                    {formatDate(session.date)}
                                </div>
                            </div>
                            <IonIcon icon={chevronForwardOutline} className="text-gray-300" />
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                style={{ width: `${session.top_result ? progress : 100}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HomeHistoryList;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonSkeletonText
} from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import type { SessionSummary } from '../model/useHome';

interface Props {
    sessions: SessionSummary[];
    loading: boolean;
    onViewResults: (id: number) => void;
}

/**
 * Dumb UI component for displaying session history.
 */
const HomeHistoryList: React.FC<Props> = ({ sessions, loading, onViewResults }) => {
    const { t } = useTranslation();

    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <IonList className="rounded-xl overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <IonItem key={i}>
                        <IonLabel>
                            <IonSkeletonText animated style={{ width: '60%' }} />
                            <IonSkeletonText animated style={{ width: '40%' }} />
                        </IonLabel>
                    </IonItem>
                ))}
            </IonList>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500 text-lg">{t('home.no_history')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('home.no_history_hint')}</p>
            </div>
        );
    }

    return (
        <IonList className="rounded-xl overflow-hidden shadow-sm">
            {sessions.map((session) => (
                <IonItem
                    key={session.id}
                    button
                    detail={false}
                    onClick={() => onViewResults(session.id)}
                    className="hover:bg-gray-50"
                >
                    <IonLabel>
                        <h2 className="font-medium text-gray-800">
                            {session.top_result || t('home.test_number', { id: session.id })}
                        </h2>
                        <p className="text-sm text-gray-500">{formatDate(session.date)}</p>
                    </IonLabel>
                    <IonBadge color="success" slot="end" className="mr-2">
                        {t('home.completed')}
                    </IonBadge>
                    <IonIcon icon={chevronForwardOutline} slot="end" className="text-gray-400" />
                </IonItem>
            ))}
        </IonList>
    );
};

export default HomeHistoryList;

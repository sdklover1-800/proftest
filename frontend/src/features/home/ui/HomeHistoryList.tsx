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

/** Approximate RIASEC ceiling, used only to scale the bar. */
const MAX_SCORE = 40;

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

    if (loading) {
        return (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4">
                        <IonSkeletonText animated style={{ width: '60%', height: '20px', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ width: '100%', height: '6px', borderRadius: '3px' }} />
                    </div>
                ))}
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                <p className="text-base text-foreground">{t('home.no_history')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('home.no_history_hint')}</p>
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => {
                const score = getScoreFromResult(session.top_result);
                const progress = Math.min((score / MAX_SCORE) * 100, 100);
                const title = session.top_result || t('home.test_number', { id: session.id });

                return (
                    // A button, not a clickable div: this is the only route to a
                    // past result, so it has to be reachable from the keyboard.
                    <button
                        key={session.id}
                        type="button"
                        onClick={() => onViewResults(session.id)}
                        className="min-h-11 w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-border-strong active:bg-muted"
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <IonIcon icon={timeOutline} aria-hidden="true" />
                                    {formatDate(session.date)}
                                </div>
                            </div>
                            <IonIcon
                                icon={chevronForwardOutline}
                                aria-hidden="true"
                                className="shrink-0 text-muted-foreground"
                            />
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-700"
                                style={{ width: `${session.top_result ? progress : 100}%` }}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default HomeHistoryList;

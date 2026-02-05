/**
 * Sessions monitoring tab component.
 */

import React, { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { refreshOutline, trashOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

import type { Session } from './types';

interface SessionsTabProps {
    sessions: Session[];
    onRefresh: () => void;
    onDelete: (sessionId: number) => void;
    onBulkDelete: (sessionIds: number[]) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ sessions, onRefresh, onDelete, onBulkDelete }) => {
    const { t, i18n } = useTranslation();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const allSelected = useMemo(
        () => sessions.length > 0 && selectedIds.length === sessions.length,
        [sessions.length, selectedIds.length]
    );

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sessions.map((s) => s.id));
        }
    };

    const toggleOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };
    
    const getLocale = () => {
        const lang = i18n.language;
        if (lang === 'kz') return 'kk-KZ';
        if (lang === 'en') return 'en-US';
        return 'ru-RU';
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📝 {t('admin.sessions.title')}</h2>
                <div className="flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                onBulkDelete(selectedIds);
                                setSelectedIds([]);
                            }}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 shadow-sm transition-all"
                        >
                            <IonIcon icon={trashOutline} className="w-5 h-5" />
                            <span>{t('admin.bulk_delete')} ({selectedIds.length})</span>
                        </button>
                    )}
                    <button type="button" onClick={onRefresh} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <IonIcon icon={refreshOutline} className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">#</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    {t('admin.sessions.user')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.sessions.status')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.sessions.date')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.sessions.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(session.id)}
                                            onChange={() => toggleOne(session.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{session.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {session.user_email || <span className="text-gray-400">User #{session.user_id}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {session.status === 'completed' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                ✅ {t('admin.sessions.completed')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                                                🔄 {t('admin.sessions.in_progress')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(session.start_time).toLocaleString(getLocale())}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            type="button"
                                            onClick={() => onDelete(session.id)}
                                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                            title={t('admin.sessions.delete')}
                                        >
                                            <IonIcon icon={trashOutline} className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

/**
 * Sessions monitoring tab component.
 */

import React from 'react';
import { IonIcon } from '@ionic/react';
import { refreshOutline, trashOutline } from 'ionicons/icons';

import type { Session } from './types';

interface SessionsTabProps {
    sessions: Session[];
    onRefresh: () => void;
    onDelete: (sessionId: number) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({ sessions, onRefresh, onDelete }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📝 Сессии</h2>
            <button type="button" onClick={onRefresh} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <IonIcon icon={refreshOutline} className="w-5 h-5" />
            </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
                <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                Пользователь
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Статус</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Дата</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sessions.map((session) => (
                            <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">#{session.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {session.user_email || <span className="text-gray-400">User #{session.user_id}</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {session.status === 'completed' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                            ✅ Завершён
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                                            🔄 В процессе
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(session.start_time).toLocaleString('ru-RU')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(session.id)}
                                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                        title="Удалить"
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

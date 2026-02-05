/**
 * Users management tab component.
 */

import React, { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { trashOutline, refreshOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

import type { User } from './types';

interface UsersTabProps {
    users: User[];
    onDelete: (userId: number, userEmail: string) => void;
    onBulkDelete: (userIds: number[]) => void;
    onRefresh: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, onDelete, onBulkDelete, onRefresh }) => {
    const { t, i18n } = useTranslation();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const selectableUsers = useMemo(() => users.filter((u) => !u.is_superuser), [users]);
    const allSelected = useMemo(
        () => selectableUsers.length > 0 && selectedIds.length === selectableUsers.length,
        [selectableUsers.length, selectedIds.length]
    );

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectableUsers.map((u) => u.id));
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
                <h2 className="text-2xl font-bold text-gray-900">👥 {t('admin.users.title')}</h2>
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
                    <button onClick={onRefresh} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.users.email')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.users.name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.users.role')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.users.date')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{t('admin.users.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            disabled={user.is_superuser}
                                            checked={selectedIds.includes(user.id)}
                                            onChange={() => toggleOne(user.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_name || '—'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_superuser ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20">
                                                {t('admin.users.admin_role')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                {t('admin.users.user_role')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString(getLocale())}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {!user.is_superuser && (
                                            <button
                                                onClick={() => onDelete(user.id, user.email)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title={t('admin.users.delete')}
                                            >
                                                <IonIcon icon={trashOutline} className="w-5 h-5" />
                                            </button>
                                        )}
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

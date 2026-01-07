/**
 * Dashboard tab component - displays stats overview.
 */

import React from 'react';
import type { DashboardStats } from './types';

interface DashboardTabProps {
    stats: DashboardStats | null;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ stats }) => (
    <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Обзор</h2>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
                color="blue"
                label="Пользователи"
                value={stats?.total_users || 0}
                icon="👥"
            />
            <StatCard
                color="purple"
                label="Всего сессий"
                value={stats?.total_sessions || 0}
                icon="📝"
            />
            <StatCard
                color="green"
                label="Завершено"
                value={stats?.completed_sessions || 0}
                icon="✅"
            />
            <StatCard
                color="yellow"
                label="Средний RIASEC"
                value={stats?.avg_score_riasec || 0}
                icon="⭐"
            />
        </div>
    </div>
);

// Stat card with premium styling
interface StatCardProps {
    color: 'blue' | 'purple' | 'green' | 'yellow';
    label: string;
    value: number | string;
    icon: string;
}

const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
};

const StatCard: React.FC<StatCardProps> = ({ color, label, value, icon }) => {
    const colors = colorMap[color];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                    <span className="text-2xl">{icon}</span>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
            </div>
        </div>
    );
};

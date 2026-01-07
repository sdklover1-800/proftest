/**
 * Analytics Dashboard Tab.
 * Visualizes user activity, conversion, and drop-off rates using Recharts.
 */

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import type { AnalyticsData } from './types';

interface AnalyticsTabProps {
    data: AnalyticsData | null;
}

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-gray-900' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>
            {value}
        </p>
    </div>
);

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ data }) => {
    if (!data) {
        return <div className="p-8 text-center text-gray-500">Загрузка аналитики...</div>;
    }

    const { daily_activity, conversion, drop_off } = data;

    const conversionData = [
        { name: 'Завершено', value: conversion.completed_sessions },
        { name: 'Не завершено', value: conversion.total_sessions - conversion.completed_sessions },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Аналитика</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Всего сессий" value={conversion.total_sessions} />
                <StatCard label="Завершено" value={conversion.completed_sessions} color="text-green-600" />
                <StatCard label="Конверсия" value={`${conversion.conversion_rate}%`} color="text-indigo-600" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Daily Activity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">Активность пользователей</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={daily_activity} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#6366f1"
                                    radius={[4, 4, 0, 0]}
                                    name="Сессии"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">Структура сессий</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={conversionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {conversionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Drop-off Chart - Full Width */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">Где пользователи уходят? (Drop-off)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drop_off} layout="vertical" barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" allowDecimals={false} hide />
                                <YAxis
                                    dataKey="range"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#F59E0B"
                                    radius={[0, 4, 4, 0]}
                                    name="Бросили сессий"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

import { toPercentNumber } from '@/shared/utils/percent';

interface DataPoint {
    id?: string;
    subject: string;
    A: number;
    fullMark?: number;
}

interface RadarChartPoint {
    key: string;
    subject: string;
    A: number;
    B?: number;
    fullMark: number;
}

interface Props {
    data: DataPoint[];
    benchmarkValues?: Record<string, number> | null;
    color?: string;
    title?: string;
    height?: number;
    fallbackText?: string;
}

/**
 * Reusable radar chart component for psychometric data visualization.
 */
const PsychometricRadar: React.FC<Props> = ({
    data,
    benchmarkValues,
    color = '#8884d8',
    title,
    height = 260,
    fallbackText,
}) => {
    const { t } = useTranslation();
    const normalizedData: RadarChartPoint[] = (data || [])
        .filter((item) => item && typeof item.subject === 'string')
        .map((item, index) => {
            const key = String(item.id ?? item.subject ?? index);
            const benchmarkRaw = benchmarkValues?.[key] ?? benchmarkValues?.[item.subject];
            return {
                key,
                subject: item.subject,
                A: toPercentNumber(item.A),
                B: benchmarkRaw === undefined ? undefined : toPercentNumber(benchmarkRaw),
                fullMark: 100,
            };
        });

    const hasAxes = normalizedData.length >= 3;
    const hasSignal = normalizedData.some((item) => item.A > 0 || (item.B ?? 0) > 0);

    if (!hasAxes || !hasSignal) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {title && <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{title}</h3>}
                <div
                    className="w-full rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-sm text-gray-500"
                    style={{ height }}
                >
                    {fallbackText || t('results.not_found', 'Not enough data for radar chart')}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            {title && <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{title}</h3>}
            <div className="w-full min-h-[260px]" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={normalizedData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={({ payload, x, y, textAnchor, stroke, radius }) => {
                                // Default truncation
                                const label = payload.value.substring(0, 4);
                                return (
                                    <g className="recharts-layer recharts-polar-angle-axis-tick">
                                        <text
                                            radius={radius}
                                            stroke={stroke}
                                            x={x}
                                            y={y}
                                            className="recharts-text recharts-polar-angle-axis-tick-value"
                                            textAnchor={textAnchor}
                                            fill="#374151"
                                            fontSize="11"
                                            fontWeight="600"
                                        >
                                            <tspan x={x} dy="0em">{label}.</tspan>
                                        </text>
                                    </g>
                                );
                            }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        {benchmarkValues && (
                            <Radar
                                name={t('common.target', 'Target')}
                                dataKey="B"
                                stroke="rgba(59,130,246,0.7)"
                                fill="rgba(59,130,246,0.12)"
                                fillOpacity={0.45}
                                strokeWidth={2}
                            />
                        )}
                        <Radar
                            name={t('common.score', 'Score')}
                            dataKey="A"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.6}
                            strokeWidth={3}
                        />
                        <Tooltip
                            formatter={(value: any) => [`${value}%`, t('common.score', 'Score')]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PsychometricRadar;

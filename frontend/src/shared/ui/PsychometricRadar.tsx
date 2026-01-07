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

interface DataPoint {
    subject: string;
    A: number;
    fullMark: number;
}

interface Props {
    data: DataPoint[];
    color?: string;
    title?: string;
}

/**
 * Reusable radar chart component for psychometric data visualization.
 */
const PsychometricRadar: React.FC<Props> = ({ data, color = '#8884d8', title }) => {
    // We can use translation for static texts like "Score"
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            {title && <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{title}</h3>}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
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

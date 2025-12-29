import React from 'react';
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
    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            {title && <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">{title}</h3>}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                        <Radar
                            name="Score"
                            dataKey="A"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.5}
                        />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PsychometricRadar;

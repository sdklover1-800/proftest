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

interface PsychometricRadarProps {
    data: DataPoint[];
    color?: string;
    title?: string;
}

const PsychometricRadar: React.FC<PsychometricRadarProps> = ({
    data,
    color = '#8884d8',
    title
}) => {
    return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-sm">
            {title && <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>}
            <ResponsiveContainer width="100%" height="100%">
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
    );
};

export default PsychometricRadar;

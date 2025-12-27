import React from 'react';
import type { Recommendation } from '../../types/assessment';

interface Props {
    recommendations: Recommendation[];
}

const RecommendationList: React.FC<Props> = ({ recommendations }) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500 italic">
                No specific recommendations found based on your profile yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {recommendations.map((rec, idx) => (
                <div
                    key={idx}
                    className="bg-white shadow-sm rounded-xl p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow duration-300 animate-slide-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className="flex flex-wrap gap-2 mb-2">
                        {rec.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {tag === 'Career' && <span className="mr-1">💼</span>}
                                {tag === 'Development' && <span className="mr-1">🧠</span>}
                                {tag === 'Well-being' && <span className="mr-1">🌱</span>}
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                        {rec.text}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default RecommendationList;

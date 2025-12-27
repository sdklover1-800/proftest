import React from 'react';
import { useTranslation } from 'react-i18next';
import PsychometricRadar from '../charts/PsychometricRadar';

interface Props {
    activeTab: 'RIASEC' | 'BIG5';
    results: {
        RIASEC: any[];
        BIG5: any[];
    };
}

const ResultCharts: React.FC<Props> = ({ activeTab, results }) => {
    const { t } = useTranslation();

    return (
        <div className="transition-all duration-300">
            {activeTab === 'RIASEC' && (
                <div className="space-y-4">
                    <PsychometricRadar
                        data={results.RIASEC}
                        title={t('results.career_interests')}
                        color="#4F46E5"
                    />
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-2">{t('results.top_interests')}</h4>
                        <ul className="space-y-2">
                            {[...results.RIASEC]
                                .sort((a, b) => b.A - a.A)
                                .slice(0, 3)
                                .map((item) => (
                                    <li key={item.subject} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.subject}</span>
                                        <span className="font-medium text-indigo-600">{item.A}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'BIG5' && (
                <div className="space-y-4">
                    <PsychometricRadar
                        data={results.BIG5}
                        title={t('results.personality_traits')}
                        color="#10B981"
                    />
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-2">{t('results.trait_breakdown')}</h4>
                        <ul className="space-y-2">
                            {results.BIG5.map((item) => (
                                <li key={item.subject} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.subject}</span>
                                    <span className="font-medium text-emerald-600">{item.A}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultCharts;

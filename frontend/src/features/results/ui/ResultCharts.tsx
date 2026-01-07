import React from 'react';
import { useTranslation } from 'react-i18next';
import PsychometricRadar from '@/shared/ui/PsychometricRadar';
import { getArchetype } from '@/utils/psychometrics';

interface ChartData {
    subject: string;
    A: number;
    fullMark: number;
}

interface Props {
    activeTab: 'RIASEC' | 'BIG5';
    results: {
        RIASEC: ChartData[];
        BIG5: ChartData[];
    };
}

/**
 * Dumb UI component for rendering result charts.
 */
const ResultCharts: React.FC<Props> = ({ activeTab, results }) => {
    const { t } = useTranslation();

    const renderHero = (type: 'RIASEC' | 'BIG5', data: ChartData[]) => {
        if (!data || data.length === 0) return null;

        const topTrait = [...data].sort((a, b) => b.A - a.A)[0];
        const archetype = getArchetype(type, topTrait.subject);

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 flex items-center gap-5 mb-6 relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-50 opacity-50 blur-2xl"></div>

                <div className="text-5xl border-r pr-6 border-indigo-50 filter drop-shadow-sm">
                    {archetype.emoji}
                </div>
                <div>
                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                        {t('results.your_archetype')}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {t(archetype.title)}
                    </h3>
                    <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                        {t(archetype.description)}
                    </p>
                </div>
            </div>
        );
    };

    // Pre-compute sorted RIASEC data for list
    const topInterests = [...results.RIASEC].sort((a, b) => b.A - a.A).slice(0, 3);

    return (
        <div className="transition-all duration-300 animate-fade-in">
            {activeTab === 'RIASEC' && (
                <div className="space-y-4">
                    {renderHero('RIASEC', results.RIASEC)}

                    <PsychometricRadar
                        data={results.RIASEC}
                        title={t('results.career_interests')}
                        color="#4F46E5"
                    />

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide opacity-80">{t('results.top_interests')}</h4>
                        <ul className="space-y-3">
                            {topInterests.map((item) => {
                                const arc = getArchetype('RIASEC', item.subject);
                                return (
                                    <li key={item.subject} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{arc.emoji}</span>
                                            <span className="font-medium text-gray-700">{t(arc.title)}</span>
                                        </div>
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{item.A}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'BIG5' && (
                <div className="space-y-4">
                    {renderHero('BIG5', results.BIG5)}

                    <PsychometricRadar
                        data={results.BIG5}
                        title={t('results.personality_traits')}
                        color="#10B981"
                    />

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide opacity-80">{t('results.trait_breakdown')}</h4>
                        <ul className="space-y-3">
                            {results.BIG5.map((item) => {
                                const arc = getArchetype('BIG5', item.subject);
                                return (
                                    <li key={item.subject} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{arc.emoji}</span>
                                            <span className="font-medium text-gray-700">{t(arc.title)}</span>
                                        </div>
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{item.A}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultCharts;

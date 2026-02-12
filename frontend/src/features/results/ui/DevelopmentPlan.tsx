import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonIcon,
} from '@ionic/react';
import {
    searchOutline,
    flashOutline,
    peopleOutline,
    rocketOutline,
} from 'ionicons/icons';
import type { AIInsights, AIWeeklyPlanItem } from '@/types/assessment';

interface Recommendation {
    text: string;
    tags: string[];
    week: number;
}

interface Props {
    recommendations: Recommendation[];
    aiInsights?: AIInsights | null;
}

interface WeekConfig {
    titleKey: string;
    icon: string;
    color: string;
}

const WEEK_CONFIG: Record<number, WeekConfig> = {
    1: { titleKey: 'results.week1_title', icon: searchOutline, color: 'primary' },
    2: { titleKey: 'results.week2_title', icon: flashOutline, color: 'warning' },
    3: { titleKey: 'results.week3_title', icon: peopleOutline, color: 'success' },
    4: { titleKey: 'results.week4_title', icon: rocketOutline, color: 'tertiary' },
};

/**
 * Development Plan component - displays recommendations grouped by week.
 * Uses Ionic Accordions for collapsible sections.
 */
const DevelopmentPlan: React.FC<Props> = ({ recommendations, aiInsights }) => {
    const { t } = useTranslation();

    // Group recommendations by week
    const groupedByWeek = recommendations.reduce((acc, rec) => {
        const week = rec.week || 1;
        if (!acc[week]) {
            acc[week] = [];
        }
        acc[week].push(rec);
        return acc;
    }, {} as Record<number, Recommendation[]>);

    // Get weeks that have recommendations
    const weeksWithData = Object.keys(groupedByWeek)
        .map(Number)
        .sort((a, b) => a - b);

    const aiWeeklyPlan = (aiInsights?.weekly_plan || []).filter((item) => item && item.tasks?.length);
    const aiPlanByWeek = aiWeeklyPlan.reduce((acc, item) => {
        acc[item.week] = item;
        return acc;
    }, {} as Record<number, AIWeeklyPlanItem>);
    const hasAiPlan = aiWeeklyPlan.length > 0;
    const hasPlan = weeksWithData.length > 0;

    return (
        <>
            {aiInsights && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-4">
                    <div className="text-xs font-semibold tracking-widest text-indigo-500 uppercase mb-2">
                        {t('results.ai_plan_title')}
                    </div>
                    {aiInsights.summary && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {aiInsights.summary}
                        </p>
                    )}
                    {(aiInsights.next_steps || []).length > 0 && (
                        <div className="mt-3 space-y-2">
                            {(aiInsights.next_steps || []).map((step, idx) => (
                                <div key={`ai-step-${idx}`} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {hasAiPlan ? (
                <IonAccordionGroup multiple={true} value={['ai-week-1']}>
                    {[1, 2, 3, 4].map((weekNum) => {
                        const weekPlan = aiPlanByWeek[weekNum];
                        const config = WEEK_CONFIG[weekNum];
                        if (!weekPlan) return null;

                        return (
                            <IonAccordion key={`ai-week-${weekNum}`} value={`ai-week-${weekNum}`}>
                                <IonItem slot="header" color="light">
                                    <IonIcon
                                        icon={config.icon}
                                        slot="start"
                                        color={config.color}
                                        className="text-xl"
                                    />
                                    <IonLabel className="font-semibold">
                                        {t(config.titleKey)}
                                        {weekPlan.goal && (
                                            <p className="text-xs text-gray-500">
                                                {t('results.ai_goal')}: {weekPlan.goal}
                                            </p>
                                        )}
                                    </IonLabel>
                                </IonItem>
                                <div className="ion-padding bg-gray-50" slot="content">
                                    <div className="space-y-3">
                                        {weekPlan.tasks.map((task, idx) => (
                                            <div
                                                key={`ai-task-${weekNum}-${idx}`}
                                                className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 space-y-2"
                                            >
                                                <div className="text-sm font-semibold text-gray-800">
                                                    {task.task}
                                                </div>
                                                {task.why && (
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-semibold text-gray-700">
                                                            {t('results.ai_why')}:
                                                        </span>{' '}
                                                        {task.why}
                                                    </div>
                                                )}
                                                {task.how && (
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-semibold text-gray-700">
                                                            {t('results.ai_how')}:
                                                        </span>{' '}
                                                        {task.how}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </IonAccordion>
                        );
                    })}
                </IonAccordionGroup>
            ) : hasPlan ? (
                <IonAccordionGroup multiple={true} value={['week-1']}>
                    {[1, 2, 3, 4].map((weekNum) => {
                        const weekRecs = groupedByWeek[weekNum] || [];
                        const config = WEEK_CONFIG[weekNum];

                        // Skip weeks with no recommendations
                        if (weekRecs.length === 0) return null;

                        return (
                            <IonAccordion key={weekNum} value={`week-${weekNum}`}>
                                <IonItem slot="header" color="light">
                                    <IonIcon
                                        icon={config.icon}
                                        slot="start"
                                        color={config.color}
                                        className="text-xl"
                                    />
                                    <IonLabel className="font-semibold">
                                        {t(config.titleKey)}
                                        <p className="text-xs text-gray-500">
                                            {weekRecs.length} {t('results.tasks')}
                                        </p>
                                    </IonLabel>
                                </IonItem>
                                <div className="ion-padding bg-gray-50" slot="content">
                                    <div className="space-y-3">
                                        {weekRecs.map((rec, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                                            >
                                                <IonCheckbox
                                                    className="mt-0.5"
                                                    mode="ios"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        {rec.text}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {rec.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-block px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </IonAccordion>
                        );
                    })}
                </IonAccordionGroup>
            ) : (
                <div className="text-center text-gray-500 py-4">
                    {t('results.no_recommendations')}
                </div>
            )}
        </>
    );
};

export default DevelopmentPlan;

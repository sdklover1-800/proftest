import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ProfileNorms, ScaleNorm } from '../model/useResultsPage';

interface Props {
    norms: ProfileNorms;
    /** Human labels per module scale, e.g. RIASEC.Realistic -> "Практические". */
    labelFor: (module: string, scale: string) => string;
}

const MODULE_ORDER = ['RIASEC', 'BIG5', 'COGNITIVE', 'SJT'];

const MODULE_LABEL_KEYS: Record<string, [string, string]> = {
    RIASEC: ['results.career_interests', 'Профессиональные интересы'],
    BIG5: ['results.personality_traits', 'Черты личности'],
    COGNITIVE: ['results.cognitive_title', 'Когнитивные навыки'],
    SJT: ['results.soft_skills_title', 'Гибкие навыки'],
};

/**
 * Every score, next to what everyone else scores.
 *
 * A bare percentage is not a result: "Realistic 66" only becomes "above
 * average" once you can see the median beside it. The grey marker is that
 * median, and the sign on the difference carries the same message as the
 * colour so the meaning survives for colourblind readers and in print.
 */
const ScoresAgainstNorm: React.FC<Props> = ({ norms, labelFor }) => {
    const { t } = useTranslation();

    const modules = MODULE_ORDER.filter((m) => norms[m] && Object.keys(norms[m]).length > 0);
    if (modules.length === 0) {
        return null;
    }

    // If any scale is still on starting values, say so once for the whole block.
    const anyProvisional = modules.some((m) =>
        Object.values(norms[m]).some((n) => n.source === 'provisional'),
    );

    const renderRow = (module: string, scale: string, norm: ScaleNorm) => {
        const delta = norm.raw - norm.median;
        const above = delta >= 0;

        return (
            <div key={`${module}-${scale}`} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,11rem)_1fr_auto]">
                <span className="text-sm text-foreground sm:truncate">{labelFor(module, scale)}</span>

                <div className="relative col-span-2 h-4 sm:col-span-1">
                    <div className="absolute inset-x-0 top-1.5 h-1 rounded-full bg-muted" />
                    <div
                        className="absolute left-0 top-1.5 h-1 rounded-full bg-foreground"
                        style={{ width: `${norm.raw}%` }}
                    />
                    {/* The comparison itself: where the middle of the group sits. */}
                    <div
                        className="absolute top-0 h-4 w-0.5 rounded-full bg-border-strong"
                        style={{ left: `${norm.median}%` }}
                        role="img"
                        aria-label={t('results.norm_median_aria', {
                            defaultValue: 'Медиана группы: {{median}}',
                            median: norm.median,
                        })}
                    />
                </div>

                <span className="flex items-baseline gap-1.5 justify-self-end tabular-nums">
                    <span className="text-sm font-semibold text-foreground">{norm.raw}</span>
                    <span
                        className={`text-xs font-medium ${above ? 'text-primary' : 'text-destructive'}`}
                    >
                        {above ? '+' : '−'}
                        {Math.abs(delta)}
                    </span>
                </span>
            </div>
        );
    };

    return (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">
                    {t('results.evidence_title', 'На чём это основано')}
                </h2>
                <p className="text-xs text-muted-foreground">
                    {t('results.norm_legend', 'штрих — медиана вашей группы')}
                </p>
            </div>

            <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                {modules.map((module) => {
                    const [key, fallback] = MODULE_LABEL_KEYS[module] ?? [module, module];
                    return (
                        <div key={module} className="space-y-3">
                            <h3 className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                                {t(key, fallback)}
                            </h3>
                            <div className="space-y-2.5">
                                {Object.entries(norms[module]).map(([scale, norm]) =>
                                    renderRow(module, scale, norm),
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {anyProvisional && (
                <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                    {t(
                        'results.norm_provisional',
                        'Сравнение идёт с предварительными нормами: они взяты как отправная точка, а не измерены на пользователях этого приложения.',
                    )}
                </p>
            )}
        </section>
    );
};

export default ScoresAgainstNorm;

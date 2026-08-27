import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CareerMatch } from '../model/useResultsPage';

interface Props {
    careers: CareerMatch[];
}

/**
 * The answer the person actually came for.
 *
 * Scores are what the instrument measured; this is what they point at, so it
 * leads the screen and the numbers move below it as supporting evidence.
 * Every card can say what it rests on — a match with no grounds is a guess
 * dressed up as a result.
 */
const CareerMatchList: React.FC<Props> = ({ careers }) => {
    const { t } = useTranslation();

    if (careers.length === 0) {
        return null;
    }

    return (
        <section className="space-y-4">
            <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
                    {t('results.careers_eyebrow', 'Куда это ведёт')}
                </p>
                <h2 className="max-w-2xl text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {t('results.careers_title', 'Работа, к которой ближе всего ваш профиль')}
                </h2>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                {careers.map((career) => (
                    <article
                        key={career.career_id}
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                                {career.title}
                            </h3>
                            <span className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
                                {career.match}%
                            </span>
                        </div>

                        <div
                            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                            role="img"
                            aria-label={t('results.career_match_aria', {
                                defaultValue: 'Совпадение {{match}} процентов',
                                match: career.match,
                            })}
                        >
                            <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${career.match}%` }}
                            />
                        </div>

                        <p className="text-sm leading-relaxed text-muted-foreground">{career.summary}</p>

                        {career.evidence.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                                {career.evidence.map((item) => (
                                    <li
                                        key={item.label}
                                        className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground"
                                    >
                                        {/* A scale can support a match by being low — say so, rather
                                            than showing a small number next to a strong match. */}
                                        {item.supports
                                            ? `${item.label} ${item.value}`
                                            : t('results.career_low_is_good', {
                                                  defaultValue: 'низкие: {{label}}',
                                                  label: item.label.toLowerCase(),
                                              })}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
};

export default CareerMatchList;

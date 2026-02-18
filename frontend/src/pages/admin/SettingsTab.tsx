import React from 'react';
import { useTranslation } from 'react-i18next';

import type {
    ModuleKey,
    QualityPrediction,
    TestConfig,
    TestModuleLimitMeta,
} from './types';

type ConfigField = keyof TestConfig;

interface Props {
    config: TestConfig | null;
    onFieldChange: (field: keyof TestConfig, value: number) => void;
    onSave: () => void;
    isSaving: boolean;
    limitsMeta?: Record<ModuleKey, TestModuleLimitMeta> | null;
    serverWarnings?: string[];
    estimatedTotalMinutes?: number | null;
    qualityPrediction?: QualityPrediction | null;
}

const MODULE_FIELD_ORDER: { module: ModuleKey; field: ConfigField; labelKey: string }[] = [
    { module: 'RIASEC', field: 'riasec_limit', labelKey: 'admin.settings.riasec_count' },
    { module: 'BIG5', field: 'big5_limit', labelKey: 'admin.settings.big5_count' },
    { module: 'SJT', field: 'sjt_limit', labelKey: 'admin.settings.sjt_count' },
    { module: 'COGNITIVE', field: 'cognitive_limit', labelKey: 'admin.settings.cognitive_count' },
];

const QUALITY_TEXT: Record<QualityPrediction, string> = {
    good: 'Good',
    acceptable: 'Acceptable',
    too_short: 'Too short',
    fatigue_risk: 'Fatigue risk',
};

const SettingsTab: React.FC<Props> = ({
    config,
    onFieldChange,
    onSave,
    isSaving,
    limitsMeta,
    serverWarnings = [],
    estimatedTotalMinutes,
    qualityPrediction,
}) => {
    const { t } = useTranslation();

    if (!config) {
        return (
            <div className="bg-white shadow rounded-xl p-6">
                <p className="text-gray-500">{t('admin.settings.loading')}</p>
            </div>
        );
    }

    const localWarnings = React.useMemo(() => {
        if (!limitsMeta) {
            return [];
        }

        const warnings: string[] = [];
        for (const row of MODULE_FIELD_ORDER) {
            const limits = limitsMeta[row.module];
            if (!limits) {
                continue;
            }

            const value = config[row.field];
            if (value < limits.recommended_min) {
                warnings.push(
                    `${row.module}: ${value} is below recommended ${limits.recommended_min}-${limits.recommended_max}.`
                );
            } else if (value > limits.recommended_max) {
                warnings.push(
                    `${row.module}: ${value} is above recommended ${limits.recommended_min}-${limits.recommended_max}.`
                );
            }
        }
        return warnings;
    }, [config, limitsMeta]);

    const mergedWarnings = React.useMemo(
        () => Array.from(new Set([...localWarnings, ...serverWarnings])),
        [localWarnings, serverWarnings]
    );

    const computedEstimatedMinutes = React.useMemo(() => {
        if (!limitsMeta) {
            return estimatedTotalMinutes ?? null;
        }
        const totalSeconds = MODULE_FIELD_ORDER.reduce((acc, row) => {
            const limits = limitsMeta[row.module];
            if (!limits) {
                return acc;
            }
            return acc + config[row.field] * limits.avg_seconds_per_item;
        }, 0);
        return Math.max(Math.round(totalSeconds / 60), 1);
    }, [config, estimatedTotalMinutes, limitsMeta]);

    const computedQuality = React.useMemo<QualityPrediction>(() => {
        if (!limitsMeta) {
            return qualityPrediction ?? 'acceptable';
        }

        let hasTooShort = false;
        let hasFatigueRisk = false;
        let hasOutsideRecommended = false;

        for (const row of MODULE_FIELD_ORDER) {
            const limits = limitsMeta[row.module];
            if (!limits) {
                continue;
            }
            const value = config[row.field];
            if (value < Math.round(limits.recommended_min * 0.7)) {
                hasTooShort = true;
            }
            if (value > Math.round(limits.recommended_max * 1.3)) {
                hasFatigueRisk = true;
            }
            if (value < limits.recommended_min || value > limits.recommended_max) {
                hasOutsideRecommended = true;
            }
        }

        if (hasTooShort) {
            return 'too_short';
        }
        if (hasFatigueRisk) {
            return 'fatigue_risk';
        }
        if (hasOutsideRecommended) {
            return 'acceptable';
        }
        return 'good';
    }, [config, limitsMeta, qualityPrediction]);

    return (
        <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('admin.settings.title')}</h2>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Estimated time</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {computedEstimatedMinutes ?? 0} min
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Quality prediction</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {QUALITY_TEXT[computedQuality]}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULE_FIELD_ORDER.map((row) => {
                    const limits = limitsMeta?.[row.module];
                    const value = config[row.field];
                    const isBelowRecommended = limits ? value < limits.recommended_min : false;
                    const isAboveRecommended = limits ? value > limits.recommended_max : false;

                    return (
                        <label key={row.field} className="text-sm text-gray-700">
                            {t(row.labelKey)}
                            <input
                                type="number"
                                min={limits?.hard_min ?? 0}
                                max={limits?.hard_max}
                                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                                value={value}
                                onChange={(e) => onFieldChange(row.field, Number(e.target.value))}
                            />
                            {limits ? (
                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                    <p>
                                        Recommended: {limits.recommended_min}-{limits.recommended_max}
                                        {' | '}Optimal: {limits.optimal_min}-{limits.optimal_max}
                                    </p>
                                    <p>
                                        Hard min: {limits.hard_min}
                                        {' | '}
                                        Hard max: {limits.hard_max}
                                        {' | '}~{Math.max(Math.round((value * limits.avg_seconds_per_item) / 60), 1)} min
                                    </p>
                                    {isBelowRecommended && (
                                        <p className="text-amber-600">
                                            Below recommended range. Confidence may drop.
                                        </p>
                                    )}
                                    {isAboveRecommended && (
                                        <p className="text-amber-600">
                                            Above recommended range. Fatigue risk increases.
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </label>
                    );
                })}
            </div>

            {mergedWarnings.length > 0 ? (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-semibold text-amber-900">Warnings</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 space-y-1">
                        {mergedWarnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <div className="mt-6">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                    {isSaving ? t('admin.settings.saving') : t('admin.settings.save')}
                </button>
            </div>
        </div>
    );
};

export default SettingsTab;

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TestConfig } from './types';

interface Props {
    config: TestConfig | null;
    onFieldChange: (field: keyof TestConfig, value: number) => void;
    onSave: () => void;
    isSaving: boolean;
}

const SettingsTab: React.FC<Props> = ({ config, onFieldChange, onSave, isSaving }) => {
    const { t } = useTranslation();

    if (!config) {
        return (
            <div className="bg-white shadow rounded-xl p-6">
                <p className="text-gray-500">{t('admin.settings.loading')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('admin.settings.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-700">
                    {t('admin.settings.riasec_count')}
                    <input
                        type="number"
                        min={0}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                        value={config.riasec_limit}
                        onChange={(e) => onFieldChange('riasec_limit', Number(e.target.value))}
                    />
                </label>
                <label className="text-sm text-gray-700">
                    {t('admin.settings.big5_count')}
                    <input
                        type="number"
                        min={0}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                        value={config.big5_limit}
                        onChange={(e) => onFieldChange('big5_limit', Number(e.target.value))}
                    />
                </label>
                <label className="text-sm text-gray-700">
                    {t('admin.settings.sjt_count')}
                    <input
                        type="number"
                        min={0}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                        value={config.sjt_limit}
                        onChange={(e) => onFieldChange('sjt_limit', Number(e.target.value))}
                    />
                </label>
                <label className="text-sm text-gray-700">
                    {t('admin.settings.cognitive_count')}
                    <input
                        type="number"
                        min={0}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2"
                        value={config.cognitive_limit}
                        onChange={(e) => onFieldChange('cognitive_limit', Number(e.target.value))}
                    />
                </label>
            </div>

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

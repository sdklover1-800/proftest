import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonSpinner
} from '@ionic/react';

interface Props {
    starting: boolean;
    onStart: () => void;
}

/**
 * Dumb UI component for the action card on home page.
 */
const HomeActionCard: React.FC<Props> = ({ starting, onStart }) => {
    const { t } = useTranslation();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 p-6">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {t('home.start_assessment')}
                </h2>
                <p className="text-blue-100 mb-6 text-sm leading-relaxed">
                    {t('home.start_description')}
                </p>

                <button
                    onClick={onStart}
                    disabled={starting}
                    className="w-full bg-white text-indigo-600 font-semibold py-3.5 px-6 rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    {starting ? (
                        <>
                            <IonSpinner name="crescent" className="w-5 h-5 text-indigo-600" />
                            <span>{t('common.loading')}</span>
                        </>
                    ) : (
                        t('home.begin_now')
                    )}
                </button>
            </div>
        </div>
    );
};

export default HomeActionCard;

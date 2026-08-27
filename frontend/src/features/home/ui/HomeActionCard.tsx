import React from 'react';
import { useTranslation } from 'react-i18next';
import { IonSpinner } from '@ionic/react';

interface Props {
    starting: boolean;
    onStart: () => void;
}

/**
 * The one thing to do next.
 *
 * A flat ink surface rather than the gradient it replaces: the gradient read as
 * decoration, and on the home screen the card is the primary action, so it
 * carries the darkest weight on the page and nothing else competes with it.
 */
const HomeActionCard: React.FC<Props> = ({ starting, onStart }) => {
    const { t } = useTranslation();

    return (
        <div className="rounded-2xl bg-foreground p-7 text-background sm:p-9">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-background/60">
                {t('home.start_eyebrow', 'Профориентация')}
            </p>

            <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-3xl">
                {t('home.start_assessment')}
            </h2>

            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-background/70">
                {t('home.start_description')}
            </p>

            <button
                type="button"
                onClick={onStart}
                disabled={starting}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-background px-6 text-[15px] font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:min-w-56"
            >
                {starting ? (
                    <>
                        <IonSpinner name="crescent" className="h-5 w-5" />
                        <span>{t('common.loading')}</span>
                    </>
                ) : (
                    t('home.begin_now')
                )}
            </button>
        </div>
    );
};

export default HomeActionCard;

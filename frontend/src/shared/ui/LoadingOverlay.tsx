import React from 'react';
import { IonLoading } from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    message?: string;
}

/**
 * Global loading overlay component.
 * Blocks user interaction and shows a spinner.
 */
const LoadingOverlay: React.FC<Props> = ({ isOpen, message }) => {
    const { t } = useTranslation();

    return (
        <IonLoading
            isOpen={isOpen}
            message={message || t('common.loading')}
            spinner="crescent"
            cssClass="custom-loading"
        />
    );
};

export default LoadingOverlay;

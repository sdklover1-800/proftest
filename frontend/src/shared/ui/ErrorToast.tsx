import React from 'react';
import { IonToast } from '@ionic/react';
import { warningOutline } from 'ionicons/icons';

interface Props {
    message: string | null;
    onDismiss: () => void;
    duration?: number;
}

/**
 * Reusable error toast component.
 * Displays error messages with consistent styling.
 */
const ErrorToast: React.FC<Props> = ({ message, onDismiss, duration = 3000 }) => {
    return (
        <IonToast
            isOpen={!!message}
            onDidDismiss={onDismiss}
            message={message || ''}
            duration={duration}
            color="danger"
            position="top"
            icon={warningOutline}
            buttons={[
                {
                    text: 'OK',
                    role: 'cancel',
                    handler: onDismiss
                }
            ]}
        />
    );
};

export default ErrorToast;

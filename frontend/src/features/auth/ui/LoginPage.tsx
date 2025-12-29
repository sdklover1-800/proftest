import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
} from '@ionic/react';
import { useLogin } from '../model/useLogin';
import ErrorToast from '@/shared/ui/ErrorToast';

/**
 * Login page - thin wrapper.
 */
const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleLogin,
        goToRegister,
        clearError
    } = useLogin();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{t('auth.login')}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto mt-8 space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.welcome_back_title')}</h1>
                        <p className="text-gray-500">{t('auth.login_subtitle')}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">{t('auth.email')}</IonLabel>
                            <IonInput
                                type="email"
                                value={email}
                                onIonChange={(e) => setEmail(e.detail.value!)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">{t('auth.password')}</IonLabel>
                            <IonInput
                                type="password"
                                value={password}
                                onIonChange={(e) => setPassword(e.detail.value!)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonButton
                            expand="block"
                            onClick={handleLogin}
                            disabled={isLoading || !email || !password}
                            className="mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <IonSpinner name="crescent" className="mr-2" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('auth.login')
                            )}
                        </IonButton>

                        <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                {t('auth.no_account')}{' '}
                                <button
                                    onClick={goToRegister}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    {t('auth.register_here')}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <ErrorToast
                    message={error}
                    onDismiss={clearError}
                />
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;

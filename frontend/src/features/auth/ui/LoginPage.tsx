import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
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
                        <IonInput
                            label={t('auth.email')}
                            labelPlacement="stacked"
                            fill="outline"
                            type="email"
                            value={email}
                            onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
                            autocomplete="email"
                            disabled={isLoading}
                        />

                        <IonInput
                            label={t('auth.password')}
                            labelPlacement="stacked"
                            fill="outline"
                            type="password"
                            value={password}
                            onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
                            autocomplete="current-password"
                            disabled={isLoading}
                        />

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

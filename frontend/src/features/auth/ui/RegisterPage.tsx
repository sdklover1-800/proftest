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
import { useRegister } from '../model/useRegister';
import ErrorToast from '@/shared/ui/ErrorToast';

/**
 * Register page - thin wrapper.
 */
const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        email,
        setEmail,
        password,
        setPassword,
        age,
        setAge,
        isLoading,
        error,
        handleRegister,
        goToLogin,
        clearError
    } = useRegister();

    const handleAgeInput = (raw: string | number | null | undefined): void => {
        const value = String(raw ?? '').trim();
        if (!value) {
            setAge(undefined);
            return;
        }

        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
            setAge(undefined);
            return;
        }

        const safeAge = Math.max(0, Math.min(parsed, 120));
        setAge(safeAge);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>{t('auth.register')}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto mt-8 space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.create_account')}</h1>
                        <p className="text-gray-500">{t('auth.register_subtitle')}</p>
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
                            autocomplete="new-password"
                            disabled={isLoading}
                        />

                        <IonInput
                            label={`${t('auth.age')} (${t('common.optional')})`}
                            labelPlacement="stacked"
                            fill="outline"
                            type="number"
                            min={0}
                            max={120}
                            inputmode="numeric"
                            value={age ?? ''}
                            onIonInput={(e) => handleAgeInput(e.detail.value)}
                            disabled={isLoading}
                        />

                        <IonButton
                            expand="block"
                            onClick={handleRegister}
                            disabled={isLoading || !email || !password}
                            className="mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <IonSpinner name="crescent" className="mr-2" />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('auth.register')
                            )}
                        </IonButton>

                        <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                {t('auth.have_account')}{' '}
                                <button
                                    onClick={goToLogin}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    {t('auth.login_here')}
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

export default RegisterPage;

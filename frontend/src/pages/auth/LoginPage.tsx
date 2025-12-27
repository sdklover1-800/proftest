import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
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
    IonToast,
    IonSpinner,
} from '@ionic/react';
import { useAuthStore } from '../../store/authStore';

const LoginPage: React.FC = () => {
    const history = useHistory();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showToast, setShowToast] = useState(false);

    const handleLogin = async () => {
        try {
            await login(email, password);
            history.push('/');
        } catch (err) {
            setShowToast(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Login</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto mt-8 space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
                        <p className="text-gray-500">Sign in to continue your assessment</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">Email</IonLabel>
                            <IonInput
                                type="email"
                                value={email}
                                onIonChange={(e) => setEmail(e.detail.value!)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">Password</IonLabel>
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
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </IonButton>

                        <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                Don't have an account?{' '}
                                <button
                                    onClick={() => history.push('/register')}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    Register here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => {
                        setShowToast(false);
                        clearError();
                    }}
                    message={error || 'Login failed'}
                    duration={3000}
                    color="danger"
                />
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;

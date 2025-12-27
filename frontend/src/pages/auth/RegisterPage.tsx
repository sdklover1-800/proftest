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

const RegisterPage: React.FC = () => {
    const history = useHistory();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number | undefined>(undefined);
    const [showToast, setShowToast] = useState(false);

    const handleRegister = async () => {
        try {
            await register(email, password, age);
            history.push('/');
        } catch (err) {
            setShowToast(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Register</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto mt-8 space-y-6">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                        <p className="text-gray-500">Join us to discover your potential</p>
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

                        <IonItem className="rounded-lg border border-gray-200">
                            <IonLabel position="floating">Age (Optional)</IonLabel>
                            <IonInput
                                type="number"
                                value={age}
                                onIonChange={(e) => setAge(e.detail.value ? parseInt(e.detail.value) : undefined)}
                                disabled={isLoading}
                            />
                        </IonItem>

                        <IonButton
                            expand="block"
                            onClick={handleRegister}
                            disabled={isLoading || !email || !password}
                            className="mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <IonSpinner name="crescent" className="mr-2" />
                                    Creating account...
                                </>
                            ) : (
                                'Register'
                            )}
                        </IonButton>

                        <div className="text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                Already have an account?{' '}
                                <button
                                    onClick={() => history.push('/login')}
                                    className="text-blue-600 font-medium hover:underline"
                                    disabled={isLoading}
                                >
                                    Login here
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
                    message={error || 'Registration failed'}
                    duration={3000}
                    color="danger"
                />
            </IonContent>
        </IonPage>
    );
};

export default RegisterPage;

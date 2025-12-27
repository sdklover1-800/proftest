import React from 'react';
import { useHistory } from 'react-router-dom';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
} from '@ionic/react';
import { useAuthStore } from '../store/authStore';

const ProfilePage: React.FC = () => {
    const history = useHistory();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        // Force redirect to login page
        window.location.href = '/login';
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Профиль</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="max-w-md mx-auto space-y-6 mt-6">
                    {/* User Info Card */}
                    <IonCard className="shadow-sm">
                        <IonCardHeader>
                            <IonCardTitle>Account Information</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            {!user ? (
                                <p className="text-gray-500 text-center py-4">Loading...</p>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium text-gray-800">{user.email}</p>
                                    </div>
                                    {user.age && (
                                        <div>
                                            <p className="text-sm text-gray-500">Age</p>
                                            <p className="font-medium text-gray-800">{user.age}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">User ID</p>
                                        <p className="font-medium text-gray-800">#{user.id}</p>
                                    </div>
                                </div>
                            )}
                        </IonCardContent>
                    </IonCard>

                    {/* Settings List */}
                    <IonCard className="shadow-sm">
                        <IonCardHeader>
                            <IonCardTitle>Settings</IonCardTitle>
                        </IonCardHeader>
                        <IonList>
                            <IonItem button detail>
                                <IonLabel>Notifications</IonLabel>
                            </IonItem>
                            <IonItem button detail>
                                <IonLabel>Privacy</IonLabel>
                            </IonItem>
                            <IonItem button detail>
                                <IonLabel>About</IonLabel>
                            </IonItem>
                        </IonList>
                    </IonCard>

                    {/* Logout Button */}
                    <IonButton
                        expand="block"
                        color="danger"
                        onClick={handleLogout}
                        className="mt-6"
                    >
                        Выйти
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;

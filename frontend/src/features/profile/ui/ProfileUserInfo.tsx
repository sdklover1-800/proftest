import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
} from '@ionic/react';

interface User {
    id: number;
    email: string;
    age?: number;
}

interface Props {
    user: User | null;
}

const ProfileUserInfo: React.FC<Props> = ({ user }) => {
    const { t } = useTranslation();

    return (
        <IonCard className="shadow-sm">
            <IonCardHeader>
                <IonCardTitle>{t('profile.user_info')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                {!user ? (
                    <p className="text-gray-500 text-center py-4">{t('common.loading')}</p>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">{t('auth.email')}</p>
                            <p className="font-medium text-gray-800">{user.email}</p>
                        </div>
                        {user.age && (
                            <div>
                                <p className="text-sm text-gray-500">{t('auth.age')}</p>
                                <p className="font-medium text-gray-800">{user.age}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500">{t('profile.user_id')}</p>
                            <p className="font-medium text-gray-800">#{user.id}</p>
                        </div>
                    </div>
                )}
            </IonCardContent>
        </IonCard>
    );
};

export default ProfileUserInfo;

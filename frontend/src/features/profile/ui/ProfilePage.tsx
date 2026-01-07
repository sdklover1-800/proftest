import React from 'react';
import {
    IonPage,
    IonContent,
} from '@ionic/react';
import { useProfile } from '../model/useProfile';
import ProfileSettings from './ProfileSettings';

/**
 * Profile page - thin wrapper.
 */
const ProfilePage: React.FC = () => {
    const { user, t, i18n, handleLogout, handleLanguageChange } = useProfile();

    // Generate initials
    const initials = user?.email
        ? user.email.substring(0, 2).toUpperCase()
        : '??';

    return (
        <IonPage className="bg-gray-50">
            <IonContent>
                <div className="p-6">
                    {/* Header Profile Section */}
                    <div className="flex flex-col items-center mt-8 mb-8">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 font-bold text-2xl mb-4 shadow-md border-4 border-white">
                            {initials}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user?.email.split('@')[0]}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Тесты</div>
                            <div className="text-lg font-bold text-gray-900 mt-1">15</div>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Топ</div>
                            <div className="text-lg font-bold text-indigo-600 mt-1">Real</div>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Уровень</div>
                            <div className="text-lg font-bold text-green-600 mt-1">Pro</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ProfileSettings
                            language={i18n.language}
                            onLanguageChange={handleLanguageChange}
                        />

                        <button
                            onClick={handleLogout}
                            className="w-full text-gray-400 text-sm font-medium py-4 hover:text-red-500 transition-colors"
                        >
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;

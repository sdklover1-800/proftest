/**
 * Admin Management Console - Main Page Component.
 * 
 * This component follows the View/Logic separation pattern:
 * - All state and handlers are in useAdminDashboard hook
 * - Sub-components handle individual tabs
 * - This file contains only layout and routing logic
 */

import React from 'react';
import { IonPage, IonSpinner } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import { useAdminDashboard } from './admin/useAdminDashboard';
import type { TabType } from './admin/types';
import { DashboardTab } from './admin/DashboardTab';
import { UsersTab } from './admin/UsersTab';
import { QuestionsTab } from './admin/QuestionsTab';
import { SessionsTab } from './admin/SessionsTab';
import { QuestionModal } from './admin/QuestionModal';
import { AnalyticsTab } from './admin/AnalyticsTab';
import SettingsTab from './admin/SettingsTab';

const TABS: { id: TabType; icon: string; labelKey: string }[] = [
    { id: 'dashboard', icon: '📊', labelKey: 'admin.tabs.dashboard' },
    { id: 'users', icon: '👥', labelKey: 'admin.tabs.users' },
    { id: 'questions', icon: '❓', labelKey: 'admin.tabs.questions' },
    { id: 'sessions', icon: '📝', labelKey: 'admin.tabs.sessions' },
    { id: 'analytics', icon: '📈', labelKey: 'admin.tabs.analytics' },
    { id: 'settings', icon: '⚙️', labelKey: 'admin.tabs.settings' },
];

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const {
        activeTab,
        setActiveTab,
        isLoading,
        error,
        isQuestionModalOpen,
        stats,
        users,
        questions,
        sessions,
        analytics,
        testConfig,
        configForm,
        isSavingConfig,
        newQuestion,
        updateConfigField,
        saveConfig,
        fetchUsers,
        fetchQuestions,
        fetchSessions,
        deleteUser,
        deleteQuestion,
        deleteSession,
        bulkDeleteUsers,
        bulkDeleteQuestions,
        bulkDeleteSessions,
        createQuestion,
        updateQuestion,
        openQuestionModal,
        closeQuestionModal,
        updateNewQuestionField,
        editingQuestionId,
    } = useAdminDashboard();

    const handleTabClick = (tabId: TabType) => {
        console.log('Tab clicked:', tabId);
        setActiveTab(tabId);
    };

    return (
        <IonPage>
            <div className="min-h-screen bg-gray-50 flex" style={{ height: '100%' }}>
                {/* Sidebar Navigation - position:relative needed for z-index to work */}
                <aside
                    className="w-64 bg-gray-900 text-white min-h-screen p-4"
                    style={{ zIndex: 1000, position: 'relative' }}
                >
                    <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
                        🎯 <span>{t('admin.title')}</span>
                    </h1>
                    <nav className="space-y-2">
                        {TABS.map((tab) => (
                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                style={{ cursor: 'pointer' }}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === tab.id
                                    ? 'bg-white/10 text-white border-l-4 border-blue-500 shadow-sm'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                <span>{t(tab.labelKey)}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <IonSpinner name="crescent" className="w-12 h-12 text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl">{error}</div>
                    ) : (
                        <>
                            {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
                            {activeTab === 'users' && (
                                <UsersTab
                                    users={users}
                                    onDelete={deleteUser}
                                    onBulkDelete={bulkDeleteUsers}
                                    onRefresh={fetchUsers}
                                />
                            )}
                            {activeTab === 'questions' && (
                                <QuestionsTab
                                    questions={questions}
                                    onDelete={deleteQuestion}
                                    onBulkDelete={bulkDeleteQuestions}
                                    onRefresh={fetchQuestions}
                                    onAdd={() => openQuestionModal()}
                                    onEdit={openQuestionModal}
                                />
                            )}
                            {activeTab === 'sessions' && (
                                <SessionsTab
                                    sessions={sessions}
                                    onRefresh={fetchSessions}
                                    onDelete={deleteSession}
                                    onBulkDelete={bulkDeleteSessions}
                                />
                            )}
                            {activeTab === 'analytics' && <AnalyticsTab data={analytics} />}
                            {activeTab === 'settings' && (
                                <SettingsTab
                                    config={configForm || testConfig}
                                    onFieldChange={updateConfigField}
                                    onSave={saveConfig}
                                    isSaving={isSavingConfig}
                                />
                            )}
                        </>
                    )}
                </main>

                <QuestionModal
                    isOpen={isQuestionModalOpen}
                    onClose={closeQuestionModal}
                    onSubmit={editingQuestionId ? updateQuestion : createQuestion}
                    question={newQuestion}
                    onFieldChange={updateNewQuestionField}
                    isEditing={!!editingQuestionId}
                />
            </div>
        </IonPage>
    );
};

export default AdminDashboard;

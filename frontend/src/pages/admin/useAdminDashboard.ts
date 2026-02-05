/**
 * Custom hook for Admin Dashboard logic.
 * Contains all state management, API calls, and handlers.
 * Following View/Logic separation pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { client } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats, User, Question, Session, NewQuestion, TabType, AnalyticsData, TestConfig } from './types';

// Re-export types for convenience
export type { DashboardStats, User, Question, Session, NewQuestion, TabType, AnalyticsData, TestConfig };

const EMPTY_QUESTION: NewQuestion = {
    code: '',
    text_ru: '',
    text_kz: '',
    text_en: '',
    module: 'RIASEC',
    category: 'R',
    type: 'likert',
};

const DEFAULT_TEST_CONFIG: TestConfig = {
    riasec_limit: 20,
    big5_limit: 20,
    sjt_limit: 20,
    cognitive_limit: 20,
};

export const useAdminDashboard = () => {
    const history = useHistory();
    const token = useAuthStore((s) => s.token);
    const { t } = useTranslation();

    // UI States
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    // Data States
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
    const [configForm, setConfigForm] = useState<TestConfig>(DEFAULT_TEST_CONFIG);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [newQuestion, setNewQuestion] = useState<NewQuestion>(EMPTY_QUESTION);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Error handler - redirect on 403 Forbidden
    const handleApiError = useCallback((err: any) => {
        if (err.response?.status === 403) {
            alert(t('admin.errors.access_denied'));
            history.push('/home');
        } else {
            setError(t('admin.errors.load_error'));
        }
    }, [history, t]);

    // API: Fetch dashboard stats
    const fetchDashboard = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/dashboard', { headers: authHeaders });
            setStats(response.data.stats);
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);

    // API: Fetch users list
    const fetchUsers = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/users', { headers: authHeaders });
            setUsers(response.data.users);
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);

    // API: Fetch questions list
    const fetchQuestions = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/questions', { headers: authHeaders });
            setQuestions(response.data.questions);
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);

    // API: Fetch sessions list
    const fetchSessions = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/sessions', { headers: authHeaders });
            setSessions(response.data.sessions);
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);



    // API: Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/analytics', { headers: authHeaders });
            setAnalytics(response.data);
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);

    // API: Fetch test configuration
    const fetchConfig = useCallback(async () => {
        try {
            const response = await client.get('/api/v1/admin/config', { headers: authHeaders });
            setTestConfig(response.data);
            setConfigForm({
                riasec_limit: response.data.riasec_limit,
                big5_limit: response.data.big5_limit,
                sjt_limit: response.data.sjt_limit,
                cognitive_limit: response.data.cognitive_limit,
            });
        } catch (err: any) {
            handleApiError(err);
        }
    }, [authHeaders, handleApiError]);

    const updateConfigField = (field: keyof TestConfig, value: number) => {
        setConfigForm((prev) => ({ ...prev, [field]: value }));
    };

    const saveConfig = useCallback(async () => {
        try {
            setIsSavingConfig(true);
            const response = await client.post('/api/v1/admin/config', configForm, { headers: authHeaders });
            setTestConfig(response.data);
            setConfigForm({
                riasec_limit: response.data.riasec_limit,
                big5_limit: response.data.big5_limit,
                sjt_limit: response.data.sjt_limit,
                cognitive_limit: response.data.cognitive_limit,
            });
        } catch (err: any) {
            alert(t('admin.errors.update_error') + ': ' + (err.response?.data?.detail || err.message));
        } finally {
            setIsSavingConfig(false);
        }
    }, [authHeaders, configForm, t]);

    // API: Delete user
    const deleteUser = useCallback(async (userId: number, userEmail: string) => {
        const isConfirmed = confirm(t('admin.users.delete_confirm', { email: userEmail }));
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/users/${userId}`, { headers: authHeaders });
            setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Delete question
    const deleteQuestion = useCallback(async (questionId: number, questionCode: string) => {
        const isConfirmed = confirm(t('admin.questions.delete_confirm', { code: questionCode }));
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/questions/${questionId}`, { headers: authHeaders });
            setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Delete session
    const deleteSession = useCallback(async (sessionId: number) => {
        const isConfirmed = confirm(t('admin.sessions.delete_confirm', { id: sessionId }));
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/sessions/${sessionId}`, { headers: authHeaders });
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Bulk delete users
    const bulkDeleteUsers = useCallback(async (userIds: number[]) => {
        if (userIds.length === 0) return;
        const isConfirmed = confirm(t('admin.bulk_delete_confirm', { count: userIds.length }));
        if (!isConfirmed) return;

        try {
            await client.post('/api/v1/admin/users/bulk-delete', { ids: userIds }, { headers: authHeaders });
            setUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Bulk delete questions
    const bulkDeleteQuestions = useCallback(async (questionIds: number[]) => {
        if (questionIds.length === 0) return;
        const isConfirmed = confirm(t('admin.bulk_delete_confirm', { count: questionIds.length }));
        if (!isConfirmed) return;

        try {
            await client.post('/api/v1/admin/questions/bulk-delete', { ids: questionIds }, { headers: authHeaders });
            setQuestions((prev) => prev.filter((q) => !questionIds.includes(q.id)));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Bulk delete sessions
    const bulkDeleteSessions = useCallback(async (sessionIds: number[]) => {
        if (sessionIds.length === 0) return;
        const isConfirmed = confirm(t('admin.bulk_delete_confirm', { count: sessionIds.length }));
        if (!isConfirmed) return;

        try {
            await client.post('/api/v1/admin/sessions/bulk-delete', { ids: sessionIds }, { headers: authHeaders });
            setSessions((prev) => prev.filter((s) => !sessionIds.includes(s.id)));
        } catch (err: any) {
            alert(t('admin.errors.delete_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, t]);

    // API: Create question
    const createQuestion = useCallback(async () => {
        try {
            await client.post('/api/v1/admin/questions', newQuestion, { headers: authHeaders });
            setIsQuestionModalOpen(false);
            setNewQuestion(EMPTY_QUESTION);
            fetchQuestions();
        } catch (err: any) {
            alert(t('admin.errors.create_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, newQuestion, fetchQuestions, t]);

    // API: Update question
    const updateQuestion = useCallback(async () => {
        if (!editingQuestionId) return;
        try {
            await client.put(`/api/v1/admin/questions/${editingQuestionId}`, newQuestion, {
                headers: authHeaders,
            });
            setIsQuestionModalOpen(false);
            setNewQuestion(EMPTY_QUESTION);
            setEditingQuestionId(null);
            fetchQuestions();
        } catch (err: any) {
            alert(t('admin.errors.update_error') + ': ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, newQuestion, editingQuestionId, fetchQuestions, t]);

    // Modal handlers
    const openQuestionModal = (questionToEdit?: Question) => {
        if (questionToEdit) {
            setEditingQuestionId(questionToEdit.id);
            setNewQuestion({
                code: questionToEdit.code,
                text_ru: questionToEdit.text_ru,
                text_kz: questionToEdit.text_kz || '',
                text_en: questionToEdit.text_en || '',
                module: questionToEdit.module || 'RIASEC',
                category: questionToEdit.category,
                type: questionToEdit.type || 'likert',
            });
        } else {
            setEditingQuestionId(null);
            setNewQuestion(EMPTY_QUESTION);
        }
        setIsQuestionModalOpen(true);
    };
    const closeQuestionModal = () => setIsQuestionModalOpen(false);

    // Update new question form field
    const updateNewQuestionField = (field: keyof NewQuestion, value: string) => {
        setNewQuestion((prev) => ({ ...prev, [field]: value }));
    };

    // Load data when tab changes
    useEffect(() => {
        setIsLoading(true);
        const loadDataForCurrentTab = async () => {
            switch (activeTab) {
                case 'dashboard':
                    await fetchDashboard();
                    break;
                case 'users':
                    await fetchUsers();
                    break;
                case 'questions':
                    await fetchQuestions();
                    break;
                case 'sessions':
                    await fetchSessions();
                    break;
                case 'analytics':
                    await fetchAnalytics();
                    break;
                case 'settings':
                    await fetchConfig();
                    break;
            }
            setIsLoading(false);
        };
        loadDataForCurrentTab();
    }, [activeTab]);

    return {
        // UI State
        activeTab,
        setActiveTab,
        isLoading,
        error,
        isQuestionModalOpen,
        editingQuestionId,

        // Data
        stats,
        users,
        questions,
        sessions,
        analytics,
        testConfig,
        configForm,
        isSavingConfig,
        newQuestion,

        // Actions
        fetchDashboard,
        fetchUsers,
        fetchQuestions,
        fetchSessions,
        fetchAnalytics,
        fetchConfig,
        updateConfigField,
        saveConfig,
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
    };
};

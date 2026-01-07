/**
 * Custom hook for Admin Dashboard logic.
 * Contains all state management, API calls, and handlers.
 * Following View/Logic separation pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { client } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats, User, Question, Session, NewQuestion, TabType, AnalyticsData } from './types';

// Re-export types for convenience
export type { DashboardStats, User, Question, Session, NewQuestion, TabType, AnalyticsData };

const EMPTY_QUESTION: NewQuestion = {
    code: '',
    text_ru: '',
    text_kz: '',
    text_en: '',
    module: 'RIASEC',
    category: 'R',
    type: 'likert',
};

export const useAdminDashboard = () => {
    const history = useHistory();
    const token = useAuthStore((s) => s.token);

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
    const [newQuestion, setNewQuestion] = useState<NewQuestion>(EMPTY_QUESTION);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Error handler - redirect on 403 Forbidden
    const handleApiError = useCallback((err: any) => {
        if (err.response?.status === 403) {
            alert('Доступ запрещён. Требуются права администратора.');
            history.push('/home');
        } else {
            setError('Ошибка загрузки данных');
        }
    }, [history]);

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

    // API: Delete user
    const deleteUser = useCallback(async (userId: number, userEmail: string) => {
        const isConfirmed = confirm(`Удалить пользователя ${userEmail}? Это действие необратимо.`);
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/users/${userId}`, { headers: authHeaders });
            setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
        } catch (err: any) {
            alert('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders]);

    // API: Delete question
    const deleteQuestion = useCallback(async (questionId: number, questionCode: string) => {
        const isConfirmed = confirm(`Удалить вопрос ${questionCode}?`);
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/questions/${questionId}`, { headers: authHeaders });
            setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        } catch (err: any) {
            alert('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders]);

    // API: Delete session
    const deleteSession = useCallback(async (sessionId: number) => {
        const isConfirmed = confirm(`Удалить сессию #${sessionId}? Это действие необратимо.`);
        if (!isConfirmed) return;

        try {
            await client.delete(`/api/v1/admin/sessions/${sessionId}`, { headers: authHeaders });
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch (err: any) {
            alert('Ошибка удаления: ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders]);

    // API: Create question
    const createQuestion = useCallback(async () => {
        try {
            await client.post('/api/v1/admin/questions', newQuestion, { headers: authHeaders });
            setIsQuestionModalOpen(false);
            setNewQuestion(EMPTY_QUESTION);
            fetchQuestions();
        } catch (err: any) {
            alert('Ошибка создания: ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, newQuestion, fetchQuestions]);

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
            alert('Ошибка обновления: ' + (err.response?.data?.detail || err.message));
        }
    }, [authHeaders, newQuestion, editingQuestionId, fetchQuestions]);

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
        newQuestion,

        // Actions
        fetchDashboard,
        fetchUsers,
        fetchQuestions,
        fetchSessions,
        fetchAnalytics,
        deleteUser,
        deleteQuestion,
        deleteSession,
        createQuestion,
        updateQuestion,
        openQuestionModal,
        closeQuestionModal,
        updateNewQuestionField,
    };
};

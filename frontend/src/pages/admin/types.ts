/**
 * Type definitions for Admin Dashboard.
 * Shared between hook and components.
 */

export interface DashboardStats {
    total_users: number;
    total_sessions: number;
    completed_sessions: number;
    avg_score_riasec: number;
}

export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
}

export interface Question {
    id: number;
    code: string;
    module: string;
    category: string;
    type: string;
    text_ru: string;
    text_kz?: string;
    text_en?: string;
    is_reverse: boolean;
}

export interface Session {
    id: number;
    user_id?: number;
    user_email?: string;
    status: string;
    start_time: string;
    has_results: boolean;
}

export interface NewQuestion {
    code: string;
    text_ru: string;
    text_kz: string;
    text_en: string;
    module: string;
    category: string;
    type: string;
}

export interface AnalyticsData {
    daily_activity: { date: string; count: number }[];
    drop_off: { range: string; count: number }[];
    conversion: {
        total_sessions: number;
        completed_sessions: number;
        conversion_rate: number;
    };
}

export interface TestConfig {
    riasec_limit: number;
    big5_limit: number;
    sjt_limit: number;
    cognitive_limit: number;
}

export type ModuleKey = 'RIASEC' | 'BIG5' | 'COGNITIVE' | 'SJT';
export type QualityPrediction = 'good' | 'acceptable' | 'too_short' | 'fatigue_risk';

export interface TestModuleLimitMeta {
    hard_min: number;
    recommended_min: number;
    recommended_max: number;
    optimal_min: number;
    optimal_max: number;
    default: number;
    hard_max: number;
    avg_seconds_per_item: number;
}

export interface TestConfigResponse extends TestConfig {
    id: number;
    is_active: boolean;
    limits_meta: Record<ModuleKey, TestModuleLimitMeta>;
    warnings: string[];
    estimated_total_minutes: number;
    quality_prediction: QualityPrediction;
}

export type TabType = 'dashboard' | 'users' | 'questions' | 'sessions' | 'analytics' | 'settings';

export interface Recommendation {
    key: string;
    text: string;
    tags: string[];
}

export interface ChartData {
    subject: string;
    A: number;
    fullMark: number;
}

export interface ResultsData {
    RIASEC: ChartData[];
    BIG5: ChartData[];
    SJT?: Record<string, number>;
    COGNITIVE?: {
        total_score?: number;
        details?: Record<string, number>;
    };
}

export interface AIInsights {
    summary: string;
    strengths: string[];
    growth_areas: string[];
    recommended_paths: string[];
    next_steps: string[];
    weekly_plan?: AIWeeklyPlanItem[];
    module_explanations?: Record<string, { meaning: string; how_to_use: string }>;
}

export interface AIWeeklyTask {
    task: string;
    why: string;
    how: string;
}

export interface AIWeeklyPlanItem {
    week: number;
    title: string;
    goal: string;
    tasks: AIWeeklyTask[];
}

export interface DashboardCTA {
    text: string;
    action: string;
    params?: Record<string, string | number | boolean>;
}

export interface DashboardAxis {
    id: string;
    label: string;
    value: number;
}

export interface DashboardBenchmark {
    label: string;
    values: Record<string, number>;
}

export interface DashboardRadarContent {
    axes: DashboardAxis[];
    benchmark: DashboardBenchmark;
    ai_note: string;
}

export interface DashboardSummaryContent {
    headline: string;
    bullets: string[];
    cta: DashboardCTA;
}

export interface DashboardAnalysisContent {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

export interface DashboardSkillItem {
    skill_id: string;
    label: string;
    score: number;
    level: string;
    target_hint: string;
    status: 'good' | 'medium' | 'risk';
    ai_note: string;
    cta: DashboardCTA;
}

export interface DashboardSkillsContent {
    items: DashboardSkillItem[];
}

export interface DashboardMetricItem {
    metric_id: string;
    label: string;
    value: number;
    status: 'good' | 'medium' | 'risk';
    hint: string;
    evidence_refs?: string[];
}

export interface DashboardMetricsContent {
    items: DashboardMetricItem[];
}

export interface DashboardRecommendationItem {
    rec_id: string;
    title: string;
    impact: number;
    effort: string;
    rationale: string;
    estimated_impact: string;
    evidence_refs?: string[];
    cta: DashboardCTA;
}

export interface DashboardRecommendationBucket {
    bucket_id: string;
    title: string;
    items: DashboardRecommendationItem[];
}

export interface DashboardRecommendationsContent {
    buckets: DashboardRecommendationBucket[];
}

export interface DashboardProgressItem {
    date: string;
    label: string;
    delta: number;
}

export interface DashboardProgressContent {
    ai_note: string;
    items: DashboardProgressItem[];
    evidence_refs?: string[];
}

export interface DashboardActionContent {
    headline: string;
    description: string;
    cta: DashboardCTA;
}

export interface DashboardInsightItem {
    severity: 'info' | 'warn' | 'critical';
    text_short: string;
    why: string;
    evidence_refs: string[];
}

export interface DashboardInsightsContent {
    items: DashboardInsightItem[];
}

export interface DashboardBlock {
    block_id: string;
    type:
    | 'summary_card'
    | 'analysis_card'
    | 'insight_list'
    | 'radar'
    | 'skill_bars'
    | 'metrics'
    | 'recommendation_buckets'
    | 'progress_timeline'
    | 'action_card';
    title: string;
    content:
    | DashboardSummaryContent
    | DashboardAnalysisContent
    | DashboardInsightsContent
    | DashboardRadarContent
    | DashboardSkillsContent
    | DashboardMetricsContent
    | DashboardRecommendationsContent
    | DashboardProgressContent
    | DashboardActionContent;
}

export interface ProfileDashboard {
    run_id: string;
    model_version: string;
    versions?: {
        ruleset_version: string;
        scoring_model_version: string;
        llm_text_version: string;
    };
    overall: {
        readiness?: number;
        readiness_score: number;
        raw_readiness_score?: number;
        target_role: string;
        target_level: string;
        confidence: number;
        stability_score?: number;
        tests_count?: number;
    };
    aggregate?: {
        tests_count: number;
        updated_at?: string | null;
        stability_score?: number;
        measurement_confidence?: number;
    };
    blocks: DashboardBlock[];
    explainers: Record<string, string>;
}

export interface ProfileDashboardResponse {
    session_id: number | null;
    run_created_at?: string | null;
    dashboard: ProfileDashboard | null;
}

export type PlanTaskStatus = 'todo' | 'in_progress' | 'done';
export type PlanTaskType =
    | 'setup'
    | 'planning'
    | 'build'
    | 'improve'
    | 'document'
    | 'measure';

export interface PlanSuccessMetric {
    id: string;
    label: string;
    target: boolean | number | string;
    current?: boolean | number | string;
}

export interface PlanTaskOutputRef {
    kind: 'artifact' | 'metric' | 'note';
    label: string;
    ref: string;
}

export interface PlanTask {
    task_id: string;
    title: string;
    type: PlanTaskType;
    estimated_minutes: number;
    instructions: string[];
    outputs?: PlanTaskOutputRef[];
    tags?: string[];
    expected_impact?: Record<string, number>;
    recommended?: boolean;
    status: PlanTaskStatus;
    done_at?: string | null;
}

export interface PlanDay {
    day_index: number;
    title: string;
    estimated_minutes: number;
    tasks: PlanTask[];
    done_count?: number;
    total_count?: number;
    progress_percent?: number;
}

export interface PlanProgressSummary {
    done_count: number;
    total_count: number;
    in_progress_count: number;
    progress_percent: number;
    completed_minutes: number;
    estimated_total_minutes: number;
    day_progress: Array<{
        day_index: number;
        title: string;
        done_tasks: number;
        total_tasks: number;
        percent: number;
    }>;
}

export interface WeeklyPlan {
    plan_id: string;
    run_id: string;
    title: string;
    goal: string;
    created_at?: string;
    updated_at?: string;
    plan_template_version?: string;
    estimated_total_minutes: number;
    success_metrics: PlanSuccessMetric[];
    today_day_index?: number | null;
    is_completed?: boolean;
    progress: PlanProgressSummary;
    days: PlanDay[];
}

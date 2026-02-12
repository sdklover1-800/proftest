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

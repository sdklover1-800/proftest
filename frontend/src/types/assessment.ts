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

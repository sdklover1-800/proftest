import { useState, useEffect } from 'react';
import { assessmentApi } from '../api/assessmentApi';

interface ChartData {
    subject: string;
    A: number;
    fullMark: number;
}

interface ResultsData {
    RIASEC: ChartData[];
    BIG5: ChartData[];
}

export const useResults = (sessionId: number | null) => {
    const [results, setResults] = useState<ResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                // Try to get existing results first
                try {
                    const data = await assessmentApi.getResults(sessionId);
                    setResults(formatData(data));
                } catch (e) {
                    // If not found, try to finish the assessment
                    const data = await assessmentApi.finishAssessment(sessionId);
                    setResults(formatData(data));
                }
            } catch (err) {
                console.error("Failed to fetch results", err);
                setError("Could not load results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [sessionId]);

    const formatData = (apiData: any): ResultsData => {
        const formatSection = (sectionData: Record<string, number>): ChartData[] => {
            return Object.entries(sectionData).map(([key, value]) => ({
                subject: key,
                A: value,
                fullMark: 30 // Approx max score per category
            }));
        };

        return {
            RIASEC: apiData.RIASEC ? formatSection(apiData.RIASEC) : [],
            BIG5: apiData.BIG5 ? formatSection(apiData.BIG5) : []
        };
    };

    return { results, loading, error };
};

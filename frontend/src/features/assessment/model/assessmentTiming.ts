export interface TimedQuestion {
    code: string;
    module: string;
    text_ru?: string;
    text_kz?: string;
    text_en?: string;
}

const SPEED_PREFIXES = ['COG_A_', 'COG_B_', 'COG_C_', 'COG_D_'];

export const getCognitiveTimeLimitMs = (question: TimedQuestion): number | null => {
    if (question.module !== 'COGNITIVE') {
        return null;
    }

    const code = question.code || '';
    if (code.startsWith('COG_GO_')) {
        return 600;
    }

    if (SPEED_PREFIXES.some((prefix) => code.startsWith(prefix))) {
        return 2500;
    }

    if (code.startsWith('COG_MEM_')) {
        return 15000;
    }

    if (code.startsWith('COG_LOG_')) {
        return 25000;
    }

    return 3000;
};

export const isGoNoGoQuestion = (question: TimedQuestion): boolean =>
    question.module === 'COGNITIVE' && question.code.startsWith('COG_GO_');

export const isNoGoStimulus = (question: TimedQuestion): boolean => {
    const mergedText = `${question.text_ru ?? ''} ${question.text_kz ?? ''} ${question.text_en ?? ''}`;
    if (mergedText.includes('🔴')) {
        return true;
    }

    return /red|красн|қызыл/i.test(mergedText);
};

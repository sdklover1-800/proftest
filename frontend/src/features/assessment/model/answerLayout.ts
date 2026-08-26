import { isGoNoGoQuestion } from './assessmentTiming';

/**
 * How a question's answers should be presented.
 *
 * The bank mixes very different tasks under one `choice` type: pick a shape,
 * continue a number series, answer yes/no, choose how you would act. Showing
 * all of them as the same list of text rows is what makes the cognitive block
 * feel like a survey rather than a task.
 */
export type AnswerLayout = 'go-no-go' | 'glyph' | 'sequence' | 'compact' | 'binary' | 'text';

export interface LayoutQuestion {
    code: string;
    module: string;
    options?: { text: string }[];
}

const GLYPHS = /^[▲▼●○■□◆◇★☆🟢🔴]$/u;
const GLYPH_RUN = /^[▲▼●○■□◆◇★☆🟢🔴\s]+$/u;
const GLOSS = /^(.*?)\s*\(([^()]+)\)\s*$/;

/**
 * Option texts in the bank carry an English gloss: "Совпадают (Matches)".
 * The question itself is translated properly, the options are not — so until
 * the data carries per-language options, pick the half that matches the UI.
 */
export const stripGloss = (text: string, language: string): string => {
    const match = GLOSS.exec(text.trim());
    if (!match) {
        return text.trim();
    }
    const [, native, gloss] = match;
    if (language.split('-')[0].toLowerCase() === 'en') {
        return gloss.trim() || native.trim();
    }
    return native.trim() || gloss.trim();
};

export const optionLabels = (question: LayoutQuestion, language: string): string[] =>
    (question.options ?? []).map((option) => stripGloss(option.text, language));

export const getAnswerLayout = (question: LayoutQuestion, language: string): AnswerLayout => {
    if (isGoNoGoQuestion(question)) {
        return 'go-no-go';
    }

    const labels = optionLabels(question, language);
    if (labels.length === 0) {
        return 'text';
    }

    if (labels.every((label) => GLYPHS.test(label))) {
        return 'glyph';
    }

    // "■ ● ●" — a pattern to continue, not a string to read.
    if (labels.every((label) => GLYPH_RUN.test(label))) {
        return 'sequence';
    }

    // Number series and comparisons: "8", "10", "=" read better as tiles.
    if (labels.every((label) => label.length <= 3)) {
        return 'compact';
    }

    if (question.module === 'COGNITIVE' && labels.length === 2) {
        return 'binary';
    }

    return 'text';
};

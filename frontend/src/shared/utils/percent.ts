export const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

export const toPercentNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return 0;
    }

    const numeric = Number(value);
    if (numeric <= 1 && numeric >= 0) {
        return Math.round(numeric * 100);
    }

    return Math.round(clamp(numeric, 0, 100));
};

export const toFraction01 = (value: number | null | undefined): number => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return 0;
    }

    const numeric = Number(value);
    if (numeric <= 1 && numeric >= 0) {
        return numeric;
    }
    return clamp(numeric / 100, 0, 1);
};

export const formatPercent = (value: number | null | undefined): string =>
    `${toPercentNumber(value)}%`;

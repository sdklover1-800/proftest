import React from 'react';

interface Props {
    /** Share of the response window still left, 1 → 0. Null when untimed. */
    progress: number | null;
    children: React.ReactNode;
}

/**
 * Draws the response window as a ring around the stimulus itself.
 *
 * Reaction time is the thing being measured here, so the clock belongs on the
 * thing being looked at. A go/no-go trial closes in 600ms — a bar at the top
 * edge of the screen is never seen, because the eye is in the middle.
 *
 * `pathLength="1"` normalises the outline regardless of the box's real size,
 * so one dash offset drives any stimulus, wide or square.
 */
const StimulusTimer: React.FC<Props> = ({ progress, children }) => {
    if (progress === null) {
        return <>{children}</>;
    }

    const remaining = Math.max(0, Math.min(1, progress));
    // Calm until the window is nearly closed, then one shift to urgent.
    const urgent = remaining <= 0.2;

    return (
        <div className="relative inline-flex items-center justify-center p-3">
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <rect
                    x="1.5"
                    y="1.5"
                    width="97"
                    height="97"
                    rx="10"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                />
                <rect
                    x="1.5"
                    y="1.5"
                    width="97"
                    height="97"
                    rx="10"
                    fill="none"
                    stroke={urgent ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - remaining}
                    style={{ transition: 'stroke-dashoffset 100ms linear, stroke 200ms ease' }}
                />
            </svg>
            <div className="relative">{children}</div>
        </div>
    );
};

export default StimulusTimer;

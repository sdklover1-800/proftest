/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'sans-serif'],
            },
            // Mapped to the CSS variables in index.css so a colour works in
            // both themes without a `dark:` variant at every call site.
            colors: {
                border: 'hsl(var(--pt-border) / <alpha-value>)',
                // Boundaries that carry meaning (an answer tile, a control)
                // rather than decorative dividers: measured to clear 3:1.
                'border-strong': 'hsl(var(--pt-border-strong) / <alpha-value>)',
                input: 'hsl(var(--pt-input) / <alpha-value>)',
                ring: 'hsl(var(--pt-ring) / <alpha-value>)',
                background: 'hsl(var(--pt-background) / <alpha-value>)',
                foreground: 'hsl(var(--pt-foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'hsl(var(--pt-primary) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-primary-foreground) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--pt-secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-secondary-foreground) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--pt-muted) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--pt-accent) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-accent-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--pt-destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-destructive-foreground) / <alpha-value>)',
                },
                card: {
                    DEFAULT: 'hsl(var(--pt-card) / <alpha-value>)',
                    foreground: 'hsl(var(--pt-card-foreground) / <alpha-value>)',
                },
            },
            // `animate-fade-in` and `animate-slide-up` were already in use in
            // nine places but had never been defined, so nothing moved.
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-up': {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'pop-in': {
                    '0%': { opacity: '0', transform: 'scale(0.92)' },
                    '70%': { transform: 'scale(1.02)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 260ms ease-out both',
                'slide-up': 'slide-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
                'pop-in': 'pop-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
            },
        },
    },
    plugins: [],
}

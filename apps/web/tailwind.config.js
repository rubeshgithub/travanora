export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                green: {
                    DEFAULT: '#FFBF00',
                    deep: '#E6AC00',
                    soft: '#FFF7CC',
                    tint: '#FFFDF0',
                },
                'amber-ink': '#392A00',
                navy: {
                    DEFAULT: '#0a2540',
                    2: '#173456',
                },
                muted: '#5b6b82',
                line: '#c8d0db',
                surface: '#fafbfc',
                accent: {
                    yellow: '#ffd84d',
                },
            },
            fontFamily: {
                sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                serif: ['Instrument Serif', 'ui-serif', 'Georgia', 'serif'],
            },
            borderRadius: {
                pill: '999px',
                card: '20px',
                input: '10px',
            },
            boxShadow: {
                'green-sm': '0 4px 14px 0 rgba(255, 191, 0, 0.25)',
                'green-md': '0 8px 28px 0 rgba(255, 191, 0, 0.35)',
                card: '0 2px 8px 0 rgba(10, 37, 64, 0.05)',
                'card-hover': '0 12px 32px 0 rgba(10, 37, 64, 0.10)',
            },
            letterSpacing: {
                tighter: '-0.02em',
            },
            animation: {
                'pulse-green': 'pulseGreen 1.4s ease-in-out infinite',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                pulseGreen: {
                    '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.15)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(12px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
//# sourceMappingURL=tailwind.config.js.map
/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'cyber-black': '#0B0F19',
                'cyber-navy': '#0D1526',
                'cyber-dark': '#111827',
                'electric-cyan': '#00FFFF',
                'neon-purple': '#B026FF',
                'neon-purple-dim': '#7B1FA2',
                'off-white': '#F5F5F7',
                'soft-gray': '#E8E8ED',
                'apple-blue': '#0071E3',
            },
            fontFamily: {
                sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'slide-up': 'slide-up 0.5s ease-out',
                'fade-in': 'fade-in 0.4s ease-out',
                'scan-line': 'scan-line 3s linear infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 5px #00FFFF, 0 0 10px #00FFFF' },
                    '50%': { boxShadow: '0 0 20px #00FFFF, 0 0 40px #00FFFF, 0 0 80px #00FFFF' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'slide-up': {
                    'from': { opacity: '0', transform: 'translateY(30px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                'scan-line': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
            },
            backgroundImage: {
                'cyber-grid': `linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), 
                        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)`,
                'cyber-gradient': 'linear-gradient(135deg, #0B0F19 0%, #0D1526 50%, #1a0a2e 100%)',
                'neon-border': 'linear-gradient(90deg, #00FFFF, #B026FF, #00FFFF)',
            },
            boxShadow: {
                'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.1)',
                'neon-purple': '0 0 20px rgba(176, 38, 255, 0.3), 0 0 40px rgba(176, 38, 255, 0.1)',
                'apple': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.06)',
                'apple-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
            },
        },
    },
    plugins: [],
};

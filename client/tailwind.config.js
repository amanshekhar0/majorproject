/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'cyber-black': '#050505',
                'cyber-navy': '#0C0C0C',
                'cyber-dark': '#121212',
                'electric-cyan': '#FFFFFF',
                'neon-purple': '#E5E5E5',
                'neon-purple-dim': '#737373',
                'off-white': '#FAFAFA',
                'soft-gray': '#E5E5E5',
                'apple-blue': '#FFFFFF',
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
                    '0%, 100%': { boxShadow: '0 0 5px #FFFFFF, 0 0 10px #FFFFFF' },
                    '50%': { boxShadow: '0 0 20px #FFFFFF, 0 0 40px #FFFFFF, 0 0 80px #FFFFFF' },
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
                'cyber-grid': `linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px), 
                        linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)`,
                'cyber-gradient': 'linear-gradient(135deg, #050505 0%, #0C0C0C 50%, #171717 100%)',
                'neon-border': 'linear-gradient(90deg, #FFFFFF, #737373, #E5E5E5)',
            },
            boxShadow: {
                'neon-cyan': '0 0 20px rgba(255, 255, 255, 0.12), 0 0 40px rgba(255, 255, 255, 0.04)',
                'neon-purple': '0 0 20px rgba(229, 229, 229, 0.12), 0 0 40px rgba(229, 229, 229, 0.04)',
                'apple': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.06)',
                'apple-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
            },
        },
    },
    plugins: [],
};

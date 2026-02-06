/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark Theme Backgrounds
                background: {
                    DEFAULT: "#000000",
                    layer1: "#1e1e1e",
                    layer2: "#252526",
                },
                // Brand Colors
                primary: {
                    DEFAULT: "#3b82f6", // Electric Blue
                    hover: "#2563eb",
                    gradientStart: "#3b82f6",
                    gradientEnd: "#8b5cf6", // Purple
                },
                // Semantic
                success: "#34d399", // Emerald-400
                error: "#f87171", // Red-400
                warning: "#facc15", // Yellow-400
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

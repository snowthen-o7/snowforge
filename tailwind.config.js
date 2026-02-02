/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-hover': 'rgb(var(--border-hover) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        'gradient-blue-start': 'rgb(var(--gradient-blue-start) / <alpha-value>)',
        'gradient-blue-end': 'rgb(var(--gradient-blue-end) / <alpha-value>)',
        'gradient-purple-start': 'rgb(var(--gradient-purple-start) / <alpha-value>)',
        'gradient-purple-end': 'rgb(var(--gradient-purple-end) / <alpha-value>)',
        'gradient-emerald-start': 'rgb(var(--gradient-emerald-start) / <alpha-value>)',
        'gradient-emerald-end': 'rgb(var(--gradient-emerald-end) / <alpha-value>)',
        'gradient-amber-start': 'rgb(var(--gradient-amber-start) / <alpha-value>)',
        'gradient-amber-end': 'rgb(var(--gradient-amber-end) / <alpha-value>)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

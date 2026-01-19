import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        weedn: {
          primary: '#059669',
          secondary: '#10B981',
          dark: '#064E3B',
          light: '#D1FAE5',
          accent: '#34D399'
        }
      }
    },
  },
  plugins: [],
}
export default config

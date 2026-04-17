import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full px-3 py-2.5 rounded-lg text-text font-semibold transition-colors duration-200"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-surface-border-strong)',
                boxShadow: 'inset 0 0 0 1px var(--color-surface-border)',
            }}
        > {theme == 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
    )
}
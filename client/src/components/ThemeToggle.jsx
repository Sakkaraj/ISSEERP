import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 border rounded bg-secondary text-text transition-colors duration-200"
            > {theme == 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
    )
}
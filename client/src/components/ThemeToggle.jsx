import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-full p-2 border rounded bg-secondary text-text transition-colors duration-200 hover:bg-opacity-80"
        > {theme == 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
    )
}
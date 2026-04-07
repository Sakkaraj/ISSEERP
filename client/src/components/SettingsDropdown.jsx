import React, { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function SettingsDropdown() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 shadow-sm px-3 py-2 bg-white/5 text-sm font-medium text-text hover:bg-white/10 focus:outline-none transition-colors"
                id="options-menu"
                aria-haspopup="true"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg className="w-3 h-3 text-text/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-52 rounded-xl shadow-2xl bg-[hsl(220,15%,12%)] border border-white/10 focus:outline-none z-50"
                    role="menu"
                >
                    <div className="py-2">
                        {/* Appearance */}
                        <div className="px-4 py-2 text-xs font-semibold text-text/40 uppercase tracking-widest">
                            Appearance
                        </div>
                        <div className="px-4 py-2 mb-1">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

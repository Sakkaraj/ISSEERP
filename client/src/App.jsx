import React from "react";
import './index.css';
import { Link, Route, Routes } from "react-router-dom";
import Finance from './finance';
import Home from './Home';
import ThemeToggle from "./components/ThemeToggle";

function App() {
    return (
        <div className="min-h-screen bg-background text-text transition-colors duration-300">
            <header>
                <h1 className='text-center text-3xl font-bold text-primary mt-10'>
                    BoonSunClon
                </h1>
                <ThemeToggle />
            </header>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/finance">Finance</Link>
                    </li>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/finance" element={<Finance />} />
            </Routes>
        </div>
    )
}

export default App;
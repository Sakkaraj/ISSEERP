/* This is skeleton of website */
import React from "react";
import './index.css';
import { Link, Route, Routes } from "react-router-dom";
import Finance from './finance';
import Home from './Home';
import SettingsDropdown from "./components/SettingsDropdown";
import Dashboard from './dashboard';
import Construct from "./construct";
import OrderDetail from "./orderdetail";

function App() {
    return (
        <div className="min-h-screen bg-background text-text transition-colors duration-300 flex flex-col">
            <header className="relative">
                <h1 className='text-center text-3xl font-bold text-primary mt-10'>
                    BoonSunClon
                </h1>
                <div className="absolute top-4 right-4">
                    <SettingsDropdown />
                </div>
            </header>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/finance">Finance</Link>
                    </li>
                    <li>
                        <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/construct">Construct</Link>
                    </li>
                    <li>
                        <Link to="/orderdetail">Order Detail</Link>
                    </li>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/construct" element={<Construct />} />
                <Route path="/orderdetail" element={<OrderDetail />} />
            </Routes>
        </div>
    )
}

export default App;
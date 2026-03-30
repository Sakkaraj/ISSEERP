/* This is skeleton of website */
import React from "react";
import './index.css';
import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Finance from './finance';
import Home from './home';
import SettingsDropdown from "../components/SettingsDropdown";
import Dashboard from './dashboard';
import Construct from "./construct";
import OrderDetail from "./orderdetail";
import Login from "./login";

function RequireAuth({ children }) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="min-h-screen bg-background text-text transition-colors duration-300 flex flex-col">
            {!isLoginPage && (
                <>
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
                </>
            )}
            <Routes>
                <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
                <Route path="/finance" element={<RequireAuth><Finance /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/construct" element={<RequireAuth><Construct /></RequireAuth>} />
                <Route path="/orderdetail" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </div>
    )
}

export default App;
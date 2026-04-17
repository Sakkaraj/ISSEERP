/* App.jsx — Main shell for BoonSunClon ERP */
import React, { useState, useEffect } from "react";
import './index.css';
import { NavLink, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Finance from './finance';
import Home from './home';
import SettingsDropdown from "../components/SettingsDropdown";
import Dashboard from './dashboard';
import OrderDetail from "./orderdetail";
import Inventory from "./inventory";
import QCRegister from "./qc";
import Construct from "./construct";
import Login from "./login";
import UserManagement from "./usermanagement";
import Production from "./production";
import Logistics from "./logistics";
import RoleBasedRoute from "../components/RoleBasedRoute";

/**
 * Role Permissions Matrix
 * Defines which roles can access each page
 */
const ROLE_PERMISSIONS = {
  home: ['Admin', 'SaleStaff', 'QualityController', 'LogisticsStaff', 'Production'],
    dashboard: ['Admin'],
  orderdetail: ['Admin', 'SaleStaff'],
  inventory: ['Admin', 'LogisticsStaff'],
    logistics: ['Admin', 'LogisticsStaff'],
  qc: ['Admin', 'QualityController'],
    production: ['Admin', 'Production'],
  construct: ['Admin'],
  finance: ['Admin', 'SaleStaff'],
  usermanagement: ['Admin'],
};

/**
 * Navigation Links Configuration
 * Extended with role requirements
 */
const NAV_LINKS = [
    { to: '/',            label: 'Home',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ROLE_PERMISSIONS.home },
    { to: '/dashboard',   label: 'Dashboard',   icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', roles: ROLE_PERMISSIONS.dashboard },
    { to: '/orderdetail', label: 'Orders',       icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', roles: ROLE_PERMISSIONS.orderdetail },
    { to: '/inventory',   label: 'Inventory',    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ROLE_PERMISSIONS.inventory },
    { to: '/logistics',   label: 'Logistics',    icon: 'M3 13h4l3 4h6l3-4h2M5 13l1.5-5h11L19 13M7 8V5h10v3', roles: ROLE_PERMISSIONS.logistics },
    { to: '/qc',          label: 'QC Register',  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', roles: ROLE_PERMISSIONS.qc },
    { to: '/production',  label: 'Production',   icon: 'M3 7h18M5 7l2 12h10l2-12M10 11v4m4-4v4', roles: ROLE_PERMISSIONS.production },
    { to: '/construct',   label: 'Design Specs', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', roles: ROLE_PERMISSIONS.construct },
    { to: '/finance',     label: 'Finance',      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ROLE_PERMISSIONS.finance },
    { to: '/usermanagement', label: 'Users',     icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', roles: ROLE_PERMISSIONS.usermanagement },
];

/**
 * Format role display name
 * Converts 'SaleStaff' -> 'Sale Staff', 'QualityController' -> 'Quality Controller', etc.
 */
function formatRoleName(role) {
    if (role === 'SaleStaff') return 'Sale Staff';
    if (role === 'QualityController') return 'Quality Controller';
    if (role === 'LogisticsStaff') return 'Logistics Staff';
    if (role === 'Production') return 'Production Staff';
    return role;
}

function RequireAuth({ children }) {
    const token = localStorage.getItem('auth_token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    const [userRole, setUserRole] = useState('');

    // Load role from localStorage on mount or token change
    useEffect(() => {
        const role = localStorage.getItem('user_role');
        setUserRole(role || '');
    }, [location]);

    // Filter navigation links based on user role
    const visibleNavLinks = NAV_LINKS.filter(link => {
        if (!userRole) return false;
        return link.roles.includes(userRole);
    });

    return (
        <div className="min-h-screen bg-background text-text transition-colors duration-300 flex flex-col">
            {!isLoginPage && (
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
                    <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
                        {/* Brand */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30 text-white font-bold text-xl">
                                B
                            </div>
                            <span className="text-xl font-bold text-primary tracking-tight">BoonSunClon</span>
                            <span className="hidden lg:block text-text/30 text-sm font-medium">ERP Portal</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Staff info - Display actual user role */}
                            <div className="hidden md:flex flex-col items-end mr-1 text-right">
                                <span className="text-xs font-bold text-text/80 leading-none">{formatRoleName(userRole)} User</span>
                                <span className="text-[10px] text-primary uppercase tracking-widest mt-1 font-bold">ERP Authorized</span>
                            </div>
                            
                            <SettingsDropdown />
                            
                            <button 
                                id="header-logout"
                                onClick={() => {
                                    localStorage.removeItem('auth_token');
                                    localStorage.removeItem('user_role');
                                    localStorage.removeItem('username');
                                    window.location.href = '/login';
                                }}
                                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-wider"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Log Out
                            </button>
                        </div>
                    </div>

                    {/* Responsive click-based nav - Filter by role */}
                    <nav className="border-t border-white/5 bg-black/20 px-4 py-2.5">
                        <div className="max-w-[1440px] mx-auto flex flex-wrap gap-1.5">
                        {visibleNavLinks.map(({ to, label, icon }) => {
                            return (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) => `shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border uppercase tracking-wider
                                        ${isActive ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'text-text/60 bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                                    </svg>
                                    {label}
                                </NavLink>
                            );
                        })}
                        </div>
                    </nav>
                </header>
            )}

            <main className="flex-1 flex flex-col">
                <Routes>
                    <Route path="/"            element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.home}><Home /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/dashboard"   element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.dashboard}><Dashboard /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/orderdetail" element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.orderdetail}><OrderDetail /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/inventory"   element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.inventory}><Inventory /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/logistics"   element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.logistics}><Logistics /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/qc"          element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.qc}><QCRegister /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/production"  element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.production}><Production /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/construct"   element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.construct}><Construct /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/finance"     element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.finance}><Finance /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/usermanagement" element={<RequireAuth><RoleBasedRoute requiredRoles={ROLE_PERMISSIONS.usermanagement}><UserManagement /></RoleBasedRoute></RequireAuth>} />
                    <Route path="/login"       element={<Login />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
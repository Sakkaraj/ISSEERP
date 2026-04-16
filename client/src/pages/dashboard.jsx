import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles/dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState([
        {
            title: 'Pending Orders',
            value: '0',
            icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
            color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20'
        },
        {
            title: 'Materials Reserved',
            value: '0',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20'
        },
        {
            title: 'Production Completed',
            value: '0',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20'
        },
        {
            title: 'Pending QC Inspections',
            value: '0',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20'
        },
    ]);
    const [statsError, setStatsError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadSummary() {
            setStatsError('');
            try {
                const res = await fetch('/api/dashboard/summary');
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load dashboard summary');
                if (cancelled) return;

                setStats(prev => prev.map((item) => {
                    if (item.title === 'Pending Orders') return { ...item, value: String(data.pending_orders ?? 0) };
                    if (item.title === 'Materials Reserved') return { ...item, value: String(data.materials_reserved ?? 0) };
                    if (item.title === 'Production Completed') return { ...item, value: String(data.completed_production ?? 0) };
                    if (item.title === 'Pending QC Inspections') return { ...item, value: String(data.pending_qc ?? 0) };
                    return item;
                }));
            } catch (err) {
                if (!cancelled) {
                    setStatsError(err.message || 'Failed to load dashboard summary');
                }
            }
        }

        loadSummary();
        return () => { cancelled = true; };
    }, []);

    const quickActions = [
        { to: '/orderdetail', label: 'New Order',          desc: 'Create OEM, ODM or Bespoke order', icon: 'M12 4v16m8-8H4', color: 'hover:border-primary/40 hover:bg-primary/10 group-hover:text-primary' },
        { to: '/inventory',   label: 'Reserve Material',   desc: 'Allocate timber for bespoke jobs',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'hover:border-yellow-500/40 hover:bg-yellow-500/10 group-hover:text-yellow-400' },
        { to: '/qc',          label: 'Log Inspection',     desc: 'Register AQL QC result',           icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'hover:border-green-500/40 hover:bg-green-500/10 group-hover:text-green-400' },
        { to: '/finance',     label: 'Finance Overview',   desc: 'Review revenue & expenses',        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'hover:border-purple-500/40 hover:bg-purple-500/10 group-hover:text-purple-400' },
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1 className="text-3xl font-bold text-text tracking-tight">System Dashboard</h1>
                <p className="text-text/60 mt-1">BoonSunClon ERP — Inventory, Orders & QC at a glance.</p>
            </div>

            {/* Quick Actions */}
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <div className="dashboard-quick-grid">
                {quickActions.map(({ to, label, desc, icon, color }) => (
                    <Link key={to} to={to}
                        className={`dashboard-quick-action group ${color}`}>
                        <div className="dashboard-quick-icon-wrap">
                            <svg className="w-5 h-5 text-text transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                            </svg>
                        </div>
                        <span className="font-semibold text-text transition-colors">{label}</span>
                        <span className="text-xs text-text/50 mt-1">{desc}</span>
                    </Link>
                ))}
            </div>

            {/* Metrics Grid */}
            <h2 className="dashboard-section-title">Live Metrics</h2>
            {statsError && (
                <p className="text-xs text-red-400 mb-3">{statsError}</p>
            )}
            <div className="dashboard-metric-grid">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`dashboard-metric-card ${stat.border}`}>
                        <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <svg className={`w-6 h-6 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                </svg>
                            </div>
                            <span className="text-4xl font-extrabold text-text">{stat.value}</span>
                        </div>
                        <p className="mt-4 font-medium text-text/80">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* System Status Banner */}
            <div className="dashboard-status-banner">
                <div className="flex items-center">
                    <div className="relative flex h-3 w-3 mr-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-text">Database Connection Stable</h3>
                        <p className="text-sm text-text/60">Connected to <code className="font-mono text-primary">isse224</code> on MySQL via Go Backend.</p>
                    </div>
                </div>
                <div className="dashboard-version-badge">
                    V.2.0-P2
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
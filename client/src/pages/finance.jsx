import React, { useEffect, useState } from 'react';
import './styles/finance.css';

function Finance() {
    const [finances, setFinances] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        recentOrders: [],
        recentSupplies: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFinance = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/finance');
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                setFinances(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFinance();
    }, []);

    return (
        <div className="finance-page">
            <div className="finance-header">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Finance Overview</h1>
                    <p className="text-text/60 mt-1">Track company revenue and material expenses.</p>
                </div>
                <button className="finance-export-btn">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                </button>
            </div>

            {loading && <div className="finance-message">Loading finance data...</div>}
            {error && <div className="finance-message finance-message-error">{error}</div>}
            
            {/* KPI Cards */}
            <div className="finance-kpi-grid">
                <div className="finance-kpi-card finance-kpi-card-income group">
                    <div className="finance-kpi-glow finance-kpi-glow-income"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Total Income</p>
                            <h3 className="text-3xl font-bold text-text">${finances.totalIncome.toLocaleString()}</h3>
                        </div>
                        <div className="finance-kpi-icon finance-kpi-icon-income">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="finance-kpi-card finance-kpi-card-expense group">
                    <div className="finance-kpi-glow finance-kpi-glow-expense"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Total Expenses</p>
                            <h3 className="text-3xl font-bold text-text">${finances.totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="finance-kpi-icon finance-kpi-icon-expense">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="finance-kpi-card finance-kpi-card-profit group">
                    <div className="finance-kpi-glow finance-kpi-glow-profit"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Net Profit</p>
                            <h3 className="text-3xl font-bold text-primary">${finances.netProfit.toLocaleString()}</h3>
                        </div>
                        <div className="finance-kpi-icon finance-kpi-icon-profit">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Lists */}
            <div className="finance-list-grid">
                {/* Income / Orders */}
                <div className="finance-list-card">
                    <div className="finance-list-header">
                        <h2 className="text-lg font-semibold text-text">Recent Income <span className="text-sm font-normal text-text/50 ml-2">(from Orders)</span></h2>
                        <span className="finance-list-badge finance-list-badge-income">Revenue</span>
                    </div>
                    <div className="p-0">
                        <ul className="divide-y divide-white/10">
                            {finances.recentOrders.map((order) => (
                                <li key={order.id} className="finance-list-row">
                                    <div className="finance-list-row-main">
                                        <span className="font-medium text-text">{order.name}</span>
                                        <span className="text-sm text-text/50 mt-1">{order.date} • ID: #{order.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-green-400">+${order.amount.toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                            {finances.recentOrders.length === 0 && (
                                <li className="p-6 text-sm text-text/50">No completed orders yet.</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Expenses / Supplies */}
                <div className="finance-list-card">
                    <div className="finance-list-header">
                        <h2 className="text-lg font-semibold text-text">Recent Spendings <span className="text-sm font-normal text-text/50 ml-2">(Supplies)</span></h2>
                        <span className="finance-list-badge finance-list-badge-expense">Expense</span>
                    </div>
                    <div className="p-0">
                        <ul className="divide-y divide-white/10">
                            {finances.recentSupplies.map((supply) => (
                                <li key={supply.id} className="finance-list-row">
                                    <div className="finance-list-row-main">
                                        <span className="font-medium text-text">{supply.name}</span>
                                        <span className="text-sm text-text/50 mt-1">{supply.date} • ID: #{supply.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-red-400">-${supply.cost.toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                            {finances.recentSupplies.length === 0 && (
                                <li className="p-6 text-sm text-text/50">No supply records yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Finance;
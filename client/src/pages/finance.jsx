import React, { useState } from 'react';

function Finance() {
    // Mock Data based on our new DB schema expectations
    const [finances] = useState({
        totalIncome: 17850.50,
        totalExpenses: 5030.00,
        netProfit: 12820.50,
        recentOrders: [
            { id: 101, name: 'Acme Corp Furniture Set', amount: 4500.00, date: '2026-03-29' },
            { id: 102, name: 'Global Tech Office Desks', amount: 12400.00, date: '2026-03-25' },
            { id: 103, name: 'Jane Doe Custom Sofa', amount: 850.50, date: '2026-03-22' },
        ],
        recentSupplies: [
            { id: 201, name: 'Premium Leather (50 rolls)', cost: 3400.00, date: '2026-03-28' },
            { id: 202, name: 'Oak Wood Planks', cost: 1200.00, date: '2026-03-24' },
            { id: 203, name: 'Warehouse Tools & Machinery', cost: 430.00, date: '2026-03-20' },
        ]
    });

    return (
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Finance Overview</h1>
                    <p className="text-text/60 mt-1">Track company revenue and material expenses.</p>
                </div>
                <button className="hidden sm:flex items-center px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                </button>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/30 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Total Income</p>
                            <h3 className="text-3xl font-bold text-text">${finances.totalIncome.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/30 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Total Expenses</p>
                            <h3 className="text-3xl font-bold text-text">${finances.totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-text/60 mb-1">Net Profit</p>
                            <h3 className="text-3xl font-bold text-primary">${finances.netProfit.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income / Orders */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/10">
                        <h2 className="text-lg font-semibold text-text">Recent Income <span className="text-sm font-normal text-text/50 ml-2">(from Orders)</span></h2>
                        <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Revenue</span>
                    </div>
                    <div className="p-0">
                        <ul className="divide-y divide-white/10">
                            {finances.recentOrders.map((order) => (
                                <li key={order.id} className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-text">{order.name}</span>
                                        <span className="text-sm text-text/50 mt-1">{order.date} • ID: #{order.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-green-400">+${order.amount.toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Expenses / Supplies */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/10">
                        <h2 className="text-lg font-semibold text-text">Recent Spendings <span className="text-sm font-normal text-text/50 ml-2">(Supplies)</span></h2>
                        <span className="text-xs font-semibold text-red-500 bg-red-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Expense</span>
                    </div>
                    <div className="p-0">
                        <ul className="divide-y divide-white/10">
                            {finances.recentSupplies.map((supply) => (
                                <li key={supply.id} className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-text">{supply.name}</span>
                                        <span className="text-sm text-text/50 mt-1">{supply.date} • ID: #{supply.id}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-red-400">-${supply.cost.toFixed(2)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Finance;
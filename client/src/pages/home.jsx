import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <main className="flex-1 flex items-center justify-center p-8">
            <section className="max-w-2xl w-full text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-text mb-3 tracking-tight">BoonSunClon ERP</h1>
                <p className="text-text/60 mb-2 leading-relaxed">
                    Internal information system for <span className="text-primary font-semibold">BoonSunClon Expedition</span> — a furniture manufacturer specialising in OEM, ODM, and Bespoke production.
                </p>
                <p className="text-text/40 text-sm mb-8">
                    ITCS224: Fundamentals of Information Systems and Software Development
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    {[
                        { to: '/orderdetail', label: 'Order Management', desc: 'Track OEM, ODM & bespoke orders', color: 'border-primary/20 hover:border-primary/50' },
                        { to: '/inventory',   label: 'Material Inventory', desc: 'Reserve timber for production',   color: 'border-yellow-500/20 hover:border-yellow-500/50' },
                        { to: '/qc',          label: 'QC Register',       desc: 'Log AQL inspection results',      color: 'border-green-500/20 hover:border-green-500/50' },
                    ].map(({ to, label, desc, color }) => (
                        <Link key={to} to={to} className={`block p-4 bg-white/5 border ${color} rounded-xl transition-all duration-200 hover:-translate-y-0.5`}>
                            <p className="font-semibold text-text text-sm">{label}</p>
                            <p className="text-text/50 text-xs mt-1">{desc}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Home;
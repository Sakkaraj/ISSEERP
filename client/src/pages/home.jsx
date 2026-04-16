import React from "react";
import { Link } from "react-router-dom";
import './styles/home.css';

function Home() {
    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="home-logo-wrap">
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
                <div className="home-feature-grid">
                    {[
                        { to: '/orderdetail', label: 'Order Management', desc: 'Track OEM, ODM & bespoke orders', color: 'border-primary/20 hover:border-primary/50' },
                        { to: '/inventory',   label: 'Material Inventory', desc: 'Reserve timber for production',   color: 'border-yellow-500/20 hover:border-yellow-500/50' },
                        { to: '/qc',          label: 'QC Register',       desc: 'Log AQL inspection results',      color: 'border-green-500/20 hover:border-green-500/50' },
                    ].map(({ to, label, desc, color }) => (
                        <Link key={to} to={to} className={`home-feature-link ${color}`}>
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
import React, { useEffect, useMemo, useState } from 'react';
import './styles/production.css';

const PRODUCTION_CHECKLIST = [
    'Material preparation completed',
    'Cutting completed',
    'Assembly completed',
    'Finishing completed',
    'Packaging completed',
];

function deriveCheckedSteps(order) {
    const note = String(order?.progress_note || '').toLowerCase();
    const pct = Number(order?.progress_percent || 0);
    const inferredCount = Math.round((Math.max(0, Math.min(100, pct)) * PRODUCTION_CHECKLIST.length) / 100);
    const matched = PRODUCTION_CHECKLIST.filter((step) => note.includes(step.toLowerCase()));

    // Always trust explicit 100% progress as fully complete checklist.
    if (inferredCount >= PRODUCTION_CHECKLIST.length) {
        return [...PRODUCTION_CHECKLIST];
    }

    // Combine note-matched steps with inferred count so partial text does not undercount.
    const picked = new Set(matched);
    for (let i = 0; i < inferredCount && i < PRODUCTION_CHECKLIST.length; i += 1) {
        picked.add(PRODUCTION_CHECKLIST[i]);
    }

    return PRODUCTION_CHECKLIST.filter((step) => picked.has(step));
}

function extractManualProgressNote(note) {
    const raw = String(note || '').trim();
    if (!raw.toLowerCase().startsWith('checklist ')) {
        return raw;
    }

    const separatorIdx = raw.indexOf(' | ');
    if (separatorIdx < 0) {
        return '';
    }

    return raw.slice(separatorIdx + 3).trim();
}

const STATUS_STYLES = {
    'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function Production() {
    const role = localStorage.getItem('user_role') || '';
    const username = localStorage.getItem('username') || '';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [checkedSteps, setCheckedSteps] = useState([]);
    const [progressNote, setProgressNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const canViewAllAssignments = role === 'Admin';

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const query = canViewAllAssignments ? '' : `?assignee=${encodeURIComponent(username)}`;
            const res = await fetch(`/api/production/orders${query}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load production orders');
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load production orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canViewAllAssignments && !username) {
            setLoading(false);
            setError('Missing username in session. Please logout and sign in again.');
            return;
        }
        fetchOrders();
    }, []);

    useEffect(() => {
        if (!selectedOrder) return;
        setCheckedSteps(deriveCheckedSteps(selectedOrder));
        setProgressNote(extractManualProgressNote(selectedOrder.progress_note));
        setFeedback('');
    }, [selectedOrder?.id]);

    const progressPercent = useMemo(() => {
        return Math.floor((checkedSteps.length * 100) / PRODUCTION_CHECKLIST.length);
    }, [checkedSteps]);

    const toggleChecklistStep = (step) => {
        setCheckedSteps((prev) => {
            if (prev.includes(step)) {
                return prev.filter((s) => s !== step);
            }
            return [...prev, step];
        });
    };

    const summary = useMemo(() => {
        const total = orders.length;
        const completed = orders.filter((o) => o.production_status === 'Completed').length;
        const inProgress = orders.filter((o) => o.production_status === 'In Progress').length;
        const pending = orders.filter((o) => o.production_status === 'Pending').length;
        return { total, completed, inProgress, pending };
    }, [orders]);

    const saveProgress = async (submit) => {
        if (!selectedOrder) return;

        setSaving(true);
        setFeedback('');
        try {
            const res = await fetch('/api/production/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: selectedOrder.id,
                    assignee: selectedOrder.assigned_to || username,
                    progress_percent: Number(progressPercent),
                    progress_note: progressNote,
                    completed_steps: checkedSteps,
                    total_steps: PRODUCTION_CHECKLIST.length,
                    submit,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to save progress');

            setOrders((prev) => prev.map((o) => {
                if (o.id !== selectedOrder.id) return o;
                return {
                    ...o,
                    progress_percent: Number(data.progress_percent ?? progressPercent),
                    progress_note: data.progress_note ?? progressNote,
                    progress_updated_at: new Date().toISOString(),
                    progress_submitted_at: submit ? new Date().toISOString() : o.progress_submitted_at,
                    progress_last_updated_by: selectedOrder.assigned_to || username,
                    production_status: data.production_status || o.production_status,
                    started_at: data.started_at || o.started_at,
                    completed_at: data.completed_at || o.completed_at,
                };
            }));

            setSelectedOrder((prev) => prev ? {
                ...prev,
                progress_percent: Number(data.progress_percent ?? progressPercent),
                progress_note: data.progress_note ?? progressNote,
                progress_updated_at: new Date().toISOString(),
                progress_submitted_at: submit ? new Date().toISOString() : prev.progress_submitted_at,
                progress_last_updated_by: prev.assigned_to || username,
                production_status: data.production_status || prev.production_status,
                started_at: data.started_at || prev.started_at,
                completed_at: data.completed_at || prev.completed_at,
            } : prev);

            setFeedback(submit ? 'Progress submitted successfully.' : 'Progress updated successfully.');
        } catch (err) {
            setFeedback(err.message || 'Unable to save progress');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Production Progress</h1>
                    <p className="text-text/60 mt-1">
                        {canViewAllAssignments
                            ? 'Track and update progress for all assigned production orders.'
                            : `Track and update your assigned orders, ${username}.`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Assigned" value={summary.total} />
                <StatCard title="In Progress" value={summary.inProgress} />
                <StatCard title="Completed" value={summary.completed} />
                <StatCard title="Pending" value={summary.pending} />
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="p-14 text-center text-text/40">Loading assigned production orders...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-400 text-sm">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Order</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Assigned To</th>
                                    <th className="p-4">Progress</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 pr-6">Last Update</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4 pl-6 font-mono text-sm font-medium text-text/80 group-hover:text-primary transition-colors">#{order.id}</td>
                                        <td className="p-4 font-semibold text-text">{order.customer_name}</td>
                                        <td className="p-4 text-text/70">{order.assigned_to}</td>
                                        <td className="p-4 min-w-[220px]">
                                            <progress
                                                className="production-progress-bar"
                                                value={order.progress_percent || 0}
                                                max={100}
                                                aria-label={`Production progress for order ${order.id}`}
                                            />
                                            <p className="text-xs text-text/60 mt-1">{order.progress_percent || 0}%</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLES[order.production_status] || 'bg-white/5 text-text/40 border-white/10'}`}>
                                                {order.production_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-sm text-text/60">
                                            {order.progress_updated_at ? new Date(order.progress_updated_at).toLocaleString() : 'No update yet'}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-text/40">
                                            No production assignments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                    <div
                        className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-[hsl(220,15%,10%)] border-l border-white/10 shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text/40 uppercase tracking-widest font-semibold">Assigned Order</p>
                                <h2 className="text-2xl font-bold text-text mt-0.5">#{selectedOrder.id}</h2>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg hover:bg-white/10 text-text/50 hover:text-text transition-all">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
                                <p className="text-sm text-text/60">Customer</p>
                                <p className="font-semibold text-text">{selectedOrder.customer_name}</p>
                                <p className="text-sm text-text/60 mt-3">Assigned To</p>
                                <p className="font-medium text-text">{selectedOrder.assigned_to}</p>
                                <p className="text-sm text-text/60 mt-3">Current Status</p>
                                <p className="font-medium text-text">{selectedOrder.production_status || 'Pending'}</p>
                                <p className="text-sm text-text/60 mt-3">Latest Note</p>
                                <p className="text-sm text-text/90">{selectedOrder.progress_note || 'No note yet'}</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                <label className="text-sm text-text/70 block">Production Progress (%)</label>
                                <div className="space-y-2">
                                    {PRODUCTION_CHECKLIST.map((step) => (
                                        <label key={step} className="flex items-center gap-3 text-sm text-text/85">
                                            <input
                                                type="checkbox"
                                                checked={checkedSteps.includes(step)}
                                                onChange={() => toggleChecklistStep(step)}
                                                className="h-4 w-4 rounded border-white/20 bg-white/5"
                                            />
                                            <span>{step}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                                    <progress
                                        className="production-progress-bar"
                                        value={progressPercent || 0}
                                        max={100}
                                        aria-label={`Checklist completion for order ${selectedOrder.id}`}
                                    />
                                </div>
                                <p className="text-xs text-text/60">{checkedSteps.length}/{PRODUCTION_CHECKLIST.length} checklist steps completed ({progressPercent}%)</p>

                                <label className="text-sm text-text/70 block mt-3">Progress Note</label>
                                <textarea
                                    value={progressNote}
                                    onChange={(e) => setProgressNote(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text"
                                    placeholder="Describe current production updates"
                                />

                                <p className="text-xs text-text/50">
                                    Submitting production marks this order as ready for QC inspection. Order is completed only after QC Pass.
                                </p>

                                {feedback && (
                                    <p className={`text-xs ${feedback.toLowerCase().includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                                        {feedback}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-white/10 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => saveProgress(false)}
                                disabled={saving}
                                className="py-2.5 text-sm font-semibold rounded-xl border border-white/10 text-text/70 hover:bg-white/5 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Update Progress'}
                            </button>
                            <button
                                onClick={() => saveProgress(true)}
                                disabled={saving || progressPercent < 100}
                                className="py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:opacity-90 transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Submitting...' : 'Submit Progress'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-text/50 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-text mt-1">{value}</p>
        </div>
    );
}

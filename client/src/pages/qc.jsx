import React, { useState, useEffect, useCallback } from 'react';
import './styles/qc.css';

const AQL_LEVELS = ['AQL 0.65', 'AQL 1.0', 'AQL 1.5', 'AQL 2.5', 'AQL 4.0', 'AQL 6.5'];

function useFetch(url) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

export default function QCRegister() {
    const { data: records, loading, error, refetch } = useFetch('/api/qc');
    const { data: requirements, loading: requirementsLoading, error: requirementsError, refetch: refetchRequirements } = useFetch('/api/qc/requirements');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ orderId: '', batchId: '', productDescription: '', aqlLevel: '', result: 'Pass', defectCount: '0', inspectorName: '', notes: '' });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [filterResult, setFilterResult] = useState('All');
    const [orderLookupMsg, setOrderLookupMsg] = useState('');

    const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleOrderLookup = async () => {
        const orderId = String(form.orderId).trim();
        if (!orderId) return;

        setOrderLookupMsg('');
        try {
            const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Order not found');

            setForm(prev => ({
                ...prev,
                orderId: String(data.id),
                batchId: prev.batchId || `BCH-${String(data.id).padStart(4, '0')}A`,
                productDescription: prev.productDescription || `${data.order_type} order for ${data.customer_name} (${data.item_count} items)`,
            }));
            setOrderLookupMsg(`Loaded order #${data.id}: ${data.customer_name}`);
        } catch (err) {
            setOrderLookupMsg(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.orderId.trim()) { setFormError('Order ID is required.'); return; }
        if (!form.batchId.trim()) { setFormError('Batch ID is required.'); return; }
        if (!form.productDescription.trim()) { setFormError('Product description is required.'); return; }
        if (!form.aqlLevel) { setFormError('Please select an AQL level.'); return; }
        if (!form.inspectorName.trim()) { setFormError('Inspector name is required.'); return; }

        setSubmitting(true);
        try {
            const res = await fetch('/api/qc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: String(form.orderId).trim(),
                    batch_id: form.batchId.toUpperCase(),
                    product_description: form.productDescription,
                    aql_level: form.aqlLevel,
                    result: form.result,
                    defect_count: parseInt(form.defectCount, 10) || 0,
                    inspector_name: form.inspectorName,
                    notes: form.notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit');
            if (data.completed_at) {
                const completedAt = new Date(data.completed_at).toLocaleString();
                setSuccessMsg(`Inspection record #${data.id} logged. Order #${data.order_id} marked Completed at ${completedAt}.`);
            } else if (data.order_status === 'In Progress') {
                const startedAt = data.started_at ? new Date(data.started_at).toLocaleString() : 'now';
                setSuccessMsg(`Inspection record #${data.id} logged. Order #${data.order_id} moved to In Progress at ${startedAt}.`);
            } else {
                setSuccessMsg(`Inspection record #${data.id} logged successfully.`);
            }
            setForm({ orderId: '', batchId: '', productDescription: '', aqlLevel: '', result: 'Pass', defectCount: '0', inspectorName: '', notes: '' });
            setOrderLookupMsg('');
            await refetch();
            await refetchRequirements();
            setTimeout(() => { setShowModal(false); setSuccessMsg(''); }, 2000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = filterResult === 'All' ? records : records.filter(r => r.result === filterResult);
    const passCount = records.filter(r => r.result === 'Pass').length;
    const failCount = records.filter(r => r.result === 'Fail').length;
    const passRate = records.length ? Math.round((passCount / records.length) * 100) : 0;

    return (
        <div className="qc-page">
            {/* Header */}
            <div className="qc-header">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">QC Inspection Register</h1>
                    <p className="text-text/60 mt-1">Log and review AQL quality control inspection results for all production orders.</p>
                </div>
                <button id="btn-log-inspection" onClick={() => setShowModal(true)}
                    className="qc-primary-btn">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Log Inspection
                </button>
            </div>

            {/* Summary Cards */}
            <div className="qc-summary-grid">
                {[
                    { label: 'Total Inspections', value: records.length, color: 'text-primary', border: 'border-primary/20' },
                    { label: 'Passed', value: passCount, color: 'text-green-400', border: 'border-green-400/20' },
                    { label: 'Failed', value: failCount, color: 'text-red-400', border: 'border-red-400/20' },
                    { label: 'Pass Rate', value: `${passRate}%`, color: passRate >= 80 ? 'text-green-400' : 'text-yellow-400', border: 'border-white/10' },
                ].map((c, i) => (
                    <div
                        key={i}
                        className={`border ${c.border} rounded-2xl p-5`}
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border-strong)' }}
                    >
                        <p className="text-text/50 text-sm font-medium">{c.label}</p>
                        <p className={`text-3xl font-extrabold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="qc-card mb-8">
                <div className="px-6 py-4 border-b border-white/10 bg-black/20">
                    <h2 className="text-lg font-bold text-text">QC Required Items</h2>
                    <p className="text-text/60 text-sm">Orders submitted from production that still need a QC Pass result.</p>
                </div>
                {requirementsLoading ? (
                    <div className="p-8 text-center text-text/40">Loading QC requirements...</div>
                ) : requirementsError ? (
                    <div className="p-8 text-center text-red-400 text-sm">{requirementsError}</div>
                ) : requirements.length === 0 ? (
                    <div className="p-8 text-center text-green-400 text-sm">All production-submitted orders are already passed in QC.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Order</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Submitted By</th>
                                    <th className="p-4">Submitted At</th>
                                    <th className="p-4 pr-6 text-center">Latest QC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {requirements.map((req) => (
                                    <tr key={req.order_id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-sm text-primary">#{req.order_id}</td>
                                        <td className="p-4 text-sm text-text">{req.customer_name}</td>
                                        <td className="p-4 text-sm text-text/80">{req.order_type} ({req.item_count})</td>
                                        <td className="p-4 text-sm text-text/80">{req.production_submitted_by || req.assigned_to || '-'}</td>
                                        <td className="p-4 text-sm text-text/60">{req.production_submitted_at ? new Date(req.production_submitted_at).toLocaleString() : '-'}</td>
                                        <td className="p-4 pr-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${req.latest_qc_result === 'Fail' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                {req.latest_qc_result || 'Not Inspected'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="qc-filter-row">
                {['All', 'Pass', 'Fail'].map(f => (
                    <button key={f} onClick={() => setFilterResult(f)}
                        className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${filterResult === f ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text/50 hover:text-text hover:bg-white/5'}`}>
                        {f === 'All' ? 'All Records' : f === 'Pass' ? 'Passed' : 'Failed'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="qc-card">
                {loading ? (
                    <div className="p-16 text-center text-text/40 animate-pulse">Loading records from database…</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-400 text-sm">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Record ID</th>
                                    <th className="p-4">Order / Batch</th>
                                    <th className="p-4">Product</th>
                                    <th className="p-4 text-center">AQL Level</th>
                                    <th className="p-4 text-center">Defects</th>
                                    <th className="p-4">Inspector</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 pr-6 text-center">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filtered.map(rec => (
                                    <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-xs text-primary">QC-{String(rec.id).padStart(3, '0')}</td>
                                        <td className="p-4">
                                            <p className="font-medium text-text text-sm">{rec.order_id}</p>
                                            <p className="text-xs text-text/50 mt-0.5">{rec.batch_id}</p>
                                        </td>
                                        <td className="p-4 text-sm text-text/80 max-w-[200px]">{rec.product_description}</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">{rec.aql_level}</span>
                                        </td>
                                        <td className={`p-4 text-center font-bold ${rec.defect_count > 0 ? 'text-red-400' : 'text-green-400'}`}>{rec.defect_count}</td>
                                        <td className="p-4 text-sm text-text/80">{rec.inspector_name}</td>
                                        <td className="p-4 text-sm text-text/60">{new Date(rec.inspected_at).toLocaleDateString()}</td>
                                        <td className="p-4 pr-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${rec.result === 'Pass' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {rec.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-text/40">No records found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Log Inspection Modal */}
            {showModal && (
                <div className="qc-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="qc-modal-panel" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} className="qc-modal-close">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">Log QC Inspection</h2>
                        <p className="text-text/50 text-sm mb-6">Register an AQL inspection result for a production batch.</p>

                        {successMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{successMsg}</div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{formError}</p>}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Order ID *</label>
                                        <div className="flex gap-2">
                                            <input id="qc-order-id" type="number" name="orderId" value={form.orderId} onChange={handleFormChange} onBlur={handleOrderLookup} placeholder="e.g. 1005"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                            <button type="button" onClick={handleOrderLookup}
                                                className="px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm font-semibold text-text hover:bg-white/15 transition-colors whitespace-nowrap">
                                                Auto Fill
                                            </button>
                                        </div>
                                        {orderLookupMsg && <p className="text-xs text-text/60 mt-1">{orderLookupMsg}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Batch ID *</label>
                                        <input id="qc-batch" type="text" name="batchId" value={form.batchId} onChange={handleFormChange} placeholder="e.g. BCH-005A"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Product Description *</label>
                                    <input id="qc-product" type="text" name="productDescription" value={form.productDescription} onChange={handleFormChange} placeholder="e.g. Bespoke Oak Dining Chair (x8)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">AQL Level *</label>
                                        <select id="qc-aql" name="aqlLevel" value={form.aqlLevel} onChange={handleFormChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="">Select AQL…</option>
                                            {AQL_LEVELS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Result *</label>
                                        <select id="qc-result" name="result" value={form.result} onChange={handleFormChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="Pass">Pass</option>
                                            <option value="Fail">Fail</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Defect Count</label>
                                        <input id="qc-defects" type="number" name="defectCount" value={form.defectCount} onChange={handleFormChange} min="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Inspector Name *</label>
                                        <input id="qc-inspector" type="text" name="inspectorName" value={form.inspectorName} onChange={handleFormChange} placeholder="e.g. Somchai W."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Notes / Findings</label>
                                    <textarea id="qc-notes" name="notes" value={form.notes} onChange={handleFormChange} rows={3} placeholder="Describe any defects or observations…"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                                </div>
                                <button id="qc-submit" type="submit" disabled={submitting}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {submitting ? 'Submitting…' : 'Submit Inspection Record'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';

const FURNITURE_TYPES = ['Chair', 'Table', 'Desk', 'Bed', 'Sofa', 'Bookshelf', 'Cabinet', 'Wardrobe'];
const FINISH_OPTIONS = ['Natural Oak', 'Walnut Stain', 'Ebony', 'White Lacquer', 'Teak Oil', 'Matte Black', 'Antique Brass', 'Raw Steel'];
const SPECIAL_OPTIONS = ['High-Density Foam Cushioning', 'Contrast Stitching', 'Metal Inlay', 'Glass Inserts', 'LED Accent Strip', 'Anti-Scratch Coating'];

export default function Construct() {
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        furnitureType: '',
        primaryFinish: '',
        secondaryFinish: '',
        extraFinish: false,
        specialFinishes: [],
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchSubmissions = useCallback(async () => {
        setLoadingSubs(true);
        try {
            const res = await fetch('/api/constructions');
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            setSubmissions(await res.json());
        } catch (_) {
            // fail silently — show empty state
        } finally {
            setLoadingSubs(false);
        }
    }, []);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'specialFinishes') {
            setForm(prev => ({
                ...prev,
                specialFinishes: checked
                    ? [...prev.specialFinishes, value]
                    : prev.specialFinishes.filter(f => f !== value),
            }));
        } else if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: checked }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.furnitureType) { setFormError('Please select a furniture type.'); return; }
        if (!form.primaryFinish) { setFormError('Primary finish is required.'); return; }

        setSubmitting(true);
        try {
            const res = await fetch('/api/constructions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    furniture_type: form.furnitureType,
                    primary_finish: form.primaryFinish,
                    secondary_finish: form.secondaryFinish,
                    extra_finish: form.extraFinish,
                    special_finishes: form.specialFinishes,
                    image_url: '',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit');
            setSuccessMsg(`Design Spec #${data.id} submitted successfully.`);
            setForm({ furnitureType: '', primaryFinish: '', secondaryFinish: '', extraFinish: false, specialFinishes: [] });
            await fetchSubmissions();
            setTimeout(() => { setShowForm(false); setSuccessMsg(''); }, 2500);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Design Specifications</h1>
                    <p className="text-text/60 mt-1">Submit furniture construction specs — finish choices, special treatments, and material notes.</p>
                </div>
                <button id="btn-new-spec" onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Spec
                </button>
            </div>

            {/* Submissions Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                {loadingSubs ? (
                    <div className="p-16 text-center text-text/40 animate-pulse">Loading design specs…</div>
                ) : submissions.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-text/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-text/40 text-sm">No design specifications yet.</p>
                        <button onClick={() => setShowForm(true)} className="mt-4 text-primary text-sm hover:underline">Submit your first spec →</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Spec #</th>
                                    <th className="p-4">Furniture Type</th>
                                    <th className="p-4">Primary Finish</th>
                                    <th className="p-4">Secondary Finish</th>
                                    <th className="p-4">Special Finishes</th>
                                    <th className="p-4 pr-6">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {submissions.map(spec => {
                                    let specials = [];
                                    try { specials = JSON.parse(spec.special_finishes || '[]'); } catch (_) {}
                                    return (
                                        <tr key={spec.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-xs text-primary">SPEC-{String(spec.id).padStart(3, '0')}</td>
                                            <td className="p-4 font-semibold text-text">{spec.furniture_type}</td>
                                            <td className="p-4 text-sm text-text/80">{spec.primary_finish}</td>
                                            <td className="p-4 text-sm text-text/60">{spec.secondary_finish || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {specials.length > 0 ? specials.map(s => (
                                                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{s}</span>
                                                    )) : <span className="text-text/30 text-xs">—</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-sm text-text/50">{new Date(spec.request_date).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Spec Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
                    <div className="bg-[hsl(220,15%,12%)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">New Design Specification</h2>
                        <p className="text-text/50 text-sm mb-6">Define the furniture type, finish options, and any special treatments for this production request.</p>

                        {successMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{successMsg}</div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{formError}</p>}

                                {/* Furniture Type */}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1.5 block">Furniture Type *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {FURNITURE_TYPES.map(type => (
                                            <button key={type} type="button"
                                                onClick={() => setForm(p => ({ ...p, furnitureType: type }))}
                                                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${form.furnitureType === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-white/5 text-text/70 border-white/10 hover:border-primary/40 hover:text-text'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Finishes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1.5 block">Primary Finish *</label>
                                        <select id="construct-primary" name="primaryFinish" value={form.primaryFinish} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="">Select finish…</option>
                                            {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1.5 block">Secondary Finish</label>
                                        <select id="construct-secondary" name="secondaryFinish" value={form.secondaryFinish} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="">None</option>
                                            {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Extra Finish toggle */}
                                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <input type="checkbox" id="construct-extra" name="extraFinish" checked={form.extraFinish} onChange={handleChange}
                                        className="w-4 h-4 accent-primary cursor-pointer" />
                                    <div>
                                        <label htmlFor="construct-extra" className="text-sm font-medium text-text cursor-pointer">Requires Extra Finish Treatment</label>
                                        <p className="text-xs text-text/40 mt-0.5">Select if this piece needs additional process steps beyond standard finishing.</p>
                                    </div>
                                </div>

                                {/* Special Finishes */}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-2 block">Special Finishes</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {SPECIAL_OPTIONS.map(opt => (
                                            <label key={opt} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${form.specialFinishes.includes(opt) ? 'bg-primary/10 border-primary/30 text-text' : 'bg-white/5 border-white/10 text-text/60 hover:border-white/30'}`}>
                                                <input type="checkbox" name="specialFinishes" value={opt} checked={form.specialFinishes.includes(opt)} onChange={handleChange}
                                                    className="w-4 h-4 accent-primary" />
                                                <span className="text-xs font-medium">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button id="construct-submit" type="submit" disabled={submitting}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60">
                                    {submitting ? 'Submitting…' : 'Submit Design Spec'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
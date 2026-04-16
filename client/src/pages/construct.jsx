import React, { useState, useEffect, useCallback } from 'react';
import './styles/construct.css';

const DESIGN_MODES = ['OEM', 'ODM', 'Bespoke'];
const FURNITURE_TYPES = ['Chair', 'Table', 'Desk', 'Bed', 'Sofa', 'Bookshelf', 'Cabinet', 'Wardrobe'];
const FINISH_OPTIONS = ['Natural Oak', 'Walnut Stain', 'Ebony', 'White Lacquer', 'Teak Oil', 'Matte Black', 'Antique Brass', 'Raw Steel'];
const SPECIAL_OPTIONS_BY_MODE = {
    OEM: ['Mass production jig required', 'Retail-ready packaging', 'Barcode and SKU labeling', 'Knock-down assembly instructions'],
    ODM: ['Prototype variant requested', 'Private-label logo area', 'Catalog customization', 'Market-specific compliance'],
    Bespoke: ['Hand-carved detailing', 'Custom dimensions', 'Family crest engraving', 'Premium upholstery selection'],
};

const MODE_HINT = {
    OEM: 'Use this for standardized products manufactured to customer brand requirements.',
    ODM: 'Use this for your own design adapted for a customer segment or private label.',
    Bespoke: 'Use this for fully custom furniture based on individual customer desires.',
};

export default function Construct() {
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        designMode: 'OEM',
        furnitureType: '',
        primaryFinish: '',
        secondaryFinish: '',
        referenceCode: '',
        customerRequirements: '',
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

    const handleDesignModeChange = (designMode) => {
        setForm(prev => ({
            ...prev,
            designMode,
            specialFinishes: [],
        }));
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
                    design_mode: form.designMode,
                    furniture_type: form.furnitureType,
                    primary_finish: form.primaryFinish,
                    secondary_finish: form.secondaryFinish,
                    reference_code: form.referenceCode,
                    customer_requirements: form.customerRequirements,
                    extra_finish: form.extraFinish,
                    special_finishes: form.specialFinishes,
                    image_url: '',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit');
            setSuccessMsg(`Design Spec #${data.id} submitted successfully.`);
            setForm({
                designMode: 'OEM',
                furnitureType: '',
                primaryFinish: '',
                secondaryFinish: '',
                referenceCode: '',
                customerRequirements: '',
                extraFinish: false,
                specialFinishes: [],
            });
            await fetchSubmissions();
            setTimeout(() => { setShowForm(false); setSuccessMsg(''); }, 2500);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="construct-page">
            {/* Header */}
            <div className="construct-header">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Design Specifications</h1>
                    <p className="text-text/60 mt-1">Submit furniture construction specs — finish choices, special treatments, and material notes.</p>
                </div>
                <button id="btn-new-spec" onClick={() => setShowForm(true)}
                    className="construct-new-btn">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Spec
                </button>
            </div>

            {/* Submissions Table */}
            <div className="construct-card">
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
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Furniture Type</th>
                                    <th className="p-4">Ref</th>
                                    <th className="p-4">Primary Finish</th>
                                    <th className="p-4">Secondary Finish</th>
                                    <th className="p-4">Special Finishes</th>
                                    <th className="p-4">Customer Requirements</th>
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
                                            <td className="p-4">
                                                <span className="px-2 py-0.5 rounded text-xs border border-white/15 bg-white/5 text-text/80">{spec.design_mode || 'OEM'}</span>
                                            </td>
                                            <td className="p-4 font-semibold text-text">{spec.furniture_type}</td>
                                            <td className="p-4 text-xs font-mono text-text/60">{spec.reference_code || '—'}</td>
                                            <td className="p-4 text-sm text-text/80">{spec.primary_finish}</td>
                                            <td className="p-4 text-sm text-text/60">{spec.secondary_finish || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {specials.length > 0 ? specials.map(s => (
                                                        <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20">{s}</span>
                                                    )) : <span className="text-text/30 text-xs">—</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-text/65 max-w-[280px] truncate" title={spec.customer_requirements || ''}>
                                                {spec.customer_requirements || '—'}
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
                <div className="construct-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="construct-modal-panel" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowForm(false)} className="construct-modal-close">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">New Design Specification</h2>
                        <p className="text-text/50 text-sm mb-6">Define the furniture type, finish options, and any special treatments for this production request.</p>

                        {successMsg ? (
                            <div className="construct-success-box">{successMsg}</div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {formError && <p className="construct-form-error">{formError}</p>}

                                <div>
                                    <label className="construct-label">Specification Type *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DESIGN_MODES.map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => handleDesignModeChange(mode)}
                                                className={`construct-choice-btn ${form.designMode === mode ? 'construct-choice-btn-active' : 'construct-choice-btn-idle'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-text/45 mt-2">{MODE_HINT[form.designMode]}</p>
                                </div>

                                {/* Furniture Type */}
                                <div>
                                    <label className="construct-label">Furniture Type *</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {FURNITURE_TYPES.map(type => (
                                            <button key={type} type="button"
                                                onClick={() => setForm(p => ({ ...p, furnitureType: type }))}
                                                className={`construct-choice-btn ${form.furnitureType === type ? 'construct-choice-btn-active' : 'construct-choice-btn-idle'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Finishes */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="construct-label">Primary Finish *</label>
                                        <select id="construct-primary" name="primaryFinish" value={form.primaryFinish} onChange={handleChange}
                                            className="construct-field">
                                            <option value="">Select finish…</option>
                                            {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="construct-label">Secondary Finish</label>
                                        <select id="construct-secondary" name="secondaryFinish" value={form.secondaryFinish} onChange={handleChange}
                                            className="construct-field">
                                            <option value="">None</option>
                                            {FINISH_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="construct-label">Customer Ref / SKU</label>
                                        <input
                                            type="text"
                                            name="referenceCode"
                                            value={form.referenceCode}
                                            onChange={handleChange}
                                            placeholder={form.designMode === 'Bespoke' ? 'e.g. CUST-JANE-01' : 'e.g. OEM-CHAIR-220'}
                                            className="construct-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="construct-label">Extra Finish Process</label>
                                        <div className="construct-checkbox-row">
                                            <input type="checkbox" id="construct-extra" name="extraFinish" checked={form.extraFinish} onChange={handleChange}
                                                className="w-4 h-4 accent-primary cursor-pointer" />
                                            <label htmlFor="construct-extra" className="text-sm text-text/80 cursor-pointer">Enable</label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="construct-label">Customer Requirements</label>
                                    <textarea
                                        name="customerRequirements"
                                        value={form.customerRequirements}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder={form.designMode === 'Bespoke' ? 'Describe custom dimensions, style references, comfort preference, engraving, etc.' : 'Describe brand guidelines, packaging, compliance, or production constraints.'}
                                        className="construct-field"
                                    />
                                </div>

                                {/* Special Finishes */}
                                <div>
                                    <label className="construct-label">Special Requirements</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(SPECIAL_OPTIONS_BY_MODE[form.designMode] || []).map(opt => (
                                            <label key={opt} className={`construct-special-option ${form.specialFinishes.includes(opt) ? 'construct-special-option-active' : 'construct-special-option-idle'}`}>
                                                <input type="checkbox" name="specialFinishes" value={opt} checked={form.specialFinishes.includes(opt)} onChange={handleChange}
                                                    className="w-4 h-4 accent-primary" />
                                                <span className="text-xs font-medium">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button id="construct-submit" type="submit" disabled={submitting}
                                    className="construct-submit-btn">
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
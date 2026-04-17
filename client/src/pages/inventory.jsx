import React, { useState, useEffect, useCallback } from 'react';
import './styles/inventory.css';

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
            setData(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { fetchData(); }, [fetchData]);
    return { data, loading, error, refetch: fetchData };
}

export default function Inventory() {
    const { data: materials, loading: matLoading, error: matError, refetch: refetchMats } = useFetch('/api/inventory/materials');
    const { data: reservations, loading: resLoading, error: resError, refetch: refetchRes } = useFetch('/api/inventory/reservations');
    const { data: orders } = useFetch('/api/orders');

    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [activeTab, setActiveTab] = useState('stock');
    const [form, setForm] = useState({ materialId: '', quantity: '', orderId: '', purpose: '', reservedBy: '' });
    const [addForm, setAddForm] = useState({ materialName: '', unit: 'units', totalQty: '', unitCost: '', location: 'Warehouse A', usableForFinishing: false });
    const [restockForm, setRestockForm] = useState({ materialId: '', addedQty: '', unitCost: '' });
    const [formError, setFormError] = useState('');
    const [addError, setAddError] = useState('');
    const [restockError, setRestockError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [adding, setAdding] = useState(false);
    const [restocking, setRestocking] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [addSuccessMsg, setAddSuccessMsg] = useState('');
    const [restockSuccessMsg, setRestockSuccessMsg] = useState('');

    const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleAddFormChange = (e) => {
        const { name, type, checked, value } = e.target;
        setAddForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const handleRestockFormChange = (e) => setRestockForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleReserve = async (e) => {
        e.preventDefault();
        setFormError('');
        const qty = parseInt(form.quantity, 10);
        const mat = materials.find(m => m.id === parseInt(form.materialId, 10));

        if (!mat) { setFormError('Please select a material.'); return; }
        if (!qty || qty <= 0) { setFormError('Enter a valid quantity.'); return; }
        if (!form.orderId.trim()) { setFormError('Order ID is required.'); return; }
        if (!form.reservedBy.trim()) { setFormError('Reserved By is required.'); return; }

        setSubmitting(true);
        try {
            const res = await fetch('/api/inventory/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_id: mat.id,
                    order_id: form.orderId,
                    reserved_qty: qty,
                    purpose: form.purpose,
                    reserved_by: form.reservedBy,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to reserve');
            setSuccessMsg(`Reserved ${qty} ${mat.unit} of ${mat.material_name} for order #${form.orderId}.`);
            setForm({ materialId: '', quantity: '', orderId: '', purpose: '', reservedBy: '' });
            await Promise.all([refetchMats(), refetchRes()]);
            setTimeout(() => { setShowModal(false); setSuccessMsg(''); }, 2000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        setAddError('');
        const totalQty = parseInt(addForm.totalQty, 10);
        const unitCost = parseFloat(addForm.unitCost);

        if (!addForm.materialName.trim()) { setAddError('Material name is required.'); return; }
        if (isNaN(totalQty) || totalQty < 0) { setAddError('Enter a valid total quantity (0 or more).'); return; }
        if (totalQty > 0 && (isNaN(unitCost) || unitCost <= 0)) { setAddError('Enter a valid unit cost greater than 0.'); return; }

        setAdding(true);
        try {
            const res = await fetch('/api/inventory/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_name: addForm.materialName,
                    unit: addForm.unit,
                    total_qty: totalQty,
                    unit_cost: totalQty > 0 ? unitCost : 0,
                    usable_for_finishing: addForm.usableForFinishing,
                    location: addForm.location,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add material');

            setAddSuccessMsg(`Material #${data.id} added successfully.`);
            setAddForm({ materialName: '', unit: 'units', totalQty: '', unitCost: '', location: 'Warehouse A', usableForFinishing: false });
            await refetchMats();
            setTimeout(() => { setShowAddModal(false); setAddSuccessMsg(''); }, 1800);
        } catch (err) {
            setAddError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRestock = async (e) => {
        e.preventDefault();
        setRestockError('');
        const matId = parseInt(restockForm.materialId, 10);
        const qty = parseInt(restockForm.addedQty, 10);
        const unitCost = parseFloat(restockForm.unitCost);

        if (!matId) { setRestockError('Please select a material.'); return; }
        if (!qty || qty <= 0) { setRestockError('Added quantity must be greater than 0.'); return; }
        if (isNaN(unitCost) || unitCost <= 0) { setRestockError('Unit cost must be greater than 0.'); return; }

        setRestocking(true);
        try {
            const res = await fetch('/api/inventory/materials', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material_id: matId,
                    added_qty: qty,
                    unit_cost: unitCost,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to restock material');

            setRestockSuccessMsg(`Added ${qty} units to material #${matId}.`);
            setRestockForm({ materialId: '', addedQty: '', unitCost: '' });
            await refetchMats();
            setTimeout(() => { setShowRestockModal(false); setRestockSuccessMsg(''); }, 1800);
        } catch (err) {
            setRestockError(err.message);
        } finally {
            setRestocking(false);
        }
    };

    const getUtilizationClass = (mat) => {
        const denominator = mat.total_qty;
        const pct = denominator > 0 ? (mat.reserved_qty / denominator) * 100 : 0;
        if (pct >= 80) return 'inventory-utilization-high';
        if (pct >= 50) return 'inventory-utilization-medium';
        return 'inventory-utilization-low';
    };

    const totalReserved = reservations
        .filter(r => r.status === 'Active')
        .reduce((sum, r) => sum + Number(r.reserved_qty || 0), 0);
    const activeRes = reservations.filter(r => r.status === 'Active').length;
    const lowStock = materials.filter(m => m.total_qty < 20).length;
    const loading = matLoading || resLoading;

    return (
        <div className="p-6 sm:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Inventory & Material Reservation</h1>
                    <p className="text-text/60 mt-1">Monitor raw material stock and reserve materials for bespoke production orders.</p>
                </div>
                <button id="btn-reserve-material" onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Reserve Material
                </button>
                <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-text border border-white/15 rounded-xl font-semibold hover:bg-white/15 transition-colors">
                        Add Material
                    </button>
                    <button onClick={() => setShowRestockModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-text border border-white/15 rounded-xl font-semibold hover:bg-white/15 transition-colors">
                        Restock
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Materials', value: materials.length, color: 'text-primary', border: 'border-primary/20' },
                    { label: 'Total Reserved', value: totalReserved, color: 'text-yellow-400', border: 'border-yellow-400/20' },
                    { label: 'Active Reservations', value: activeRes, color: 'text-blue-400', border: 'border-blue-400/20' },
                    { label: 'Low Stock Alerts', value: lowStock, color: 'text-red-400', border: 'border-red-400/20' },
                ].map((c, i) => (
                    <div key={i} className={`bg-white/5 border ${c.border} rounded-2xl p-5`}>
                        <p className="text-text/50 text-sm font-medium">{c.label}</p>
                        <p className={`text-3xl font-extrabold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[['stock', 'Material Stock'], ['reservations', 'Reservations']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text/50 hover:text-text hover:bg-white/5'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-text/40 animate-pulse">Loading data from database…</div>
                ) : (matError || resError) ? (
                    <div className="p-10 text-center text-red-400 text-sm">{matError || resError}</div>
                ) : activeTab === 'stock' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">ID</th>
                                    <th className="p-4">Material Name</th>
                                    <th className="p-4">Finishing Tag</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4 text-center">Total</th>
                                    <th className="p-4 text-center">Reserved</th>
                                    <th className="p-4 text-center">Available</th>
                                    <th className="p-4 pr-6">Utilization</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {materials.map(mat => {
                                    const available = Math.max(Number(mat.total_qty || 0) - Number(mat.reserved_qty || 0), 0);
                                    const denominator = Number(mat.total_qty || 0);
                                    const pct = denominator > 0 ? Math.round((mat.reserved_qty / denominator) * 100) : 0;
                                    return (
                                        <tr key={mat.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-xs text-text/50">#{mat.id}</td>
                                            <td className="p-4 font-semibold text-text">{mat.material_name}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${mat.usable_for_finishing ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-text/40 border-white/10'}`}>
                                                    {mat.usable_for_finishing ? 'Usable for finishing' : 'Not usable'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-text/70">{mat.location}</td>
                                            <td className="p-4 text-center text-text/80">{mat.total_qty} <span className="text-xs text-text/40">{mat.unit}</span></td>
                                            <td className="p-4 text-center text-yellow-400 font-medium">{mat.reserved_qty}</td>
                                            <td className={`p-4 text-center font-bold ${available < 20 ? 'text-red-400' : 'text-green-400'}`}>{available}</td>
                                            <td className="p-4 pr-6">
                                                <div className="flex items-center gap-3">
                                                    <progress
                                                        className={`inventory-utilization-bar ${getUtilizationClass(mat)}`}
                                                        value={pct}
                                                        max={100}
                                                        aria-label={`Utilization for ${mat.material_name}`}
                                                    />
                                                    <span className="text-xs text-text/50 w-8 text-right">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Res. #</th>
                                    <th className="p-4">Material</th>
                                    <th className="p-4 text-center">Qty</th>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Purpose</th>
                                    <th className="p-4">Reserved By</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 pr-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {reservations.map(res => (
                                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-xs text-primary">#{res.id}</td>
                                        <td className="p-4 text-text font-medium">{res.material_name}</td>
                                        <td className="p-4 text-center text-text/80">{res.reserved_qty}</td>
                                        <td className="p-4 font-mono text-xs text-text/70">{res.order_id}</td>
                                        <td className="p-4 text-sm text-text/70">{res.purpose || '—'}</td>
                                        <td className="p-4 text-sm text-text/80">{res.reserved_by}</td>
                                        <td className="p-4 text-sm text-text/60">{new Date(res.reserved_at).toLocaleDateString()}</td>
                                        <td className="p-4 pr-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${res.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-text/40 border-white/10'}`}>
                                                {res.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {reservations.length === 0 && (
                                    <tr><td colSpan={8} className="p-12 text-center text-text/40">No reservations yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reserve Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-[hsl(220,15%,12%)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">Reserve Material</h2>
                        <p className="text-text/50 text-sm mb-6">Allocate materials to a specific bespoke production order.</p>

                        {successMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{successMsg}</div>
                        ) : (
                            <form onSubmit={handleReserve} className="space-y-4">
                                {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{formError}</p>}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Material *</label>
                                    <select id="inv-material" name="materialId" value={form.materialId} onChange={handleFormChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="">Select material…</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.material_name} ({Math.max(Number(m.total_qty || 0) - Number(m.reserved_qty || 0), 0)} {m.unit} available)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Quantity *</label>
                                        <input id="inv-quantity" type="number" name="quantity" value={form.quantity} onChange={handleFormChange} min="1" placeholder="e.g. 10"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Order ID *</label>
                                        <select id="inv-order-id" name="orderId" value={form.orderId} onChange={handleFormChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                            <option value="">Select order...</option>
                                            {(Array.isArray(orders) ? orders : []).map(order => (
                                                <option key={order.id} value={order.id}>
                                                    #{order.id} - {order.customer_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Purpose / Notes</label>
                                    <input id="inv-purpose" type="text" name="purpose" value={form.purpose} onChange={handleFormChange} placeholder="e.g. Bespoke dining table legs"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Reserved By *</label>
                                    <input id="inv-reserved-by" type="text" name="reservedBy" value={form.reservedBy} onChange={handleFormChange} placeholder="Staff name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <button id="inv-submit" type="submit" disabled={submitting}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {submitting ? 'Reserving…' : 'Confirm Reservation'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Add Material Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[hsl(220,15%,12%)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">Add New Material</h2>
                        <p className="text-text/50 text-sm mb-6">Create a new inventory material entry.</p>

                        {addSuccessMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{addSuccessMsg}</div>
                        ) : (
                            <form onSubmit={handleAddMaterial} className="space-y-4">
                                {addError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{addError}</p>}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Material Name *</label>
                                    <input type="text" name="materialName" value={addForm.materialName} onChange={handleAddFormChange} placeholder="e.g. Walnut Wood Planks"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Unit</label>
                                        <input type="text" name="unit" value={addForm.unit} onChange={handleAddFormChange} placeholder="units"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Total Qty *</label>
                                        <input type="number" name="totalQty" value={addForm.totalQty} onChange={handleAddFormChange} min="0" placeholder="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Unit Cost</label>
                                    <input type="number" step="0.01" name="unitCost" value={addForm.unitCost} onChange={handleAddFormChange} min="0" placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    <p className="text-xs text-text/45 mt-1">Required when Total Qty is greater than 0 for finance expense tracking.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Location</label>
                                    <input type="text" name="location" value={addForm.location} onChange={handleAddFormChange} placeholder="Warehouse A"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                    <input
                                        id="usableForFinishing"
                                        type="checkbox"
                                        name="usableForFinishing"
                                        checked={addForm.usableForFinishing}
                                        onChange={handleAddFormChange}
                                        className="w-4 h-4 accent-primary cursor-pointer"
                                    />
                                    <div>
                                        <label className="text-sm font-medium text-text/80 cursor-pointer" htmlFor="usableForFinishing">Usable for finishing</label>
                                        <p className="text-xs text-text/45">Shows this material in design specification finish dropdowns.</p>
                                    </div>
                                </div>
                                <button type="submit" disabled={adding}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {adding ? 'Adding…' : 'Add Material'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {showRestockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRestockModal(false)}>
                    <div className="bg-[hsl(220,15%,12%)] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowRestockModal(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">Restock Material</h2>
                        <p className="text-text/50 text-sm mb-6">Increase the total quantity of an existing material.</p>

                        {restockSuccessMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{restockSuccessMsg}</div>
                        ) : (
                            <form onSubmit={handleRestock} className="space-y-4">
                                {restockError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{restockError}</p>}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Material *</label>
                                    <select name="materialId" value={restockForm.materialId} onChange={handleRestockFormChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="">Select material…</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.material_name} (current: {m.total_qty} {m.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Added Quantity *</label>
                                    <input type="number" name="addedQty" value={restockForm.addedQty} onChange={handleRestockFormChange} min="1" placeholder="e.g. 50"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Unit Cost *</label>
                                    <input type="number" step="0.01" name="unitCost" value={restockForm.unitCost} onChange={handleRestockFormChange} min="0" placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <button type="submit" disabled={restocking}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                                    {restocking ? 'Restocking…' : 'Confirm Restock'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

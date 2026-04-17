import React, { useState, useEffect, useCallback } from 'react';
import './styles/orderdetail.css';

const STATUS_STYLES = {
    'Completed':   'bg-green-500/10 text-green-400 border-green-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Pending':     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Cancelled':   'bg-red-500/10 text-red-400 border-red-500/20',
};

const ORDER_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const TYPE_STYLES = {
    'OEM':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'ODM':     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Bespoke': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const TYPE_DESC = {
    'OEM': 'Original Equipment Manufacturer — Produced under the client\'s brand.',
    'ODM': 'Original Design Manufacturer — BoonSunClon\'s own design for client.',
    'Bespoke': 'Custom-made order tailored to the specific client\'s requirements.',
};

export default function OrderDetail() {
    const [orders, setOrders] = useState([]);
    const [constructions, setConstructions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [draftStatus, setDraftStatus] = useState('Pending');
    const [statusSaving, setStatusSaving] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [orderMaterials, setOrderMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [materialsError, setMaterialsError] = useState('');

    // New Order Modal state
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerName: '', orderType: 'OEM', constructionId: '', unitPrice: '', itemCount: '1' });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/orders');
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            setOrders(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    useEffect(() => {
        let cancelled = false;

        async function fetchConstructions() {
            try {
                const res = await fetch('/api/constructions');
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                if (!cancelled) {
                    setConstructions(Array.isArray(data) ? data : []);
                }
            } catch (_) {
                if (!cancelled) {
                    setConstructions([]);
                }
            }
        }

        fetchConstructions();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        setStatusError('');
        setStatusMsg('');
        if (selectedOrder?.status) {
            setDraftStatus(selectedOrder.status);
        }
    }, [selectedOrder?.id]);

    useEffect(() => {
        let cancelled = false;

        async function fetchOrderMaterials() {
            if (!selectedOrder?.id) {
                setOrderMaterials([]);
                setMaterialsError('');
                return;
            }

            setMaterialsLoading(true);
            setMaterialsError('');
            try {
                const res = await fetch(`/api/inventory/reservations?order_id=${encodeURIComponent(selectedOrder.id)}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load linked materials');
                if (!cancelled) {
                    setOrderMaterials(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setMaterialsError(err.message || 'Failed to load linked materials');
                }
            } finally {
                if (!cancelled) {
                    setMaterialsLoading(false);
                }
            }
        }

        fetchOrderMaterials();
        return () => { cancelled = true; };
    }, [selectedOrder?.id]);

    const handleFormChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const filteredConstructions = constructions.filter(
        (spec) => (spec.design_mode || 'OEM') === form.orderType
    );

    useEffect(() => {
        if (!form.constructionId) return;
        const selectedId = Number(form.constructionId);
        const isValidForType = filteredConstructions.some(spec => Number(spec.id) === selectedId);
        if (!isValidForType) {
            setForm(prev => ({ ...prev, constructionId: '' }));
        }
    }, [form.orderType, form.constructionId, filteredConstructions]);

    const itemCountValue = parseInt(form.itemCount, 10);
    const unitPriceValue = parseFloat(form.unitPrice);
    const calculatedTotal =
        !Number.isNaN(itemCountValue) && itemCountValue > 0 && !Number.isNaN(unitPriceValue) && unitPriceValue >= 0
            ? itemCountValue * unitPriceValue
            : 0;

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.customerName.trim()) { setFormError('Customer name is required.'); return; }
        const constructionId = parseInt(form.constructionId, 10);
        if (Number.isNaN(constructionId) || constructionId <= 0) {
            setFormError('Design specification is required.');
            return;
        }
        const count = parseInt(form.itemCount, 10);
        if (Number.isNaN(count) || count <= 0) { setFormError('Item count must be greater than 0.'); return; }
        const unitPrice = parseFloat(form.unitPrice);
        if (Number.isNaN(unitPrice) || unitPrice < 0) { setFormError('Enter a valid unit price.'); return; }

        setSubmitting(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: form.customerName,
                    order_type: form.orderType,
                    construction_id: constructionId,
                    unit_price: unitPrice,
                    item_count: count,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');
            setSuccessMsg(`Order #${data.id} created successfully.`);
            setForm({ customerName: '', orderType: 'OEM', constructionId: '', unitPrice: '', itemCount: '1' });
            await fetchOrders();
            setTimeout(() => { setShowModal(false); setSuccessMsg(''); }, 2000);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Filtering + pagination
    const filtered = orders.filter(o =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

    const handleStatusUpdate = async () => {
        if (!selectedOrder) return;

        setStatusSaving(true);
        setStatusError('');
        setStatusMsg('');

        try {
            const res = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedOrder.id,
                    status: draftStatus,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update order status');

            setOrders(prev => prev.map(order =>
                order.id === selectedOrder.id ? {
                    ...order,
                    status: draftStatus,
                    started_at: data.started_at || order.started_at,
                    completed_at: data.completed_at || order.completed_at,
                } : order
            ));
            setSelectedOrder(prev => prev ? {
                ...prev,
                status: draftStatus,
                started_at: data.started_at || prev.started_at,
                completed_at: data.completed_at || prev.completed_at,
            } : prev);
            setStatusMsg('Order status updated successfully.');
        } catch (err) {
            setStatusError(err.message);
        } finally {
            setStatusSaving(false);
        }
    };

    return (
        <div className="orderdetail-page">
            {/* Header */}
            <div className="orderdetail-header">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Order Management</h1>
                    <p className="text-text/60 mt-1">Review and manage all OEM, ODM, and Bespoke furniture orders.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="orderdetail-search-wrap">
                        <input type="text" placeholder="Search orders…" value={search} onChange={handleSearch}
                            className="bg-transparent border-none text-sm px-4 py-2 text-text placeholder:text-text/40 focus:outline-none w-48" />
                        <span className="px-3 text-text/40">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                    </div>
                    <button id="btn-new-order" onClick={() => setShowModal(true)}
                        className="orderdetail-primary-btn">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Order
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="orderdetail-card">
                {loading ? (
                    <div className="p-16 text-center text-text/40 animate-pulse">Loading orders from database…</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-400 text-sm">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Order ID</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-center">Items</th>
                                    <th className="p-4 text-right">Unit Price</th>
                                    <th className="p-4 text-right">Total Amount</th>
                                    <th className="p-4 pr-6 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {paginated.map(order => (
                                    <tr key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer">
                                        <td className="p-4 pl-6 font-mono text-sm font-medium text-text/80 group-hover:text-primary transition-colors">
                                            #{order.id}
                                        </td>
                                        <td className="p-4 font-semibold text-text">{order.customer_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${TYPE_STYLES[order.order_type] || 'bg-white/5 text-text/40 border-white/10'}`}>
                                                {order.order_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-text/70 text-sm">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-4 text-center font-medium text-text/90">{order.item_count}</td>
                                        <td className="p-4 text-right text-text/90">${Number(order.unit_price || 0).toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-text">${Number(order.total_amount).toFixed(2)}</td>
                                        <td className="p-4 pr-6">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLES[order.status] || 'bg-white/5 text-text/40 border-white/10'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr><td colSpan={8} className="p-12 text-center text-text/40">No orders found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="orderdetail-pagination">
                    <div className="flex items-center gap-4">
                        <span>
                            Showing <b className="text-text">{filtered.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}</b>–
                            <b className="text-text">{Math.min(safePage * itemsPerPage, filtered.length)}</b> of{' '}
                            <b className="text-text">{filtered.length}</b> orders
                        </span>
                        <label className="flex items-center gap-2">
                            <span className="text-text/50">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                {[5, 10, 20, 50].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-1 border border-white/10 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                className={`px-3 py-1 border rounded-md transition-colors ${safePage === p ? 'bg-primary border-primary text-white' : 'border-white/10 hover:bg-white/10'}`}>
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-3 py-1 border border-white/10 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Order Detail Slide-Over Panel ── */}
            {selectedOrder && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    {/* Panel */}
                    <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-[hsl(220,15%,10%)] border-l border-white/10 shadow-2xl flex flex-col orderdetail-slide-in">
                        {/* Panel header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-text/40 uppercase tracking-widest font-semibold">Order Details</p>
                                <h2 className="text-2xl font-bold text-text mt-0.5">#{selectedOrder.id}</h2>
                            </div>
                            <button onClick={() => setSelectedOrder(null)}
                                className="p-2 rounded-lg hover:bg-white/10 text-text/50 hover:text-text transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Panel Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Status + Type badges */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLES[selectedOrder.status]}`}>
                                    {selectedOrder.status}
                                </span>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${TYPE_STYLES[selectedOrder.order_type]}`}>
                                    {selectedOrder.order_type}
                                </span>
                            </div>

                            {/* Status editor */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                <p className="text-xs font-bold text-text/40 uppercase tracking-widest">Update Status</p>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={draftStatus}
                                        onChange={(e) => setDraftStatus(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        {ORDER_STATUSES.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleStatusUpdate}
                                        disabled={statusSaving || draftStatus === selectedOrder.status}
                                        className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                                    >
                                        {statusSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                                {statusError && <p className="text-xs text-red-400">{statusError}</p>}
                                {statusMsg && <p className="text-xs text-green-400">{statusMsg}</p>}
                            </div>

                            {/* Key Info */}
                            <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
                                {[
                                    { label: 'Customer', value: selectedOrder.customer_name },
                                    { label: 'Design Spec', value: selectedOrder.construction_id ? `#${selectedOrder.construction_id}` : 'Not linked' },
                                    { label: 'Spec Type', value: selectedOrder.design_mode || '—' },
                                    { label: 'Customer Ref', value: selectedOrder.reference_code || '—' },
                                    { label: 'Furniture Type', value: selectedOrder.furniture_type || '—' },
                                    { label: 'Primary Finish', value: selectedOrder.primary_finish || '—' },
                                    { label: 'Customer Requirements', value: selectedOrder.customer_requirements || '—' },
                                    { label: 'Order Date', value: new Date(selectedOrder.order_date).toLocaleString() },
                                    { label: 'Item Count', value: `${selectedOrder.item_count} unit${selectedOrder.item_count !== 1 ? 's' : ''}` },
                                        { label: 'Unit Price', value: `$${Number(selectedOrder.unit_price || 0).toFixed(2)}` },
                                    { label: 'Production Staff', value: selectedOrder.production_assigned_to || 'Not assigned' },
                                    { label: 'Production Progress', value: `${selectedOrder.production_progress ?? 0}%` },
                                    { label: 'Production Last Update', value: selectedOrder.production_updated_at ? new Date(selectedOrder.production_updated_at).toLocaleString() : 'No update yet' },
                                    { label: 'Total Amount', value: `$${Number(selectedOrder.total_amount).toFixed(2)}`, bold: true },
                                ].map(({ label, value, bold }) => (
                                    <div key={label} className="flex justify-between items-center px-5 py-3.5">
                                        <span className="text-sm text-text/50">{label}</span>
                                        <span className={`text-sm ${bold ? 'font-bold text-primary text-base' : 'font-medium text-text'}`}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                                <p className="text-xs font-bold text-text/40 uppercase tracking-widest mb-3">Linked Materials</p>
                                {materialsLoading ? (
                                    <p className="text-sm text-text/40">Loading linked materials...</p>
                                ) : materialsError ? (
                                    <p className="text-sm text-red-400">{materialsError}</p>
                                ) : orderMaterials.length === 0 ? (
                                    <p className="text-sm text-text/50">No materials reserved for this order yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {orderMaterials.map((res) => (
                                            <div key={res.id} className="rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-text">{res.material_name}</p>
                                                    <p className="text-xs text-text/50">Reserved by {res.reserved_by}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-text">{res.reserved_qty}</p>
                                                    <p className={`text-xs ${res.status === 'Active' ? 'text-yellow-400' : 'text-green-400'}`}>{res.status}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Order Type Explanation */}
                            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{selectedOrder.order_type} Order</p>
                                <p className="text-sm text-text/70 leading-relaxed">{TYPE_DESC[selectedOrder.order_type]}</p>
                            </div>

                            {/* Timeline placeholder */}
                            <div>
                                <p className="text-xs font-bold text-text/40 uppercase tracking-widest mb-3">Order Timeline</p>
                                <div className="relative pl-5 border-l border-white/10 space-y-4">
                                    {[
                                        { label: 'Order Received', date: new Date(selectedOrder.order_date).toLocaleDateString(), done: true },
                                        { label: 'Production Started', date: selectedOrder.started_at ? new Date(selectedOrder.started_at).toLocaleDateString() : 'Pending', done: !!selectedOrder.started_at },
                                        { label: 'Production Progress Submitted', date: selectedOrder.production_submitted_at ? new Date(selectedOrder.production_submitted_at).toLocaleDateString() : 'Pending', done: !!selectedOrder.production_submitted_at },
                                        {
                                            label: `QC Inspection${selectedOrder.latest_qc_result ? ` (${selectedOrder.latest_qc_result})` : ''}`,
                                            date: selectedOrder.latest_qc_inspected_at ? new Date(selectedOrder.latest_qc_inspected_at).toLocaleDateString() : 'Pending',
                                            done: !!selectedOrder.latest_qc_inspected_at
                                        },
                                        { label: 'Order Completed', date: selectedOrder.completed_at ? new Date(selectedOrder.completed_at).toLocaleDateString() : 'Pending', done: !!selectedOrder.completed_at },
                                    ].map(({ label, date, done }) => (
                                        <div key={label} className="flex items-start gap-3">
                                            <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 flex items-center justify-center ${done ? 'bg-green-500 border-green-500' : 'bg-background border-white/20'}`}>
                                                {done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div className="ml-2">
                                                <p className={`text-sm font-medium ${done ? 'text-text' : 'text-text/40'}`}>{label}</p>
                                                <p className="text-xs text-text/40 mt-0.5">{date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Panel Footer */}
                        <div className="p-5 border-t border-white/10">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full py-2.5 text-sm font-semibold rounded-xl border border-white/10 text-text/70 hover:bg-white/5 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* New Order Modal */}
            {showModal && (
                <div className="orderdetail-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="orderdetail-modal-panel" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} className="orderdetail-modal-close">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-bold text-text mb-1">Create New Order</h2>
                        <p className="text-text/50 text-sm mb-6">Register a new production order in the system.</p>

                        {successMsg ? (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{successMsg}</div>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                {formError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{formError}</p>}
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Customer Name *</label>
                                    <input id="order-customer" type="text" name="customerName" value={form.customerName} onChange={handleFormChange} placeholder="e.g. Acme Corp"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Order Type *</label>
                                    <select id="order-type" name="orderType" value={form.orderType} onChange={handleFormChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="OEM">OEM — Original Equipment Manufacturer</option>
                                        <option value="ODM">ODM — Original Design Manufacturer</option>
                                        <option value="Bespoke">Bespoke — Custom Made Order</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Design Specification *</label>
                                    <select
                                        id="order-construction"
                                        name="constructionId"
                                        value={form.constructionId}
                                        onChange={handleFormChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="">Select {form.orderType} design spec...</option>
                                        {filteredConstructions.map(spec => (
                                            <option key={spec.id} value={spec.id}>
                                                #{spec.id} - {spec.design_mode || 'OEM'} / {spec.furniture_type} ({spec.primary_finish})
                                            </option>
                                        ))}
                                    </select>
                                    {filteredConstructions.length === 0 && (
                                        <p className="text-xs text-text/50 mt-1">
                                            No {form.orderType} design specs found. Create one in the Design Specs page first.
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Unit Price (฿) *</label>
                                        <input id="order-unit-price" type="number" name="unitPrice" value={form.unitPrice} onChange={handleFormChange} min="0" step="0.01" placeholder="0.00"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text/70 mb-1 block">Item Count *</label>
                                        <input id="order-items" type="number" name="itemCount" value={form.itemCount} onChange={handleFormChange} min="1"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text/70 mb-1 block">Calculated Total (฿)</label>
                                    <input
                                        id="order-total-calculated"
                                        type="text"
                                        value={calculatedTotal.toFixed(2)}
                                        readOnly
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text/80"
                                    />
                                </div>
                                <button id="order-submit" type="submit" disabled={submitting}
                                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60">
                                    {submitting ? 'Creating…' : 'Create Order'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

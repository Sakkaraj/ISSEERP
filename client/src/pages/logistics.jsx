import React, { useEffect, useMemo, useState } from 'react';
import './styles/logistics.css';

const DEFAULT_META = {
	statuses: ['Planned', 'Packed', 'Dispatched', 'Delivered', 'Returned', 'Cancelled'],
	priorities: ['Low', 'Normal', 'High', 'Urgent'],
	delivery_methods: ['Internal Vehicle', 'Warehouse Pickup', 'Internal Transfer'],
};

function useLogisticsDashboard() {
	const [data, setData] = useState({ meta: DEFAULT_META, summary: {}, ready_orders: [], shipments: [] });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const refetch = async () => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch('/api/logistics');
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Failed to load logistics data');
			setData({
				meta: json.meta || DEFAULT_META,
				summary: json.summary || {},
				ready_orders: Array.isArray(json.ready_orders) ? json.ready_orders : [],
				shipments: Array.isArray(json.shipments) ? json.shipments : [],
			});
		} catch (err) {
			setError(err.message || 'Failed to load logistics data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refetch();
	}, []);

	return { data, loading, error, refetch };
}

function formatDateTime(value) {
	if (!value) return '—';
	return new Date(value).toLocaleString();
}

function formatDateTimeInput(value) {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	const pad = (number) => String(number).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCurrency(value) {
	return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusClass(status) {
	if (status === 'Delivered') return 'bg-green-500/10 text-green-400 border-green-500/20';
	if (status === 'Dispatched') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
	if (status === 'Packed') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
	if (status === 'Returned') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
	if (status === 'Cancelled') return 'bg-red-500/10 text-red-400 border-red-500/20';
	return 'bg-white/5 text-text/70 border-white/10';
}

function createCreateForm(order = null, meta = DEFAULT_META) {
	return {
		orderId: order ? String(order.id) : '',
		destination: order ? order.customer_name : '',
		vehicleCode: '',
		driverName: '',
		deliveryMethod: meta.delivery_methods[0] || 'Internal Vehicle',
		priority: meta.priorities[1] || 'Normal',
		scheduledDispatchAt: '',
		notes: '',
	};
}

function createEditForm(shipment) {
	return {
		status: shipment?.status || 'Planned',
		destination: shipment?.destination || '',
		vehicleCode: shipment?.vehicle_code || '',
		driverName: shipment?.driver_name || '',
		deliveryMethod: shipment?.delivery_method || 'Internal Vehicle',
		priority: shipment?.priority || 'Normal',
		scheduledDispatchAt: formatDateTimeInput(shipment?.scheduled_dispatch_at),
		notes: shipment?.notes || '',
	};
}

export default function Logistics() {
	const username = localStorage.getItem('username') || '';
	const { data, loading, error, refetch } = useLogisticsDashboard();
	const meta = data.meta || DEFAULT_META;
	const summary = data.summary || {};
	const readyOrders = data.ready_orders || [];
	const shipments = data.shipments || [];

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [createForm, setCreateForm] = useState(createCreateForm(null, meta));
	const [editForm, setEditForm] = useState(createEditForm(null));
	const [selectedShipment, setSelectedShipment] = useState(null);
	const [createError, setCreateError] = useState('');
	const [editError, setEditError] = useState('');
	const [createSuccess, setCreateSuccess] = useState('');
	const [editSuccess, setEditSuccess] = useState('');
	const [creating, setCreating] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setCreateForm((prev) => ({
			...prev,
			deliveryMethod: prev.deliveryMethod || meta.delivery_methods[0] || 'Internal Vehicle',
			priority: prev.priority || meta.priorities[1] || 'Normal',
		}));
	}, [meta.delivery_methods, meta.priorities]);

	const shipmentCounts = useMemo(() => ({
		total: Number(summary.total_shipments || 0),
		ready: Number(summary.ready_for_dispatch || 0),
		dispatched: Number(summary.dispatched_shipments || 0),
		delivered: Number(summary.delivered_shipments || 0),
	}), [summary]);

	const openCreateModal = (order = null) => {
		setCreateError('');
		setCreateSuccess('');
		setCreateForm(createCreateForm(order, meta));
		setShowCreateModal(true);
	};

	const openEditModal = (shipment) => {
		setSelectedShipment(shipment);
		setEditError('');
		setEditSuccess('');
		setEditForm(createEditForm(shipment));
		setShowEditModal(true);
	};

	const handleCreateChange = (e) => {
		setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleEditChange = (e) => {
		setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const submitCreateShipment = async (e) => {
		e.preventDefault();
		setCreateError('');

		if (!createForm.orderId) {
			setCreateError('Please select a completed order.');
			return;
		}
		if (!createForm.destination.trim()) {
			setCreateError('Destination is required.');
			return;
		}
		if (!createForm.vehicleCode.trim()) {
			setCreateError('Vehicle code is required.');
			return;
		}
		if (!createForm.driverName.trim()) {
			setCreateError('Driver name is required.');
			return;
		}
		if (!username) {
			setCreateError('Missing username in session. Please log out and sign in again.');
			return;
		}

		setCreating(true);
		try {
			const res = await fetch('/api/logistics', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					order_id: Number(createForm.orderId),
					destination: createForm.destination,
					vehicle_code: createForm.vehicleCode,
					driver_name: createForm.driverName,
					delivery_method: createForm.deliveryMethod,
					priority: createForm.priority,
					scheduled_dispatch_at: createForm.scheduledDispatchAt,
					notes: createForm.notes,
					created_by: username,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Failed to create shipment');
			setCreateSuccess(`Shipment ${json.shipment_code} created successfully.`);
			await refetch();
			setTimeout(() => {
				setShowCreateModal(false);
				setCreateSuccess('');
			}, 1400);
		} catch (err) {
			setCreateError(err.message || 'Failed to create shipment');
		} finally {
			setCreating(false);
		}
	};

	const submitEditShipment = async (e) => {
		e.preventDefault();
		setEditError('');

		if (!selectedShipment) {
			setEditError('Shipment not selected.');
			return;
		}
		if (!editForm.destination.trim()) {
			setEditError('Destination is required.');
			return;
		}
		if (!editForm.vehicleCode.trim()) {
			setEditError('Vehicle code is required.');
			return;
		}
		if (!editForm.driverName.trim()) {
			setEditError('Driver name is required.');
			return;
		}

		setSaving(true);
		try {
			const res = await fetch('/api/logistics', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					shipment_id: selectedShipment.id,
					status: editForm.status,
					destination: editForm.destination,
					vehicle_code: editForm.vehicleCode,
					driver_name: editForm.driverName,
					delivery_method: editForm.deliveryMethod,
					priority: editForm.priority,
					scheduled_dispatch_at: editForm.scheduledDispatchAt,
					notes: editForm.notes,
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Failed to update shipment');
			setEditSuccess(`Shipment ${selectedShipment.shipment_code} updated successfully.`);
			await refetch();
			setTimeout(() => {
				setShowEditModal(false);
				setSelectedShipment(null);
				setEditSuccess('');
			}, 1400);
		} catch (err) {
			setEditError(err.message || 'Failed to update shipment');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="logistics-page p-6 sm:p-10 max-w-7xl mx-auto w-full">
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-8">
				<div>
					<p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70 font-semibold mb-2">In-house Logistics</p>
					<h1 className="text-3xl font-bold text-text tracking-tight">Dispatch Control Center</h1>
					<p className="text-text/60 mt-1 max-w-2xl">Plan internal deliveries, track shipments, and update dispatch status directly from the server-backed logistics workflow.</p>
				</div>
				<button
					onClick={() => openCreateModal(readyOrders[0] || null)}
					className="px-5 py-3 rounded-xl bg-cyan-500/90 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:-translate-y-0.5 transition-all duration-200"
				>
					Create Shipment
				</button>
			</div>

			<div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
				<StatCard label="Total Shipments" value={shipmentCounts.total} tone="text-cyan-300" border="border-cyan-500/20" />
				<StatCard label="Ready For Dispatch" value={shipmentCounts.ready} tone="text-amber-300" border="border-amber-500/20" />
				<StatCard label="In Transit" value={shipmentCounts.dispatched} tone="text-blue-300" border="border-blue-500/20" />
				<StatCard label="Delivered" value={shipmentCounts.delivered} tone="text-green-300" border="border-green-500/20" />
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
				<section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
					<div className="px-6 py-4 border-b border-white/10 bg-black/20">
						<h2 className="text-lg font-bold text-text">Ready Orders</h2>
						<p className="text-text/60 text-sm">Completed orders that do not yet have an active logistics shipment.</p>
					</div>
					{loading ? (
						<div className="p-10 text-center text-text/40">Loading logistics data…</div>
					) : error ? (
						<div className="p-10 text-center text-red-400 text-sm">{error}</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
										<th className="p-4 pl-6">Order</th>
										<th className="p-4">Customer</th>
										<th className="p-4 text-center">Items</th>
										<th className="p-4 text-right">Amount</th>
										<th className="p-4 pr-6 text-center">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-white/10">
									{readyOrders.map((order) => (
										<tr key={order.id} className="hover:bg-white/5 transition-colors">
											<td className="p-4 pl-6 font-mono text-sm text-cyan-300">#{order.id}</td>
											<td className="p-4 text-sm text-text font-medium">{order.customer_name}</td>
											<td className="p-4 text-center text-sm text-text/80">{order.item_count}</td>
											<td className="p-4 text-right text-sm text-text/80">${formatCurrency(order.total_amount)}</td>
											<td className="p-4 pr-6 text-center">
												<button
													onClick={() => openCreateModal(order)}
													className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors"
												>
													Plan Shipment
												</button>
											</td>
										</tr>
									))}
									{readyOrders.length === 0 && (
										<tr>
											<td colSpan={5} className="p-12 text-center text-text/40">
												No completed orders are currently waiting for dispatch.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
					<div className="px-6 py-4 border-b border-white/10 bg-black/20">
						<h2 className="text-lg font-bold text-text">Shipment Register</h2>
						<p className="text-text/60 text-sm">Monitor logistics workflow from planned dispatch to delivery completion.</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-black/20 border-b border-white/10 text-xs font-semibold text-text/60 uppercase tracking-wider">
									<th className="p-4 pl-6">Shipment</th>
									<th className="p-4">Order</th>
									<th className="p-4">Destination</th>
									<th className="p-4 text-center">Status</th>
									<th className="p-4 pr-6 text-center">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/10">
								{shipments.map((shipment) => (
									<tr key={shipment.id} className="hover:bg-white/5 transition-colors">
										<td className="p-4 pl-6">
											<p className="font-mono text-sm text-cyan-300">{shipment.shipment_code}</p>
											<p className="text-xs text-text/50 mt-1">{formatDateTime(shipment.scheduled_dispatch_at)}</p>
										</td>
										<td className="p-4">
											<p className="text-sm font-semibold text-text">#{shipment.order_id}</p>
											<p className="text-xs text-text/50 mt-1">{shipment.customer_name}</p>
										</td>
										<td className="p-4 text-sm text-text/80 max-w-[180px] truncate">{shipment.destination}</td>
										<td className="p-4 text-center">
											<span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusClass(shipment.status)}`}>
												{shipment.status}
											</span>
										</td>
										<td className="p-4 pr-6 text-center">
											<button
												onClick={() => openEditModal(shipment)}
												className="px-3 py-1.5 rounded-lg bg-white/10 text-text border border-white/15 text-xs font-bold uppercase tracking-wider hover:bg-white/15 transition-colors"
											>
												Update
											</button>
										</td>
									</tr>
								))}
								{shipments.length === 0 && (
									<tr>
										<td colSpan={5} className="p-12 text-center text-text/40">
											No logistics shipments recorded yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>

			{showCreateModal && (
				<div className="logistics-modal-overlay" onClick={() => setShowCreateModal(false)}>
					<div className="logistics-modal-panel" onClick={(e) => e.stopPropagation()}>
						<button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">✕</button>
						<h2 className="text-xl font-bold text-text mb-1">Create Logistics Shipment</h2>
						<p className="text-text/50 text-sm mb-6">Use a completed order from the ready list and assign the in-house dispatch details.</p>

						{createSuccess ? (
							<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{createSuccess}</div>
						) : (
							<form onSubmit={submitCreateShipment} className="space-y-4">
								{createError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{createError}</p>}
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Completed Order *</label>
									<select name="orderId" value={createForm.orderId} onChange={handleCreateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
										<option value="">Select an order…</option>
										{readyOrders.map((order) => (
											<option key={order.id} value={order.id}>#{order.id} - {order.customer_name}</option>
										))}
									</select>
								</div>
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Destination *</label>
									<input type="text" name="destination" value={createForm.destination} onChange={handleCreateChange} placeholder="Customer site / warehouse / branch" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Vehicle Code *</label>
										<input type="text" name="vehicleCode" value={createForm.vehicleCode} onChange={handleCreateChange} placeholder="TRK-01" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
									</div>
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Driver Name *</label>
										<input type="text" name="driverName" value={createForm.driverName} onChange={handleCreateChange} placeholder="Staff name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Delivery Method</label>
										<select name="deliveryMethod" value={createForm.deliveryMethod} onChange={handleCreateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
											{meta.delivery_methods.map((method) => <option key={method} value={method}>{method}</option>)}
										</select>
									</div>
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Priority</label>
										<select name="priority" value={createForm.priority} onChange={handleCreateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
											{meta.priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
										</select>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Scheduled Dispatch</label>
									<input type="datetime-local" name="scheduledDispatchAt" value={createForm.scheduledDispatchAt} onChange={handleCreateChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
								</div>
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Notes</label>
									<textarea name="notes" value={createForm.notes} onChange={handleCreateChange} rows={3} placeholder="Route notes, handling instructions, or warehouse remarks" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" />
								</div>
								<button type="submit" disabled={creating} className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
									{creating ? 'Creating…' : 'Create Shipment'}
								</button>
							</form>
						)}
					</div>
				</div>
			)}

			{showEditModal && selectedShipment && (
				<div className="logistics-modal-overlay" onClick={() => setShowEditModal(false)}>
					<div className="logistics-modal-panel" onClick={(e) => e.stopPropagation()}>
						<button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-text/40 hover:text-text transition-colors">✕</button>
						<h2 className="text-xl font-bold text-text mb-1">Update Shipment</h2>
						<p className="text-text/50 text-sm mb-6">Modify route details or advance the shipment status through the logistics workflow.</p>

						<div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
							<p className="text-xs uppercase tracking-widest text-text/40 font-semibold">Selected Shipment</p>
							<p className="text-text font-semibold mt-1">{selectedShipment.shipment_code}</p>
							<p className="text-sm text-text/60">Order #{selectedShipment.order_id} - {selectedShipment.customer_name}</p>
						</div>

						{editSuccess ? (
							<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 font-medium text-sm text-center">{editSuccess}</div>
						) : (
							<form onSubmit={submitEditShipment} className="space-y-4">
								{editError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{editError}</p>}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Status</label>
										<select name="status" value={editForm.status} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
											{meta.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
										</select>
									</div>
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Priority</label>
										<select name="priority" value={editForm.priority} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
											{meta.priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
										</select>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Destination</label>
									<input type="text" name="destination" value={editForm.destination} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Vehicle Code</label>
										<input type="text" name="vehicleCode" value={editForm.vehicleCode} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
									</div>
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Driver Name</label>
										<input type="text" name="driverName" value={editForm.driverName} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Delivery Method</label>
										<select name="deliveryMethod" value={editForm.deliveryMethod} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
											{meta.delivery_methods.map((method) => <option key={method} value={method}>{method}</option>)}
										</select>
									</div>
									<div>
										<label className="text-sm font-medium text-text/70 mb-1 block">Scheduled Dispatch</label>
										<input type="datetime-local" name="scheduledDispatchAt" value={editForm.scheduledDispatchAt} onChange={handleEditChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
									</div>
								</div>
								<div>
									<label className="text-sm font-medium text-text/70 mb-1 block">Notes</label>
									<textarea name="notes" value={editForm.notes} onChange={handleEditChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" />
								</div>
								<button type="submit" disabled={saving} className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl mt-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
									{saving ? 'Saving…' : 'Save Shipment Update'}
								</button>
							</form>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value, tone, border }) {
	return (
		<div className={`bg-white/5 border ${border} rounded-2xl p-5`}>
			<p className="text-text/50 text-sm font-medium">{label}</p>
			<p className={`text-3xl font-extrabold mt-1 ${tone}`}>{value}</p>
		</div>
	);
}
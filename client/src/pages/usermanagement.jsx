import React, { useState } from 'react';
import './styles/usermanagement.css';

function UserManagement() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('SaleStaff');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const ROLES = [
        { value: 'Admin', label: 'Admin (Full Access)' },
        { value: 'SaleStaff', label: 'Sale Staff (Orders & Finance)' },
        { value: 'QualityController', label: 'Quality Controller (QC Only)' },
        { value: 'LogisticsStaff', label: 'Logistics Staff (Inventory)' },
        { value: 'Production', label: 'Production (Production Mgmt)' },
    ];

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!username.trim()) {
            setError('Username is required.');
            return;
        }

        if (!password) {
            setError('Password is required.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const authToken = localStorage.getItem('auth_token');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ username, password, role }),
            });

            const contentType = response.headers.get('content-type');
            let data;
            if (contentType && contentType.indexOf('application/json') !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Unknown server error occurred');
            }

            if (response.ok && data.success) {
                setSuccess(`User '${username}' created successfully with role '${role}'.`);
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setRole('SaleStaff');
            } else {
                setError(data.message || 'Failed to create user.');
            }
        } catch (err) {
            console.error('User creation error:', err);
            setError('Unable to communicate with the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="um-page">
            <div className="um-container">
                {/* Header */}
                <div className="um-header">
                    <div className="um-header-row">
                        <div className="um-icon-wrap">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-text">User Management</h1>
                            <p className="text-text/60 mt-1">Create new staff accounts and assign roles</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="um-main-grid">
                    {/* Form Section */}
                    <div className="um-form-col">
                        <div className="um-card">
                            <h2 className="text-xl font-bold text-text mb-6">Create New User</h2>

                            {error && (
                                <div className="um-alert um-alert-error">
                                    <div className="um-alert-row">
                                        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="um-alert-text um-alert-text-error">{error}</p>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="um-alert um-alert-success">
                                    <div className="um-alert-row">
                                        <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="um-alert-text um-alert-text-success">{success}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleCreateUser} className="um-form">
                                {/* Username */}
                                <div>
                                    <label className="um-label">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g., john_doe"
                                        className="um-field"
                                        disabled={loading}
                                    />
                                    <p className="um-helper">Unique username for login</p>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="um-label">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="um-field"
                                        disabled={loading}
                                    />
                                    <p className="um-helper">Min 6 characters</p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="um-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="um-field"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label className="um-label">Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="um-field"
                                        disabled={loading}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="um-helper">Determines page access and permissions</p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="um-submit-btn"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating User...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Create User
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="um-info-col">
                        <div className="um-card">
                            <h2 className="text-xl font-bold text-text mb-6">Role Permissions</h2>
                            
                            <div className="space-y-6">
                                {ROLES.map((r) => (
                                    <div key={r.value} className="um-role-item">
                                        <h3 className="text-md font-semibold text-text mb-2">{r.label}</h3>
                                        <p className="text-sm text-text/70">
                                            {r.value === 'Admin' && 'Full access to all pages. Can create users, manage all operations, and view all data.'}
                                            {r.value === 'SaleStaff' && 'Access to Orders and Finance pages. Can manage customer orders, track finances, view dashboard.'}
                                            {r.value === 'QualityController' && 'Access to QC Register only. Can submit quality inspections and view QC records.'}
                                            {r.value === 'LogisticsStaff' && 'Access to Inventory page. Can manage materials, create reservations, and view warehouse stock.'}
                                            {r.value === 'Production' && 'Limited access to Home page. Reserved for future production management features.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips Section */}
                        <div className="um-tip-box">
                            <div className="um-tip-row">
                                <div className="flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="um-tip-title">Tips</h3>
                                    <ul className="um-tip-list">
                                        <li>• Create usernames without spaces for easy login</li>
                                        <li>• Passwords are hashed with bcrypt for security</li>
                                        <li>• Roles cannot be changed after creation (admin required)</li>
                                        <li>• Each staff member should have a unique username</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserManagement;

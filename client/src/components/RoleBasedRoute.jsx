import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * RoleBasedRoute Component
 * 
 * Protects routes based on user authentication and role authorization.
 * 
 * Usage:
 *   <RoleBasedRoute requiredRoles={['Admin', 'SaleStaff']} children={<YourPage />} />
 * 
 * Props:
 *   - requiredRoles: Array of role strings. User must have at least one role (OR logic)
 *   - allowedTo: Optional. Friendly description of what this page requires (for logging)
 *   - children: The component to render if authorized
 */
export function RoleBasedRoute({ requiredRoles = [], allowedTo = '', children }) {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    // Not authenticated - redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // No required roles specified - allow access if authenticated
    if (!requiredRoles || requiredRoles.length === 0) {
        return children;
    }

    // Check if user has one of the required roles (OR logic)
    const hasRequiredRole = requiredRoles.includes(role);

    if (!hasRequiredRole) {
        console.warn(
            `Access Denied: User role '${role}' is not authorized to access this page. Required roles: ${requiredRoles.join(', ')}. ${allowedTo ? `(${allowedTo})` : ''}`
        );
        // Redirect to home or unauthorized page
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleBasedRoute;

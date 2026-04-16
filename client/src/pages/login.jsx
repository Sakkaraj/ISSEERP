import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!username || !password) {
            setError('Please enter your username and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Unknown server error occurred');
            }

            if (response.ok && data.success) {
                // Success: Save token and role, then navigate to dashboard
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                }
                if (data.role) {
                    localStorage.setItem('user_role', data.role);
                }
                localStorage.setItem('username', data.username || username);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid username or password.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError('Unable to communicate with the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Ambient Background Glow Effects */}
            <div className="login-glow login-glow-primary"></div>
            <div className="login-glow login-glow-secondary"></div>

            <div className="login-shell">
                <div className="login-card">
                    
                    <div className="text-center mb-8">
                        <div className="login-brand-icon">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-text tracking-tight mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-text/60 font-medium">
                            Please sign in to your staff portal
                        </p>
                    </div>

                    {error && (
                        <div className="login-error-box">
                            <div className="flex items-center space-x-3">
                                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm font-medium text-red-500">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text/80 ml-1">Username</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="login-field"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text/40 group-focus-within:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text/80 ml-1">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="login-field"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text/40 group-focus-within:text-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-submit-btn group"
                        >
                            <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                            
                            <span className="relative flex Items-center justify-center w-full">
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 mr-3 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing into Portal...
                                    </>
                                ) : (
                                    "Secure Sign In"
                                )}
                            </span>
                        </button>
                    </form>
                    
                </div>
            </div>
        </div>
    );
}

export default Login;
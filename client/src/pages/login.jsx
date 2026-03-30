import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

            const data = await response.json();

            if (response.ok && data.success) {
                // Success: Optionially save token and navigate to dashboard
                if (data.token) {
                    localStorage.setItem('auth_token', data.token);
                }
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
        <div className="flex flex-col items-center justify-center flex-1 w-full px-4 pt-16 pb-24 relative overflow-hidden">
            {/* Ambient Background Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-primary/5">
                    
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-primary to-blue-500 mb-6 shadow-lg shadow-primary/30">
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
                        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 transform animate-in slide-in-from-top-2 duration-300">
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
                                    className="w-full bg-black/5 dark:bg-white/5 border border-white/10 dark:border-white/5 rounded-xl px-4 py-3.5 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
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
                                    className="w-full bg-black/5 dark:bg-white/5 border border-white/10 dark:border-white/5 rounded-xl px-4 py-3.5 text-text placeholder:text-text/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
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
                            className="relative w-full overflow-hidden group rounded-xl bg-primary px-6 py-4 mt-2 font-semibold text-white shadow-[0_0_20px_rgba(var(--color-primary),0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--color-primary),0.5)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
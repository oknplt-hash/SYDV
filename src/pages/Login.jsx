import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';

const USERS = [
    { id: 'okanpolat', name: 'Okan POLAT' },
    { id: 'kursaddagdelen', name: 'Kürşad DAĞDELEN' },
    { id: 'harunsahin', name: 'Harun ŞAHİN' },
    { id: 'osmangul', name: 'Osman GÜL' },
    { id: 'eliftug', name: 'Elif TUĞ' }
];

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-4">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500 hover:scale-[1.01]">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-12">
                        {/* Logo/Icon Header */}
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                                <ShieldCheck size={40} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2">SYDV</h1>
                            <p className="text-indigo-200/60 font-medium text-sm">Gündem Sistemi Giriş</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="text-rose-400 shrink-0" size={20} />
                                <p className="text-rose-200 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-200/50 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-indigo-300/30">
                                        <ChevronDown size={20} />
                                    </div>
                                    <select
                                        required
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    >
                                        <option value="" disabled className="bg-slate-900">Kullanıcı seçin</option>
                                        {USERS.map(u => (
                                            <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-indigo-200/50 uppercase tracking-widest ml-1">Şifre</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-indigo-300/30 group-focus-within:text-indigo-400 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-white/10"
                                        placeholder="Şifrenizi girin"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group mt-8"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Giriş Yap</span>
                                        <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white/5 py-4 border-t border-white/10 text-center">
                        <p className="text-[10px] text-indigo-200/30 font-bold uppercase tracking-widest">Gümüşhane Şiran SYDV © 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

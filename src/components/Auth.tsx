import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Clock, User as UserIcon, LogIn, UserPlus, AlertCircle, Shield } from 'lucide-react';

interface AuthProps {
    onAuthSuccess: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [authMode, setAuthMode] = useState<'employee' | 'manager'>('employee');
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [profession, setProfession] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Fetch profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;
                if (!profile) throw new Error('Perfil do usuário não encontrado. Por favor, contate o administrador.');

                if (authMode === 'manager' && profile.role !== 'manager') {
                    await supabase.auth.signOut();
                    throw new Error('Acesso restrito. Este perfil não tem permissões de Gestor.');
                }

                onAuthSuccess(profile);
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                name,
                                profession,
                                role: 'employee',
                                hourly_rate: 30,
                            },
                        ]);
                    if (profileError) throw profileError;

                    alert('Cadastro realizado com sucesso! Verifique seu email se necessário.');
                    setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="space-y-2 text-center">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl ${authMode === 'manager' ? 'bg-zinc-900 shadow-zinc-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                        {authMode === 'manager' ? <Shield className="w-10 h-10 text-emerald-500" /> : <Clock className="w-10 h-10 text-white" />}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        {authMode === 'manager' ? 'Painel Administrativo' : 'Ponto Inteligente'}
                    </h1>
                    <p className="text-zinc-500">
                        {authMode === 'manager' ? 'Gestão de equipes e jornadas' : 'Gestão de jornada com Supabase'}
                    </p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 space-y-6">
                    {/* Modo de Acesso */}
                    <div className="flex p-1 bg-zinc-100 rounded-xl mb-2">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('employee'); setIsLogin(true); setError(null); }}
                            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${authMode === 'employee' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <UserIcon className="w-4 h-4" />
                            Colaborador
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('manager'); setIsLogin(true); setError(null); }}
                            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${authMode === 'manager' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <Shield className="w-4 h-4" />
                            Gestor
                        </button>
                    </div>

                    {authMode === 'employee' && (
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                            <button
                                type="button"
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 font-bold text-sm transition-all ${isLogin ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-zinc-400'}`}
                            >
                                Entrar
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 font-bold text-sm transition-all ${!isLogin ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-zinc-400'}`}
                            >
                                Cadastrar
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Profissão</label>
                                    <input
                                        type="text"
                                        value={profession}
                                        onChange={(e) => setProfession(e.target.value)}
                                        required
                                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Sua profissão"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-emerald-500 outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-emerald-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${authMode === 'manager' ? 'bg-zinc-900 shadow-zinc-200' : 'bg-emerald-600 shadow-emerald-200'}`}
                        >
                            {loading ? 'Processando...' : isLogin ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {authMode === 'manager' ? 'Acessar Painel' : 'Entrar no Sistema'}
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Criar Conta
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

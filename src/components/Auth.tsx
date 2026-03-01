import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Clock, User as UserIcon, LogIn, UserPlus, AlertCircle, Shield, ArrowLeft } from 'lucide-react';

interface AuthProps {
    onAuthSuccess: (user: any) => void;
    mode: 'employee' | 'manager';
    onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, mode, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [profession, setProfession] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const syntheticEmail = `${name.trim().toLowerCase().replace(/\s+/g, '.')}@ponto.com`;

            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: syntheticEmail,
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

                if (mode === 'manager' && profile.role !== 'manager') {
                    await supabase.auth.signOut();
                    throw new Error('Acesso restrito. Este perfil não tem permissões de Gestor.');
                }

                if (mode === 'employee' && profile.role !== 'employee') {
                    await supabase.auth.signOut();
                    throw new Error('Conta identificada como Gestor. Por favor, entre pelo painel administrativo.');
                }

                onAuthSuccess(profile);
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: syntheticEmail,
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
                                profession: mode === 'employee' ? profession : 'Gestor',
                                role: mode,
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
                <div className="space-y-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors py-2 px-4 rounded-xl hover:bg-zinc-200/50 -ml-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium text-sm">Voltar</span>
                    </button>
                    <div className="text-center">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl ${mode === 'manager' ? 'bg-zinc-900 shadow-zinc-200' : 'bg-emerald-600 shadow-emerald-200'}`}>
                            {mode === 'manager' ? <Shield className="w-10 h-10 text-emerald-500" /> : <Clock className="w-10 h-10 text-white" />}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-6">
                            {mode === 'manager' ? 'Painel Administrativo' : 'Acesso Colaborador'}
                        </h1>
                        <p className="text-zinc-500 mt-2">
                            {mode === 'manager' ? 'Gestão de equipes e jornadas' : 'Gestão de jornada inteligente'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 space-y-6">

                    {mode === 'employee' && (
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

                        {!isLogin && mode === 'employee' && (
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
                        )}

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
                            className={`w-full py-4 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${mode === 'manager' ? 'bg-zinc-900 shadow-zinc-200' : 'bg-emerald-600 shadow-emerald-200'}`}
                        >
                            {loading ? 'Processando...' : isLogin ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {mode === 'manager' ? 'Acessar Painel' : 'Entrar no Sistema'}
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

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, ChevronRight, Trash2, UserMinus, Settings, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { User, PointLog } from '../types';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface ManagerDashboardProps {
    user: User;
    onLogout: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
    const [logs, setLogs] = useState<PointLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<any>({ active_today: 0, total_logs: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'settings'>('logs');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userLogs, setUserLogs] = useState<PointLog[]>([]);
    const [userEarnings, setUserEarnings] = useState(0);
    const [newManagerPass, setNewManagerPass] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dashData, usersData] = await Promise.all([
                api.getManagerDashboard(),
                api.getManagerUsers()
            ]);
            setLogs(dashData.logs);
            setStats(dashData.stats);
            setUsers(usersData);
        } catch (err) {
            setError("Erro ao carregar dados do gestor.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newManagerPass) return;
        try {
            await api.updateManagerPassword(newManagerPass);
            alert("Senha de gestor atualizada com sucesso!");
            setNewManagerPass('');
        } catch (err) {
            setError("Erro ao atualizar senha.");
        }
    };

    const handleUpdateRate = async (userId: string, newRate: number) => {
        try {
            await api.updateUserRate(userId, newRate);
            loadData();
        } catch (err) {
            setError("Erro ao atualizar taxa.");
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (confirm(`Tem certeza que deseja remover o colaborador "${userName}"? Todos os registros dele serão excluídos permanentemente.`)) {
            try {
                await api.deleteUser(userId);
                loadData();
            } catch (err: any) {
                setError(err.message || "Erro ao remover colaborador.");
            }
        }
    };

    const handleDeleteLog = async (logId: number) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            try {
                await api.deleteLog(logId);
                loadData();
                if (selectedUser) {
                    const stats = await api.getUserStats(selectedUser.id);
                    setUserLogs(stats.logs);
                    setUserEarnings(stats.earnings);
                }
            } catch (err: any) {
                setError(err.message || "Erro ao excluir registro.");
            }
        }
    };

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        const stats = await api.getUserStats(user.id);
        setUserLogs(stats.logs);
        setUserEarnings(stats.earnings);
    };

    if (selectedUser) {
        return (
            <div className="min-h-screen bg-zinc-50">
                <header className="bg-zinc-900 text-white px-6 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                            <UserIcon className="w-7 h-7 text-zinc-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{selectedUser.name}</h1>
                            <p className="text-zinc-400 text-sm">Registro Individual</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50">
                            <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Saldo Total</p>
                            <p className="text-2xl font-bold text-emerald-500">R$ {userEarnings.toFixed(2)}</p>
                        </div>
                        <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50">
                            <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Valor/Hora</p>
                            <p className="text-2xl font-bold">R$ {selectedUser.hourly_rate}</p>
                        </div>
                    </div>
                </header>

                <main className="p-6 -mt-4 space-y-6 max-w-lg mx-auto">
                    <Card padding="none">
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                            <h2 className="font-bold text-zinc-900">Histórico de Pontos</h2>
                            <button
                                onClick={() => window.open(`/api/manager/export-afd/${selectedUser.id}`, '_blank')}
                                className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                            >
                                Exportar AFD
                            </button>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {userLogs.map(log => (
                                <div key={log.id} className="p-6 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${log.type === 'in' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                        <div>
                                            <p className="font-bold text-zinc-900">{log.type === 'in' ? 'Entrada' : 'Saída'}</p>
                                            <p className="text-xs text-zinc-500">{new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <p className="text-xs text-zinc-400 font-mono">{log.workplace_name}</p>
                                        <button
                                            onClick={() => handleDeleteLog(log.id)}
                                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {userLogs.length === 0 && (
                                <div className="p-12 text-center text-zinc-400">
                                    Nenhum registro encontrado para este colaborador.
                                </div>
                            )}
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <header className="bg-zinc-900 text-white px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                            <LayoutDashboard className="w-7 h-7 text-zinc-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Painel do Gestor</h1>
                            <p className="text-zinc-400 text-sm">Monitoramento em Tempo Real</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50">
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Ativos Hoje</p>
                        <p className="text-2xl font-bold">{stats.active_today}</p>
                    </div>
                    <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700/50">
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Registros</p>
                        <p className="text-2xl font-bold text-amber-500">{stats.total_logs}</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('users')}
                        className="bg-zinc-800 p-4 rounded-2xl text-left hover:bg-zinc-700 transition-colors cursor-pointer group border border-zinc-700/50"
                    >
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1 group-hover:text-zinc-400">Diárias</p>
                        <p className="text-2xl font-bold text-emerald-500">
                            R$ {stats.total_earnings_today ? stats.total_earnings_today.toFixed(2) : '0.00'}
                        </p>
                    </button>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'logs' ? 'bg-white text-zinc-900 shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Atividades
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-zinc-900 shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Colaboradores
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-white text-zinc-900 shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Configurações
                    </button>
                </div>
            </header>

            <main className="p-6 -mt-4 space-y-6 max-w-lg mx-auto">
                {activeTab === 'logs' ? (
                    <Card padding="none">
                        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <h2 className="font-bold text-zinc-900">Monitoramento</h2>
                            </div>
                            <button
                                onClick={() => window.open('/api/manager/export-afd', '_blank')}
                                className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                            >
                                Exportar AFD
                            </button>
                        </div>

                        <div className="divide-y divide-zinc-100">
                            {logs.map(log => (
                                <div key={log.id} className="p-6 flex items-center gap-4 hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => {
                                    const user = users.find(u => u.name === log.user_name);
                                    if (user) handleSelectUser(user);
                                }}>
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 border-2 border-white shadow-sm">
                                        {log.photo_url ? (
                                            <img src={log.photo_url} className="w-full h-full object-cover" alt="User" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                <UserIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-zinc-900 truncate">{log.user_name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-zinc-500 truncate">{log.workplace_name}</p>
                                            {log.user_profession && (
                                                <>
                                                    <span className="text-zinc-300">•</span>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{log.user_profession}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mb-1 ${log.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                                {log.type === 'in' ? 'ENTRADA' : 'SAÍDA'}
                                            </div>
                                            <p className="text-xs font-mono text-zinc-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                                            title="Excluir registro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="p-12 text-center text-zinc-400">
                                    Nenhuma atividade registrada hoje.
                                </div>
                            )}
                        </div>
                    </Card>
                ) : activeTab === 'users' ? (
                    <Card padding="none">
                        <div className="p-6 border-b border-zinc-100">
                            <h2 className="font-bold text-zinc-900">Gestão de Colaboradores</h2>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {users.map(u => (
                                <div key={u.id} className="p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900">{u.name}</p>
                                                <p className="text-xs text-zinc-500">{u.profession || 'Colaborador'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSelectUser(u)}
                                                className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id, u.name)}
                                                className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                            >
                                                <UserMinus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-zinc-50 p-3 rounded-xl">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Ganhos Hoje</p>
                                            <p className="text-sm font-bold text-emerald-600">
                                                R$ {u.earnings_today ? u.earnings_today.toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                        <div className="bg-zinc-50 p-3 rounded-xl">
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Diária (8h)</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-zinc-400">R$</span>
                                                <input
                                                    type="number"
                                                    defaultValue={u.hourly_rate * 8}
                                                    onBlur={(e) => handleUpdateRate(u.id, parseFloat(e.target.value) / 8)}
                                                    className="w-full bg-transparent p-0 font-mono font-bold text-zinc-900 border-none focus:ring-0 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card className="space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <Settings className="w-6 h-6" />
                            Configurações
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-zinc-900 mb-1">Senha do Gestor</h3>
                                <p className="text-sm text-zinc-500 mb-4">Altere a senha de acesso administrativo.</p>

                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={newManagerPass}
                                        onChange={(e) => setNewManagerPass(e.target.value)}
                                        placeholder="Nova senha"
                                        className="flex-1 p-3 bg-zinc-50 rounded-xl border border-zinc-200 outline-none focus:border-zinc-900 transition-all"
                                    />
                                    <Button onClick={handleUpdatePassword} size="sm">
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {error && (
                    <div className="fixed bottom-6 left-6 right-6 bg-red-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between z-50">
                        <span className="text-sm font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="p-1">✕</button>
                    </div>
                )}
            </main>
        </div>
    );
};

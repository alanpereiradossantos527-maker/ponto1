import React from 'react';
import { Clock, LogOut, LayoutDashboard } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    showStats?: boolean;
    testMode?: boolean;
    onToggleTestMode?: () => void;
    title?: string;
    subtitle?: string;
    icon?: 'clock' | 'dashboard';
}

export const Header: React.FC<HeaderProps> = ({
    user,
    onLogout,
    showStats = true,
    testMode,
    onToggleTestMode,
    title,
    subtitle,
    icon = 'clock'
}) => {
    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${icon === 'clock' ? 'bg-emerald-600' : 'bg-zinc-900'} rounded-xl flex items-center justify-center`}>
                    {icon === 'clock' ? (
                        <Clock className="w-6 h-6 text-white" />
                    ) : (
                        <LayoutDashboard className="w-6 h-6 text-white" />
                    )}
                </div>
                <div>
                    <h2 className="font-bold text-zinc-900 leading-tight">
                        {title || `Olá, ${user?.name}`}
                    </h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-zinc-500">
                            {subtitle || user?.profession || 'Colaborador Ativo'}
                        </p>
                        {onToggleTestMode && (
                            <button
                                onClick={onToggleTestMode}
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider transition-colors ${testMode ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-400'}`}
                            >
                                {testMode ? 'Modo Teste ON' : 'Modo Teste OFF'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Sair"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </header>
    );
};

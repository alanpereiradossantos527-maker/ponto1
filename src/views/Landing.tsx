import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Shield, Clock } from 'lucide-react';

interface LandingProps {
    onSelectMode: (mode: 'employee' | 'manager') => void;
}

export const Landing: React.FC<LandingProps> = ({ onSelectMode }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-4xl relative z-10"
            >
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-center mx-auto mb-8 border border-white/20"
                    >
                        <Clock className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
                        Ponto Inteligente
                    </h1>
                    <p className="text-lg text-zinc-500 max-w-xl mx-auto font-medium">
                        Selecione seu perfil de acesso para entrar no sistema.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMode('employee')}
                        className="group relative bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 text-left transition-all hover:border-emerald-500/50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <UserIcon className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Colaborador</h2>
                            <p className="text-zinc-500 font-medium leading-relaxed">
                                Acesse para registrar seu ponto, visualizar horas e acompanhar seus ganhos.
                            </p>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMode('manager')}
                        className="group relative bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-zinc-900/20 border border-zinc-800 text-left transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700 group-hover:scale-110 transition-transform">
                                <Shield className="w-8 h-8 text-zinc-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Gestor</h2>
                            <p className="text-zinc-400 font-medium leading-relaxed">
                                Painel administrativo para gerenciar equipes, aprovar registros e monitorar custos.
                            </p>
                        </div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

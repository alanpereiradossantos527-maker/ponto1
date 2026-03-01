import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconColor?: string;
    className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon: Icon,
    iconColor = 'text-emerald-600',
    className = '',
}) => {
    return (
        <div className={`bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 truncate">{value}</div>
        </div>
    );
};

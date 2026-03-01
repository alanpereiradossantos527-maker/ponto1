import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    loading,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:active:scale-100';

    const variants = {
        primary: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700',
        secondary: 'bg-zinc-900 text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800',
        outline: 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50',
        danger: 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700',
        ghost: 'bg-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                children
            )}
        </button>
    );
};

import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    header,
    footer,
    className = ''
}) => {
    return (
        <div className={`min-h-screen bg-zinc-50 ${className}`}>
            {header}
            <main className="p-6 max-w-lg mx-auto space-y-6">
                {children}
            </main>
            {footer}
        </div>
    );
};

import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    icon: Icon,
    loading = false
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight shadow-sm transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const sizes = {
        sm: 'px-4 py-2 text-xs rounded-xl',
        md: 'px-6 py-3 text-sm rounded-2xl',
        lg: 'px-8 py-4 text-base rounded-[18px]',
    };

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-100 shadow-primary-500/20',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-100',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-100',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        outline: 'border-2 border-slate-100 text-slate-700 hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50/50',
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2"></div>
            ) : Icon && <Icon className={`${children ? 'mr-2.5' : ''} w-5 h-5`} />}
            {children}
        </motion.button>
    );
};

export default Button;

import React from 'react';
import { motion } from 'framer-motion';

const Input = ({ label, type = 'text', placeholder, value, onChange, error, name, icon: Icon, ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`block w-full transition-all duration-300 ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 bg-slate-50 border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-500 ${error ? 'border-rose-300 bg-rose-50 ring-rose-50' : 'border-slate-100 group-hover:border-slate-200'
                        }`}
                    {...props}
                />
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 ml-1 text-xs font-bold text-rose-500"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

export default Input;

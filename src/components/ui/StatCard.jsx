import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-emerald-600 bg-emerald-50',
        orange: 'text-orange-600 bg-orange-50',
        purple: 'text-purple-600 bg-purple-50',
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="premium-card"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>

                    {trend && (
                        <div className={`mt-2 flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <span className="mr-1">{trend === 'up' ? '↑' : '↓'} {trendValue}%</span>
                            <span className="text-slate-400 font-medium">vs last month</span>
                        </div>
                    )}
                </div>

                <div className={`p-3 rounded-2xl ${colors[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;

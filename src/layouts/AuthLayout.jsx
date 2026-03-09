import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-[1000px] flex bg-white rounded-[32px] overflow-hidden shadow-heavy border border-slate-100 min-h-[600px]">

                {/* Left Side: Brand & Visuals */}
                <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between relative overflow-hidden">
                    {/* Subtle abstract pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 text-white">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black border border-white/20">
                                RS
                            </div>
                            <span className="text-xl font-black tracking-tight">R.S. Transport</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 font-display">
                            Management <br /> Simplified.
                        </h2>
                        <p className="text-primary-100 text-lg font-medium opacity-90 max-w-sm">
                            Your comprehensive fleet and logistics management command center.
                        </p>
                    </div>

                    <div className="relative z-10 pt-8 border-t border-white/10">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Enterprise Edition v4.0</p>
                    </div>
                </div>

                {/* Right Side: Identity Forms */}
                <div className="flex-1 flex flex-col justify-center p-8 sm:p-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

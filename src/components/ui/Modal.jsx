import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`relative w-full ${maxWidth} bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 pb-4 shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">{title}</h3>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                            <div className="mt-2">{children}</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

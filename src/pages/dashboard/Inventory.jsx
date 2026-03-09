import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdCategory, MdInventory, MdBusiness, MdSwapHoriz, MdShoppingCart, MdArrowForward } from 'react-icons/md';

const Inventory = () => {
    const { items, categories, suppliers, transactions, purchases } = useSelector(state => state.inventory);

    const menuItems = [
        {
            title: 'Items',
            description: 'Manage individual product variations and stock levels.',
            icon: MdInventory,
            to: '/dashboard/inventory/items',
            count: items.length,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            title: 'Categories',
            description: 'Group products into manageable categories.',
            icon: MdCategory,
            to: '/dashboard/inventory/categories',
            count: categories.length,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Suppliers',
            description: 'Manage your vendors and order contacts.',
            icon: MdBusiness,
            to: '/dashboard/inventory/suppliers',
            count: suppliers.length,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            title: 'Transactions',
            description: 'View history of stock movements (IN/OUT).',
            icon: MdSwapHoriz,
            to: '/dashboard/inventory/transactions',
            count: transactions.length,
            color: 'text-sky-600',
            bg: 'bg-sky-50'
        },
        {
            title: 'Purchases',
            description: 'Track purchase orders placed with suppliers.',
            icon: MdShoppingCart,
            to: '/dashboard/inventory/purchases',
            count: purchases.length,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ];

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Inventory Overview
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Central hub for all your inventory management needs.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-800">
                {menuItems.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-[40px] border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all overflow-hidden flex flex-col h-full"
                    >
                        <Link to={item.to} className="p-8 flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-16 h-16 rounded-[24px] ${item.bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-slate-800">{item.count}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Records</p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black tracking-tight group-hover:text-primary-600 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm font-bold text-slate-500 mt-2">
                                    {item.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center text-sm font-black text-primary-600 group-hover:text-primary-700 transition-colors uppercase tracking-widest">
                                Manage <MdArrowForward className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Inventory;

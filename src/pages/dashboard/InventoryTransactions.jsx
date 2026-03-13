import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdSwapHoriz, MdTrendingUp, MdTrendingDown, MdClose, MdEvent, MdInventory, MdPerson } from 'react-icons/md';
import Button from '../../components/ui/Button';
import TransactionForm from '../../components/forms/TransactionForm';
import { addTransaction, setTransactions, setProducts } from '../../features/inventory/inventorySlice';
import { format } from 'date-fns';
import axiosInstance from '../../services/axios';

const InventoryTransactions = () => {
    const dispatch = useDispatch();
    const { transactions, products } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const promises = [axiosInstance.get('/api/inventory/transactions')];
                if (products.length === 0) promises.push(axiosInstance.get('/api/inventory/products'));

                const results = await Promise.allSettled(promises);

                // Transactions
                if (results[0].status === 'fulfilled' && results[0].value.data) {
                    const mapped = results[0].value.data.map(tx => ({
                        transaction_id: tx.id || tx._id,
                        product_id: tx.productId,
                        transaction_type: tx.type,
                        quantity: tx.quantity,
                        notes: tx.notes || '',
                        employee_name: tx.employeeName || 'System',
                        transaction_date: tx.createdAt || tx.date || new Date().toISOString()
                    }));
                    dispatch(setTransactions(mapped));
                }

                // Products (if not loaded)
                if (products.length === 0 && results[1]?.status === 'fulfilled' && results[1].value.data) {
                    const mappedProducts = results[1].value.data.map(prod => ({
                        product_id: prod.id || prod._id,
                        product_name: prod.name,
                        category_id: prod.categoryId,
                        supplier_id: prod.supplierId,
                        unit_price: prod.unitPrice,
                        quantity_in_stock: prod.quantityInStock,
                        product_image: prod.image || ''
                    }));
                    dispatch(setProducts(mappedProducts));
                }
            } catch (error) {
                console.error('Failed to fetch transactions data:', error);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleCreate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                productId: data.product_id,
                type: data.transaction_type,
                quantity: Number(data.quantity),
                ...(data.notes && data.notes.trim() ? { notes: data.notes.trim() } : {})
            };

            console.log('Transaction payload being sent:', JSON.stringify(payload, null, 2));
            // DEBUG: show payload — remove this alert once working
            const confirmed = window.confirm(`Sending payload:\n${JSON.stringify(payload, null, 2)}\n\nClick OK to proceed.`);
            if (!confirmed) { setIsLoading(false); return; }

            const response = await axiosInstance.post('/api/inventory/transactions', payload);

            const product = products.find(p => String(p.product_id) === String(data.product_id));
            dispatch(addTransaction({
                transaction_id: response.data.id || response.data._id || Date.now(),
                product_id: data.product_id,
                transaction_type: data.transaction_type,
                quantity: Number(data.quantity),
                notes: data.notes || '',
                product_name: product?.product_name || 'Unknown Product',
                employee_name: localStorage.getItem('userName') || 'Current User',
                transaction_date: response.data.createdAt || new Date().toISOString()
            }));
            setIsFormOpen(false);
        } catch (error) {
            console.error('API Error creating transaction:', error);
            console.error('Server response:', error.response?.data);
            const serverMsg = typeof error.response?.data === 'object'
                ? JSON.stringify(error.response.data, null, 2)
                : error.response?.data;
            alert(`Failed to record transaction:\n${serverMsg || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getProductName = (id) => {
        const product = products.find(p => String(p.product_id) === String(id));
        return product ? product.product_name : 'Unknown Product';
    };

    return (
        <div className="space-y-8 p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Stock Movements
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Track all incoming and outgoing inventory transactions.
                    </p>
                </div>
                <Button
                    className="shadow-xl shadow-primary-500/20"
                    onClick={() => setIsFormOpen(true)}
                >
                    <MdSwapHoriz className="w-5 h-5 mr-2" />
                    Record Transaction
                </Button>
            </div>

            {/* Transactions Table/List */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Date & Time</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Product Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Type</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Quantity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Handler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <AnimatePresence mode='popLayout'>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-20">
                                                <MdSwapHoriz className="w-20 h-20 mb-4" />
                                                <p className="text-xl font-black uppercase tracking-widest">No transactions yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    [...transactions].reverse().map((tx) => (
                                        <motion.tr
                                            key={tx.transaction_id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
                                                        <MdEvent className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 leading-none">
                                                            {format(new Date(tx.transaction_date), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                            {format(new Date(tx.transaction_date), 'HH:mm a')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mr-4 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                                        <MdInventory className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-800">
                                                        {getProductName(tx.product_id)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${tx.transaction_type === 'IN'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                                                    : 'bg-rose-50 text-rose-600 border-rose-100/50'
                                                    }`}>
                                                    {tx.transaction_type === 'IN' ? (
                                                        <MdTrendingUp className="w-3 h-3 mr-1.5" />
                                                    ) : (
                                                        <MdTrendingDown className="w-3 h-3 mr-1.5" />
                                                    )}
                                                    Stock {tx.transaction_type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-lg font-black text-slate-800">
                                                    {tx.transaction_type === 'IN' ? '+' : '-'}{tx.quantity}
                                                </p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center text-sm font-bold text-slate-500">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                                                        <MdPerson className="w-4 h-4" />
                                                    </div>
                                                    {tx.employee_name}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        Movement Entry
                                    </h2>
                                    <p className="text-slate-500 font-bold text-sm">
                                        Record stock incoming/outgoing.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>

                            <TransactionForm
                                onSubmit={handleCreate}
                                onCancel={() => setIsFormOpen(false)}
                                loading={isLoading}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventoryTransactions;

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdShoppingCart, MdReceipt, MdBusiness, MdClose, MdEvent, MdDelete, MdInventory } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import PurchaseForm from '../../components/forms/PurchaseForm';
import { addPurchase } from '../../features/inventory/inventorySlice';
import { format } from 'date-fns';

const Purchases = () => {
    const dispatch = useDispatch();
    const { purchases, suppliers, products } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleCreate = (data) => {
        dispatch(addPurchase(data));
        setIsFormOpen(false);
    };

    const getSupplierName = (id) => {
        const sup = suppliers.find(s => String(s.supplier_id) === String(id));
        return sup ? sup.supplier_name : 'Unknown Supplier';
    };

    return (
        <div className="space-y-8 p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Purchase Orders
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Keep track of all wholesale stock purchases.
                    </p>
                </div>
                <Button
                    className="shadow-xl shadow-primary-500/20"
                    onClick={() => setIsFormOpen(true)}
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    New Purchase
                </Button>
            </div>

            {/* Purchases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                    {purchases.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center opacity-30">
                            <MdReceipt className="w-20 h-20 mb-4" />
                            <p className="text-xl font-black uppercase tracking-widest text-slate-400">No purchase records</p>
                        </div>
                    ) : (
                        [...purchases].reverse().map((purchase) => (
                            <motion.div
                                key={purchase.purchase_id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-14 h-14 rounded-[22px] bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                                        <MdShoppingCart className="w-7 h-7" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                                        #{purchase.purchase_id}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                                        {getSupplierName(purchase.supplier_id)}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center mt-2">
                                        <MdEvent className="w-3.5 h-3.5 mr-1.5" />
                                        {format(new Date(purchase.purchase_date), 'MMMM dd, yyyy')}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex -space-x-3 overflow-hidden">
                                        {purchase.details?.slice(0, 3).map((detail, index) => {
                                            const product = products.find(p => String(p.product_id) === String(detail.product_id));
                                            return product?.product_image ? (
                                                <img
                                                    key={index}
                                                    src={product.product_image}
                                                    alt={product.product_name}
                                                    className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm bg-slate-50"
                                                />
                                            ) : (
                                                <div key={index} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm">
                                                    <MdInventory className="w-4 h-4 text-slate-400" />
                                                </div>
                                            );
                                        })}
                                        {purchase.details?.length > 3 && (
                                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center shadow-sm">
                                                <span className="text-xs font-bold text-slate-500">+{purchase.details.length - 3}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Products Purchased</p>
                                        <p className="text-sm font-black text-slate-800">{purchase.details?.length || 0} Products</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                                        <p className="text-xl font-black text-primary-600 flex items-center justify-end"><FaRupeeSign className="w-4 h-4 mr-0.5" />{Number(purchase.total_amount).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Button variant="outline" className="w-full !rounded-2xl !py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 border-slate-100">
                                        View Details
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
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
                            className="relative w-full max-w-3xl bg-white rounded-[44px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        Stock Purchase
                                    </h2>
                                    <p className="text-slate-500 font-bold text-sm">
                                        Create a new purchase order record.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                                <PurchaseForm
                                    onSubmit={handleCreate}
                                    onCancel={() => setIsFormOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Purchases;

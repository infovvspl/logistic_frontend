import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdClose, MdPhone, MdEmail, MdLocationOn, MdPerson } from 'react-icons/md';
import Button from '../../components/ui/Button';
import SupplierForm from '../../components/forms/SupplierForm';
import { addSupplier, updateSupplier, deleteSupplier } from '../../features/inventory/inventorySlice';

const InventorySuppliers = () => {
    const dispatch = useDispatch();
    const { suppliers } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const handleCreate = (data) => {
        dispatch(addSupplier(data));
        setIsFormOpen(false);
    };

    const handleUpdate = (data) => {
        dispatch(updateSupplier({ ...data, supplier_id: editingSupplier.supplier_id }));
        setEditingSupplier(null);
        setIsFormOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            dispatch(deleteSupplier(id));
        }
    };

    const openEditForm = (supplier) => {
        setEditingSupplier(supplier);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-8 p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Suppliers
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Manage your product vendors and contact details.
                    </p>
                </div>
                <Button
                    className="shadow-xl shadow-primary-500/20"
                    onClick={() => {
                        setEditingSupplier(null);
                        setIsFormOpen(true);
                    }}
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    New Supplier
                </Button>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode='popLayout'>
                    {suppliers.map((supplier) => (
                        <motion.div
                            key={supplier.supplier_id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => openEditForm(supplier)}
                                        className="p-2 bg-white shadow-soft text-slate-400 hover:text-primary-600 rounded-xl transition-all"
                                    >
                                        <MdEdit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.supplier_id)}
                                        className="p-2 bg-white shadow-soft text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                    >
                                        <MdDelete className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 border-2 border-slate-50 group-hover:border-primary-400">
                                <MdBusiness className="w-8 h-8" />
                            </div>

                            <div className="mt-8 space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-primary-600 transition-colors">
                                        {supplier.supplier_name}
                                    </h3>
                                    <div className="flex items-center text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">
                                        <MdPerson className="w-4 h-4 mr-2" />
                                        {supplier.contact_person}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 space-y-3">
                                    <div className="flex items-center text-sm font-black text-slate-600">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            <MdPhone className="w-4 h-4" />
                                        </div>
                                        {supplier.phone}
                                    </div>
                                    <div className="flex items-center text-sm font-black text-slate-600">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            <MdEmail className="w-4 h-4" />
                                        </div>
                                        {supplier.email || 'N/A'}
                                    </div>
                                    <div className="flex items-start text-sm font-black text-slate-600">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors mt-1">
                                            <MdLocationOn className="w-4 h-4" />
                                        </div>
                                        <span className="leading-relaxed mt-1">{supplier.address}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
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
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
                                    </h2>
                                    <p className="text-slate-500 font-bold text-sm">
                                        Register a new product vendor.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>

                            <SupplierForm
                                initialData={editingSupplier}
                                onSubmit={editingSupplier ? handleUpdate : handleCreate}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventorySuppliers;

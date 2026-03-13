import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdClose, MdPhone, MdEmail, MdLocationOn, MdPerson } from 'react-icons/md';
import Button from '../../components/ui/Button';
import SupplierForm from '../../components/forms/SupplierForm';
import { setSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../features/inventory/inventorySlice';
import axiosInstance from '../../services/axios';

const InventorySuppliers = () => {
    const dispatch = useDispatch();
    const { suppliers } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    React.useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await axiosInstance.get('/api/inventory/suppliers');
                const mappedSuppliers = response.data.map(sup => ({
                    supplier_id: sup.id || sup._id,
                    supplier_name: sup.name || sup.supplier_name,
                    contact_person: sup.contactPerson || sup.contact_person,
                    phone: sup.phone,
                    email: sup.email,
                    address: sup.address
                }));
                dispatch(setSuppliers(mappedSuppliers));
            } catch (error) {
                console.error("Failed to fetch suppliers:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchSuppliers();
    }, [dispatch]);

    const handleCreate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                name: data.supplier_name,
                contactPerson: data.contact_person,
                phone: data.phone,
                email: data.email,
                address: data.address
            };

            console.log("Creating Supplier with payload:", payload);
            const response = await axiosInstance.post('/api/inventory/suppliers', payload);
            console.log("Supplier creation response:", response.data);

            dispatch(addSupplier({
                supplier_id: response.data.id || response.data._id || Date.now(),
                supplier_name: response.data.name || payload.name,
                contact_person: response.data.contactPerson || response.data.contact_person || payload.contactPerson,
                phone: response.data.phone || payload.phone,
                email: response.data.email || payload.email,
                address: response.data.address || payload.address
            }));

            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error creating supplier:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to create supplier.";
            const details = error.response?.data ? JSON.stringify(error.response.data, null, 2) : "No details";
            alert(`${errorMsg}\n\nDetails:\n${details}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                name: data.supplier_name,
                contactPerson: data.contact_person,
                phone: data.phone,
                email: data.email,
                address: data.address
            };

            console.log("Updating Supplier with payload:", payload);
            await axiosInstance.patch(`/api/inventory/suppliers/${editingSupplier.supplier_id}`, payload);

            dispatch(updateSupplier({
                supplier_id: editingSupplier.supplier_id,
                supplier_name: payload.name,
                contact_person: payload.contactPerson,
                phone: payload.phone,
                email: payload.email,
                address: payload.address
            }));

            setEditingSupplier(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error updating supplier:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update supplier.";
            const details = error.response?.data ? JSON.stringify(error.response.data, null, 2) : "No details";
            alert(`${errorMsg}\n\nDetails:\n${details}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            dispatch(deleteSupplier(id));
        }
    };

    const openEditForm = async (supplier) => {
        try {
            const response = await axiosInstance.get(`/api/inventory/suppliers/${supplier.supplier_id}`);
            const supData = response.data;
            setEditingSupplier({
                supplier_id: supData.id || supData._id || supplier.supplier_id,
                supplier_name: supData.name || supData.supplier_name,
                contact_person: supData.contactPerson || supData.contact_person,
                phone: supData.phone,
                email: supData.email,
                address: supData.address
            });
            setIsFormOpen(true);
        } catch (error) {
            console.error("Failed to fetch supplier details, using local data fallback:", error);
            setEditingSupplier(supplier);
            setIsFormOpen(true);
        }
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
            {isFetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-premium flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <MdBusiness className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Suppliers Found</h3>
                    <p className="text-slate-500 font-bold max-w-md">Add your first product vendor to manage your supply chain effectively.</p>
                </div>
            ) : (
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
            )}

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
                                loading={isLoading}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InventorySuppliers;

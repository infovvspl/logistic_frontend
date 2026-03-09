import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdInventory, MdClose, MdSearch, MdFilterList, MdWarning } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import ItemForm from '../../components/forms/ItemForm';
import { addItem, updateItem, deleteItem } from '../../features/inventory/inventorySlice';

const Items = () => {
    const dispatch = useDispatch();
    const { items, categories, suppliers } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const handleCreate = (data) => {
        dispatch(addItem(data));
        setIsFormOpen(false);
    };

    const handleUpdate = (data) => {
        dispatch(updateItem({ ...data, item_id: editingItem.item_id }));
        setEditingItem(null);
        setIsFormOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            dispatch(deleteItem(id));
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || String(item.category_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const getCategoryName = (id) => {
        const cat = categories.find(c => String(c.category_id) === String(id));
        return cat ? cat.category_name : 'Unknown';
    };

    const getSupplierName = (id) => {
        const sup = suppliers.find(s => String(s.supplier_id) === String(id));
        return sup ? sup.supplier_name : 'Unknown';
    };

    return (
        <div className="space-y-8 p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Inventory Items
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Manage your stock levels and product details.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group min-w-[300px]">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-600 transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-[20px] text-sm font-bold outline-none focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-premium-sm"
                        />
                    </div>
                    <Button
                        className="shadow-xl shadow-primary-500/20"
                        onClick={() => {
                            setEditingItem(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Filters & Stats */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2 bg-white p-2 border border-slate-100 rounded-2xl shadow-premium-sm">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedCategory === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.category_id}
                            onClick={() => setSelectedCategory(cat.category_id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${String(selectedCategory) === String(cat.category_id) ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {cat.category_name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800">
                <AnimatePresence mode='popLayout'>
                    {filteredItems.map((item) => (
                        <motion.div
                            key={item.item_id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[40px] border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all overflow-hidden flex flex-col"
                        >
                            <div className="relative h-48 overflow-hidden bg-slate-50">
                                {item.item_image ? (
                                    <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <MdInventory className="w-20 h-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-sm border border-white/50">
                                        {getCategoryName(item.category_id)}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setIsFormOpen(true);
                                            }}
                                            className="p-2.5 bg-white shadow-xl text-slate-400 hover:text-primary-600 rounded-2xl transition-all"
                                        >
                                            <MdEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.item_id)}
                                            className="p-2.5 bg-white shadow-xl text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                                        >
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-7 flex flex-col flex-1">
                                <h3 className="text-lg font-black tracking-tight group-hover:text-primary-600 transition-colors">
                                    {item.item_name}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Supplier: {getSupplierName(item.supplier_id)}
                                </p>

                                <div className="mt-6 flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                                        <p className="text-xl font-black text-slate-900 flex items-center"><FaRupeeSign className="w-4 h-4 mr-0.5" />{Number(item.unit_price).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                                        <div className="flex items-center">
                                            {item.quantity_in_stock <= 5 && <MdWarning className="text-amber-500 w-4 h-4 mr-1" />}
                                            <p className={`text-xl font-black ${item.quantity_in_stock <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {item.quantity_in_stock}
                                            </p>
                                        </div>
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
                            className="relative w-full max-w-2xl bg-white rounded-[44px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingItem ? 'Edit Item' : 'New Product'}
                                    </h2>
                                    <p className="text-slate-500 font-bold text-sm">
                                        Manage product details and stock.
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
                                <ItemForm
                                    initialData={editingItem}
                                    onSubmit={editingItem ? handleUpdate : handleCreate}
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

export default Items;

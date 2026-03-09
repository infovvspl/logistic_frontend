import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdCategory, MdClose } from 'react-icons/md';
import Button from '../../components/ui/Button';
import CategoryForm from '../../components/forms/CategoryForm';
import { setCategories, addCategory, updateCategory, deleteCategory } from '../../features/inventory/inventorySlice';
import axiosInstance from '../../services/axios';

const InventoryCategories = () => {
    const dispatch = useDispatch();
    const { categories } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.get('/api/inventory/categories');
                // Map backend { id, name, description } to Redux { category_id, category_name, description }
                const mappedCategories = response.data.map(cat => ({
                    category_id: cat.id,
                    category_name: cat.name,
                    description: cat.description
                }));
                dispatch(setCategories(mappedCategories));
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchCategories();
    }, [dispatch]);

    const handleCreate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                name: data.category_name,
                description: data.description
            };

            const response = await axiosInstance.post('/api/inventory/categories', payload);

            // Format from backend response { id, name, description }
            dispatch(addCategory({
                category_id: response.data.id,
                category_name: response.data.name,
                description: response.data.description
            }));

            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error creating category:", error);
            alert(error.response?.data?.message || "Failed to create category. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                name: data.category_name,
                description: data.description
            };

            await axiosInstance.patch(`/api/inventory/categories/${editingCategory.category_id}`, payload);

            dispatch(updateCategory({
                category_id: editingCategory.category_id,
                category_name: payload.name,
                description: payload.description
            }));

            setEditingCategory(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error updating category:", error);
            alert(error.response?.data?.message || "Failed to update category. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            dispatch(deleteCategory(id));
        }
    };

    const openEditForm = async (category) => {
        try {
            // Fetch fresh data from backend
            const response = await axiosInstance.get(`/api/inventory/categories/${category.category_id}`);
            setEditingCategory({
                category_id: response.data.id || category.category_id,
                category_name: response.data.name,
                description: response.data.description
            });
            setIsFormOpen(true);
        } catch (error) {
            console.error("Failed to fetch category details, using local data fallback:", error);
            setEditingCategory(category);
            setIsFormOpen(true);
        }
    };

    return (
        <div className="space-y-8 p-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                        Product Categories
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 tracking-tight">
                        Organize your inventory by categories.
                    </p>
                </div>
                <Button
                    className="shadow-xl shadow-primary-500/20"
                    onClick={() => {
                        setEditingCategory(null);
                        setIsFormOpen(true);
                    }}
                >
                    <MdAdd className="w-5 h-5 mr-2" />
                    New Category
                </Button>
            </div>

            {/* Categories Grid */}
            {isFetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-premium flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <MdCategory className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Categories Found</h3>
                    <p className="text-slate-500 font-bold max-w-md">Get started by creating your first product category to organize your inventory.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {categories.map((category) => (
                            <motion.div
                                key={category.category_id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                        <MdCategory className="w-6 h-6" />
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => openEditForm(category)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                        >
                                            <MdEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.category_id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                                        {category.category_name}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-bold mt-2 line-clamp-2">
                                        {category.description}
                                    </p>
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
                            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingCategory ? 'Edit Category' : 'Create Category'}
                                    </h2>
                                    <p className="text-slate-500 font-bold text-sm">
                                        Fill in the details below.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                                >
                                    <MdClose className="w-6 h-6" />
                                </button>
                            </div>

                            <CategoryForm
                                initialData={editingCategory}
                                onSubmit={editingCategory ? handleUpdate : handleCreate}
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

export default InventoryCategories;

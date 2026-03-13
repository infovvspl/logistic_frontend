import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MdAdd, MdEdit, MdDelete, MdInventory, MdClose, MdSearch, MdFilterList, MdWarning } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import Button from '../../components/ui/Button';
// import Button from '../../components/ui/Button';
import ProductForm from '../../components/forms/ProductForm';
import { setProducts, addProduct, updateProduct, deleteProduct, setCategories, setSuppliers } from '../../features/inventory/inventorySlice';
import axiosInstance from '../../services/axios';

const Products = () => {
    const dispatch = useDispatch();
    const { products, categories, suppliers } = useSelector((state) => state.inventory);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    React.useEffect(() => {
        const fetchAllData = async () => {
            try {
                const promises = [axiosInstance.get('/api/inventory/products')];
                if (categories.length === 0) promises.push(axiosInstance.get('/api/inventory/categories'));
                if (suppliers.length === 0) promises.push(axiosInstance.get('/api/inventory/suppliers'));

                const results = await Promise.allSettled(promises);

                // Products
                if (results[0].status === 'fulfilled' && results[0].value.data) {
                    const mappedProducts = results[0].value.data.map(prod => ({
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

                // Categories
                if (categories.length === 0) {
                    const catRes = results.find(r => r.status === 'fulfilled' && r.value.config.url.includes('categories'));
                    if (catRes && catRes.value.data) {
                        const mappedCategories = catRes.value.data.map(cat => ({
                            category_id: cat.id || cat._id,
                            category_name: cat.name,
                            description: cat.description,
                            item_count: 0
                        }));
                        dispatch(setCategories(mappedCategories));
                    }
                }

                // Suppliers
                if (suppliers.length === 0) {
                    const supRes = results.find(r => r.status === 'fulfilled' && r.value.config.url.includes('suppliers'));
                    if (supRes && supRes.value.data) {
                        const mappedSuppliers = supRes.value.data.map(sup => ({
                            supplier_id: sup.id || sup._id,
                            supplier_name: sup.name,
                            contact_person: sup.contactPerson,
                            phone: sup.phone,
                            email: sup.email,
                            address: sup.address,
                            rating: 5.0
                        }));
                        dispatch(setSuppliers(mappedSuppliers));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch inventory data:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchAllData();
        // Ignoring categories & suppliers from dependencies to only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);
    const handleCreate = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                name: data.product_name,
                categoryId: data.category_id,
                unitPrice: Number(data.unit_price),
                quantityInStock: Number(data.quantity_in_stock),
                supplierId: data.supplier_id
                // image: data.product_image // Ignoring image for backend for now unless requested
            };

            const response = await axiosInstance.post('/api/inventory/products', payload);

            dispatch(addProduct({
                product_id: response.data.id || response.data._id || Date.now(),
                product_name: response.data.name || payload.name,
                category_id: response.data.categoryId || payload.categoryId,
                supplier_id: response.data.supplierId || payload.supplierId,
                unit_price: response.data.unitPrice || payload.unitPrice,
                quantity_in_stock: response.data.quantityInStock || payload.quantityInStock,
                product_image: data.product_image || ''
            }));

            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error creating product:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to create product.";
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
                name: data.product_name,
                categoryId: data.category_id,
                unitPrice: Number(data.unit_price),
                quantityInStock: Number(data.quantity_in_stock),
                supplierId: data.supplier_id
            };

            await axiosInstance.patch(`/api/inventory/products/${editingProduct.product_id}`, payload);

            dispatch(updateProduct({
                product_id: editingProduct.product_id,
                product_name: payload.name,
                category_id: payload.categoryId,
                supplier_id: payload.supplierId,
                unit_price: payload.unitPrice,
                quantity_in_stock: payload.quantityInStock,
                product_image: data.product_image || editingProduct.product_image
            }));

            setEditingProduct(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error("API Error updating product:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Failed to update product.";
            const details = error.response?.data ? JSON.stringify(error.response.data, null, 2) : "No details";
            alert(`${errorMsg}\n\nDetails:\n${details}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            dispatch(deleteProduct(id));
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || String(product.category_id) === String(selectedCategory);
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
                        Inventory Products
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
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-[20px] text-sm font-bold outline-none focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-premium-sm"
                        />
                    </div>
                    <Button
                        className="shadow-xl shadow-primary-500/20"
                        onClick={() => {
                            setEditingProduct(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <MdAdd className="w-5 h-5 mr-2" />
                        Add Product
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
                        All Products
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

            {/* Products Grid */}
            {isFetching ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 border border-slate-100 shadow-premium flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <MdInventory className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Products Found</h3>
                    <p className="text-slate-500 font-bold max-w-md">Add your first product to manage your inventory.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-800">
                    <AnimatePresence mode='popLayout'>
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.product_id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-[40px] border border-slate-100 shadow-premium group hover:border-primary-500/20 transition-all overflow-hidden flex flex-col"
                            >
                                <div className="relative h-48 overflow-hidden bg-slate-50">
                                    {product.product_image ? (
                                        <img src={product.product_image} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <MdInventory className="w-20 h-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-sm border border-white/50">
                                            {getCategoryName(product.category_id)}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await axiosInstance.get(`/api/inventory/products/${product.product_id}`);
                                                        const pData = response.data;
                                                        setEditingProduct({
                                                            product_id: pData.id || pData._id || product.product_id,
                                                            product_name: pData.name || product.product_name,
                                                            category_id: pData.categoryId || product.category_id,
                                                            supplier_id: pData.supplierId || product.supplier_id,
                                                            unit_price: pData.unitPrice || product.unit_price,
                                                            quantity_in_stock: pData.quantityInStock || product.quantity_in_stock,
                                                            product_image: pData.image || product.product_image || ''
                                                        });
                                                        setIsFormOpen(true);
                                                    } catch (error) {
                                                        console.error("Failed to fetch product details:", error);
                                                        setEditingProduct(product);
                                                        setIsFormOpen(true);
                                                    }
                                                }}
                                                className="p-2.5 bg-white shadow-xl text-slate-400 hover:text-primary-600 rounded-2xl transition-all"
                                            >
                                                <MdEdit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.product_id)}
                                                className="p-2.5 bg-white shadow-xl text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                                            >
                                                <MdDelete className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-7 flex flex-col flex-1">
                                    <h3 className="text-lg font-black tracking-tight group-hover:text-primary-600 transition-colors">
                                        {product.product_name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Supplier: {getSupplierName(product.supplier_id)}
                                    </p>

                                    <div className="mt-6 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                                            <p className="text-xl font-black text-slate-900 flex items-center"><FaRupeeSign className="w-4 h-4 mr-0.5" />{Number(product.unit_price).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                                            <div className="flex items-center">
                                                {product.quantity_in_stock <= 5 && <MdWarning className="text-amber-500 w-4 h-4 mr-1" />}
                                                <p className={`text-xl font-black ${product.quantity_in_stock <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {product.quantity_in_stock}
                                                </p>
                                            </div>
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
                            className="relative w-full max-w-2xl bg-white rounded-[44px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                        {editingProduct ? 'Edit Product' : 'New Product'}
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
                                <ProductForm
                                    initialData={editingProduct}
                                    onSubmit={editingProduct ? handleUpdate : handleCreate}
                                    onCancel={() => setIsFormOpen(false)}
                                    loading={isLoading}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;

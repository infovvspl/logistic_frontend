import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MdInventory, MdCategory, MdNumbers, MdBusiness, MdCloudUpload, MdClose } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';

const ProductForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const { categories, suppliers } = useSelector((state) => state.inventory);
    const [imagePreview, setImagePreview] = useState(initialData?.product_image || null);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        defaultValues: initialData || {
            product_name: '',
            category_id: '',
            unit_price: '',
            quantity_in_stock: '',
            supplier_id: '',
            product_image: ''
        }
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setValue('product_image', reader.result); // Using base64 for prototyping
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="md:col-span-2">
                <Input
                    label="Product Name"
                    placeholder="e.g. Engine Oil 5W-30"
                    icon={MdInventory}
                    {...register('product_name', { required: 'Product name is required' })}
                    error={errors.product_name?.message}
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Category
                </label>
                <div className="relative group">
                    <MdCategory className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-600 transition-colors z-10" />
                    <select
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.category_id ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                            }`}
                        {...register('category_id', { required: 'Category is required' })}
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                        ))}
                    </select>
                </div>
                {errors.category_id && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.category_id.message}</p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Supplier
                </label>
                <div className="relative group">
                    <MdBusiness className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-600 transition-colors z-10" />
                    <select
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.supplier_id ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                            }`}
                        {...register('supplier_id', { required: 'Supplier is required' })}
                    >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => (
                            <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                        ))}
                    </select>
                </div>
                {errors.supplier_id && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.supplier_id.message}</p>
                )}
            </div>

            <Input
                label="Unit Price (₹)"
                type="number"
                step="0.01"
                placeholder="0.00"
                icon={FaRupeeSign}
                {...register('unit_price', { required: 'Unit price is required' })}
                error={errors.unit_price?.message}
            />

            <Input
                label="Initial Quantity"
                type="number"
                placeholder="0"
                icon={MdNumbers}
                {...register('quantity_in_stock', { required: 'Quantity is required' })}
                error={errors.quantity_in_stock?.message}
            />

            <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Product Image
                </label>
                <div className={`relative group border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center transition-all ${imagePreview ? 'border-primary-200 bg-primary-50/10' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-primary-500/20'
                    }`}>
                    {imagePreview ? (
                        <div className="relative w-40 h-40 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    setImagePreview(null);
                                    setValue('product_image', '');
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-colors"
                            >
                                <MdClose className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform duration-500">
                                <MdCloudUpload className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Click to upload image</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PNG, JPG or WEBP (Max 2MB)</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="md:col-span-2 flex space-x-3 pt-4 border-t border-slate-50 mt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="flex-1 shadow-xl shadow-primary-500/20"
                    loading={loading}
                >
                    {initialData ? 'Update Product' : 'Add Product'}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;

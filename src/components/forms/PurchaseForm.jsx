import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MdBusiness, MdInventory, MdAdd, MdDelete, MdNumbers } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';

const PurchaseForm = ({ onSubmit, onCancel, loading }) => {
    const { items, suppliers } = useSelector((state) => state.inventory);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            supplier_id: '',
            details: [{ product_id: '', quantity: 1, price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "details"
    });

    const details = watch('details');
    const totalAmount = details.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

    const onFormSubmit = (data) => {
        onSubmit({
            ...data,
            total_amount: totalAmount,
            purchase_date: new Date().toISOString()
        });
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Select Supplier
                </label>
                <div className="relative group">
                    <MdBusiness className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-600 transition-colors z-10" />
                    <select
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.supplier_id ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                            }`}
                        {...register('supplier_id', { required: 'Please select a supplier' })}
                    >
                        <option value="">Select Supplier</option>
                        {suppliers.map(sup => (
                            <option key={sup.supplier_id} value={sup.supplier_id}>{sup.supplier_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[2px]">Purchase Items</h3>
                    <button
                        type="button"
                        onClick={() => append({ product_id: '', quantity: 1, price: 0 })}
                        className="flex items-center text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors"
                    >
                        <MdAdd className="w-4 h-4 mr-1" /> Add Product
                    </button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 p-5 bg-slate-50 rounded-[24px] border border-slate-100 relative group">
                            <div className="col-span-6 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
                                <select
                                    className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl text-xs font-black outline-none focus:border-primary-500 transition-all appearance-none shadow-sm"
                                    {...register(`details.${index}.product_id`, { required: true })}
                                >
                                    <option value="">Select Product</option>
                                    {items.map(item => (
                                        <option key={item.item_id} value={item.item_id}>{item.item_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl text-xs font-black outline-none focus:border-primary-500 transition-all shadow-sm"
                                    {...register(`details.${index}.quantity`, { required: true, min: 1 })}
                                />
                            </div>
                            <div className="col-span-3 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 bg-white border-2 border-transparent rounded-xl text-xs font-black outline-none focus:border-primary-500 transition-all shadow-sm"
                                    {...register(`details.${index}.price`, { required: true })}
                                />
                            </div>
                            <div className="col-span-1 flex items-end pb-1.5">
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    disabled={fields.length === 1}
                                >
                                    <MdDelete className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 bg-primary-600 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-primary-600/30">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] opacity-70">Total Order Amount</p>
                    <p className="text-3xl font-black mt-1 flex items-center"><FaRupeeSign className="w-6 h-6 mr-1" />{totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="bg-white/10 hover:bg-white/20 text-white border-none shadow-none !rounded-2xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-white text-primary-600 hover:bg-slate-50 border-none shadow-xl !rounded-2xl"
                        loading={loading}
                    >
                        Complete Order
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default PurchaseForm;

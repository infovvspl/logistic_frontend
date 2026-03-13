import React from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MdInventory, MdNumbers, MdNotes } from 'react-icons/md';

const TransactionForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const { products } = useSelector((state) => state.inventory);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            product_id: '',
            transaction_type: 'IN',
            quantity: '',
            notes: ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Select */}
            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Select Product
                </label>
                <div className="relative group">
                    <MdInventory className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-600 transition-colors z-10" />
                    <select
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.product_id ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                            }`}
                        {...register('product_id', { required: 'Please select a product' })}
                    >
                        <option value="">
                            {products.length === 0 ? 'No products loaded — visit Products page first' : 'Select Product'}
                        </option>
                        {products.map(product => (
                            <option key={product.product_id} value={product.product_id}>
                                {product.product_name} (Stock: {product.quantity_in_stock})
                            </option>
                        ))}
                    </select>
                </div>
                {errors.product_id && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.product_id.message}</p>
                )}
                {products.length === 0 && (
                    <p className="text-[10px] font-bold text-amber-500 mt-1 ml-1">
                        ⚠ Products list is empty. Visit the Products page first to load them.
                    </p>
                )}
            </div>

            {/* Transaction Type */}
            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                    <label className="cursor-pointer">
                        <input
                            type="radio"
                            value="IN"
                            className="peer hidden"
                            {...register('transaction_type')}
                        />
                        <div className="py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm text-slate-400">
                            Stock In (+)
                        </div>
                    </label>
                    <label className="cursor-pointer">
                        <input
                            type="radio"
                            value="OUT"
                            className="peer hidden"
                            {...register('transaction_type')}
                        />
                        <div className="py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm text-slate-400">
                            Stock Out (-)
                        </div>
                    </label>
                </div>
            </div>

            {/* Quantity */}
            <Input
                label="Quantity"
                type="number"
                placeholder="0"
                icon={MdNumbers}
                {...register('quantity', {
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Minimum quantity is 1' }
                })}
                error={errors.quantity?.message}
            />

            {/* Notes */}
            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Notes
                </label>
                <div className="relative group">
                    <MdNotes className="absolute left-5 top-4 text-slate-400 group-hover:text-primary-600 transition-colors z-10" />
                    <textarea
                        rows={3}
                        placeholder="e.g. Manual stock adjustment"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                        {...register('notes')}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
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
                    Record Transaction
                </Button>
            </div>
        </form>
    );
};

export default TransactionForm;

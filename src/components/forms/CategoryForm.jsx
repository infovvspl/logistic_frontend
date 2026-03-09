import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CategoryForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            category_name: '',
            description: ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
                label="Category Name"
                placeholder="e.g. Spare Parts"
                {...register('category_name', { required: 'Category name is required' })}
                error={errors.category_name?.message}
            />

            <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Description
                </label>
                <textarea
                    className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all min-h-[120px] ${errors.description ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                        }`}
                    placeholder="Enter category description..."
                    {...register('description', { required: 'Description is required' })}
                />
                {errors.description && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.description.message}</p>
                )}
            </div>

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
                    className="flex-1"
                    loading={loading}
                >
                    {initialData ? 'Update Category' : 'Create Category'}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;

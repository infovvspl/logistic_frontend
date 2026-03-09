import React from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MdPerson, MdPhone, MdEmail, MdLocationOn, MdBusiness } from 'react-icons/md';

const SupplierForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            supplier_name: '',
            contact_person: '',
            phone: '',
            email: '',
            address: ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="md:col-span-2">
                <Input
                    label="Supplier Name"
                    placeholder="e.g. Acme Corporation"
                    icon={MdBusiness}
                    {...register('supplier_name', { required: 'Supplier name is required' })}
                    error={errors.supplier_name?.message}
                />
            </div>

            <Input
                label="Contact Person"
                placeholder="e.g. John Doe"
                icon={MdPerson}
                {...register('contact_person', { required: 'Contact person is required' })}
                error={errors.contact_person?.message}
            />

            <Input
                label="Phone Number"
                placeholder="e.g. +91 98765 43210"
                icon={MdPhone}
                {...register('phone', { required: 'Phone number is required' })}
                error={errors.phone?.message}
            />

            <div className="md:col-span-2">
                <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. contact@supplier.com"
                    icon={MdEmail}
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                        }
                    })}
                    error={errors.email?.message}
                />
            </div>

            <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                    Address
                </label>
                <div className="relative group">
                    <MdLocationOn className="absolute left-5 top-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                    <textarea
                        className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all min-h-[100px] ${errors.address ? 'border-rose-100 focus:border-rose-500' : 'border-transparent focus:border-primary-500'
                            }`}
                        placeholder="Enter full address..."
                        {...register('address', { required: 'Address is required' })}
                    />
                </div>
                {errors.address && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.address.message}</p>
                )}
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
                    className="flex-1 shadow-lg shadow-primary-500/20"
                    loading={loading}
                >
                    {initialData ? 'Update Supplier' : 'Add Supplier'}
                </Button>
            </div>
        </form>
    );
};

export default SupplierForm;

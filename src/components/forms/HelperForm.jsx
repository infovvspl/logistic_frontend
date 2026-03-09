import React from 'react';
import { useForm } from 'react-hook-form';
import {
    MdPerson, MdEmail, MdLock, MdPhone
} from 'react-icons/md';
import Input from '../ui/Input';
import Button from '../ui/Button';

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-100">
        <Icon className="text-teal-600" size={20} />
        <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">{title}</h4>
    </div>
);

const HelperForm = ({ onSubmit, initialValues, onCancel }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialValues || {
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'helper'
        }
    });

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 pb-4">
            <section>
                <SectionHeader icon={MdPerson} title="Personal Information" />
                <div className="space-y-5">
                    <Input
                        label="Full Name"
                        placeholder="e.g. Helper One"
                        {...register('name', { required: 'Name required' })}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="helper@example.com"
                        icon={MdEmail}
                        {...register('email', { required: 'Email required' })}
                        error={errors.email?.message}
                    />
                    <Input
                        label="Phone Number"
                        placeholder="9000000003"
                        icon={MdPhone}
                        {...register('phone', { required: 'Phone required' })}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Access Key (Password)"
                        type="password"
                        placeholder="Helper@123"
                        icon={MdLock}
                        {...register('password', { required: !initialValues })}
                        error={errors.password?.message}
                    />
                </div>
            </section>

            <div className="flex space-x-4 pt-4">
                <Button variant="outline" className="flex-1 !rounded-[20px] py-4" onClick={onCancel}>Cancel</Button>
                <Button
                    type="submit"
                    className="flex-1 shadow-2xl shadow-teal-500/30 !rounded-[20px] py-4 bg-teal-600 hover:bg-teal-700"
                    loading={isSubmitting}
                >
                    {initialValues ? 'Sync Overwrites' : 'Confirm'}
                </Button>
            </div>
        </form>
    );
};

export default HelperForm;

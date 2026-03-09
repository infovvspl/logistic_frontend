import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
    MdCameraAlt, MdPerson, MdEmail, MdLock, MdPhone,
    MdBadge, MdAssignment, MdDateRange, MdPublic,
    MdWork, MdContactPhone, MdMap, MdFingerprint, MdCreditCard
} from 'react-icons/md';
import Input from '../ui/Input';
import Button from '../ui/Button';

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-100">
        <Icon className="text-primary-600" size={20} />
        <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">{title}</h4>
    </div>
);

const DriverForm = ({ onSubmit, initialValues, onCancel }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialValues || {
            name: '',
            dateOfBirth: '',
            gender: 'male',
            phone: '',
            email: '',
            password: '',
            role: 'driver',
            permanentAddress: '',
            currentAddress: '',
            drivingLicenseNumber: '',
            licenseType: 'hmv',
            licenseExpiryDate: '',
            licenseIssuingState: '',
            yearsOfExperience: 0,
            preferredVehicleType: 'truck',
            canDriveVehicleTypes: ['truck'],
            aadharNumber: '',
            panNumber: '',
            passportNumber: '',
            emergencyContactName: '',
            emergencyContactRelationship: '',
            emergencyContactPhone: ''
        }
    });


    const onFormSubmit = (data) => {
        // Ensure yearsOfExperience is a number as per JSON requirement
        const formattedData = {
            ...data,
            yearsOfExperience: Number(data.yearsOfExperience)
        };
        onSubmit(formattedData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10 pb-6">

            {/* Section 1: Core Identity */}
            <section>
                <SectionHeader icon={MdPerson} title="Personnel Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Full Name"
                        placeholder="e.g. Driver One"
                        {...register('name', { required: 'Name required' })}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="driver@example.com"
                        icon={MdEmail}
                        {...register('email', { required: 'Email required' })}
                        error={errors.email?.message}
                    />
                    <Input
                        label="Date of Birth"
                        type="date"
                        {...register('dateOfBirth', { required: 'DOB required' })}
                        error={errors.dateOfBirth?.message}
                    />
                    <div className="w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Gender Identity</label>
                        <select
                            className="block w-full transition-all duration-300 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-50"
                            {...register('gender')}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <Input
                        label="Phone number"
                        placeholder="9000000002"
                        icon={MdPhone}
                        {...register('phone', { required: 'Phone required' })}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Access Key (Password)"
                        type="password"
                        placeholder="Driver@123"
                        icon={MdLock}
                        {...register('password', { required: 'Required' })}
                        error={errors.password?.message}
                    />
                </div>
            </section>

            {/* Section 2: Residential Mapping */}
            <section>
                <SectionHeader icon={MdMap} title="Geographic Mapping" />
                <div className="space-y-5">
                    <div className="w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Current Rental Deployment Address</label>
                        <textarea
                            className="block w-full transition-all duration-300 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-500 font-bold"
                            rows="2"
                            placeholder="Rental Colony, Bhubaneswar, Odisha"
                            {...register('currentAddress', { required: 'Current address required' })}
                        ></textarea>
                    </div>
                    <div className="w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Permanent Homeland Address</label>
                        <textarea
                            className="block w-full transition-all duration-300 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-500 font-bold"
                            rows="2"
                            placeholder="Village Road, Puri, Odisha"
                            {...register('permanentAddress', { required: 'Permanent address required' })}
                        ></textarea>
                    </div>
                </div>
            </section>

            {/* Section 3: Professional Assets */}
            <section>
                <SectionHeader icon={MdWork} title="Professional Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Driving License No."
                        placeholder="OD1420110012345"
                        icon={MdBadge}
                        {...register('drivingLicenseNumber', { required: 'Required' })}
                        error={errors.drivingLicenseNumber?.message}
                    />
                    <div className="w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">License Class</label>
                        <select
                            className="block w-full transition-all duration-300 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700"
                            {...register('licenseType')}
                        >
                            <option value="hmv">Heavy Motor (HMV)</option>
                            <option value="lmv">Light Motor (LMV)</option>
                        </select>
                    </div>
                    <Input
                        label="License Expiry"
                        type="date"
                        {...register('licenseExpiryDate', { required: 'Required' })}
                        error={errors.licenseExpiryDate?.message}
                    />
                    <Input
                        label="Issuing State"
                        placeholder="Odisha"
                        icon={MdPublic}
                        {...register('licenseIssuingState', { required: 'Required' })}
                        error={errors.licenseIssuingState?.message}
                    />
                    <Input
                        label="Fleet Exp (Years)"
                        type="number"
                        icon={MdAssignment}
                        {...register('yearsOfExperience', { required: 'Required', valueAsNumber: true })}
                        error={errors.yearsOfExperience?.message}
                    />
                    <div className="w-full">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Preferred Asset</label>
                        <select
                            className="block w-full transition-all duration-300 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700"
                            {...register('preferredVehicleType')}
                        >
                            <option value="truck">Truck</option>
                            <option value="van">Van</option>
                            <option value="pickup">Pickup</option>
                            <option value="Bus">Bus</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Asset Operation Endorsements</label>
                    <div className="flex flex-wrap gap-3">
                        {['truck', 'van', 'pickup'].map(type => (
                            <label key={type} className="flex items-center space-x-2 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-white hover:border-primary-300 hover:shadow-sm transition-all">
                                <input
                                    type="checkbox"
                                    value={type}
                                    {...register('canDriveVehicleTypes')}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-[10px] font-black uppercase text-slate-600">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4: Citizen Ledger */}
            <section>
                <SectionHeader icon={MdFingerprint} title="Government ID" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Aadhar UID"
                        placeholder="123412341234"
                        icon={MdFingerprint}
                        {...register('aadharNumber', { required: 'Required' })}
                        error={errors.aadharNumber?.message}
                    />
                    <Input
                        label="Permanent Account No. (PAN)"
                        placeholder="ABCDE1234F"
                        icon={MdCreditCard}
                        {...register('panNumber', { required: 'Required' })}
                        error={errors.panNumber?.message}
                    />
                    <Input
                        label="Passport Number"
                        placeholder="P1234567"
                        {...register('passportNumber')}
                    />
                </div>
            </section>

            {/* Section 5: Crisis Overwatch */}
            <section>
                <SectionHeader icon={MdContactPhone} title="Emergency Contact" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Guardian Name"
                        placeholder="Suresh Kumar"
                        {...register('emergencyContactName', { required: 'Required' })}
                        error={errors.emergencyContactName?.message}
                    />
                    <Input
                        label="Relationship Node"
                        placeholder="Brother"
                        {...register('emergencyContactRelationship', { required: 'Required' })}
                        error={errors.emergencyContactRelationship?.message}
                    />
                    <Input
                        label="Emergency Phone Line"
                        placeholder="9888888888"
                        icon={MdPhone}
                        {...register('emergencyContactPhone', { required: 'Required' })}
                        error={errors.emergencyContactPhone?.message}
                    />
                </div>
            </section>

            <div className="flex space-x-4 pt-8">
                <Button variant="outline" className="flex-1 !rounded-[20px] py-4" onClick={onCancel}>Cancel</Button>
                <Button
                    type="submit"
                    className="flex-1 shadow-2xl shadow-primary-500/30 !rounded-[20px] py-4"
                    loading={isSubmitting}
                >
                    {initialValues ? 'Sync Overwrites' : 'Confirm'}
                </Button>
            </div>
        </form>
    );
};

export default DriverForm;

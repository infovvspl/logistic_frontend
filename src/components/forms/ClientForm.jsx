import React from 'react';
import { useForm } from 'react-hook-form';
import {
    MdBusiness, MdLocationOn, MdPerson, MdEmail, MdPhone,
    MdLock, MdLayers, MdAssignment, MdGavel, MdLocalShipping,
    MdReceipt, MdVerifiedUser, MdWork
} from 'react-icons/md';
import Input from '../ui/Input';
import Button from '../ui/Button';

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-100">
        <Icon className="text-primary-600" size={20} />
        <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">{title}</h4>
    </div>
);

const ClientForm = ({ onSubmit, initialValues, onCancel }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialValues || {
            companyName: '',
            companyRegistrationNumber: '',
            industryType: '',
            companyAddress: '',
            city: '',
            state: '',
            pincode: '',
            contactPersonName: '',
            designation: '',
            email: '',
            phone: '',
            password: '',
            role: 'client',
            expectedMonthlyVehicleRequirement: 0,
            preferredVehicleTypes: [],
            billingAddress: '',
            gstCertificate: '',
            companyPan: '',
            authorizationLetter: ''
        }
    });

    const onFormSubmit = (data) => {
        // Ensure role is client if not set
        const payload = { ...data, role: data.role || 'client' };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10 pb-6 h-[70vh] overflow-y-auto px-2">
            {/* Section 1: Enterprise Identity */}
            <section>
                <SectionHeader icon={MdBusiness} title="Enterprise Identity" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Company Legal Name"
                        placeholder="Acme Logistics Pvt Ltd"
                        {...register('companyName', { required: 'Company name required' })}
                        error={errors.companyName?.message}
                    />
                    <Input
                        label="Registration Number (CIN/LLPIN)"
                        placeholder="27ABCDE1234F1Z5"
                        icon={MdAssignment}
                        {...register('companyRegistrationNumber', { required: 'Reg number required' })}
                        error={errors.companyRegistrationNumber?.message}
                    />
                    <Input
                        label="Industry Type"
                        placeholder="Logistics / FMCG / Manufacturing"
                        icon={MdLayers}
                        {...register('industryType', { required: 'Industry type required' })}
                        error={errors.industryType?.message}
                    />
                    <Input
                        label="Corporate Role"
                        defaultValue="client"
                        icon={MdVerifiedUser}
                        {...register('role')}
                        readOnly
                    />
                </div>
            </section>

            {/* Section 2: Geographic Base & Billing */}
            <section>
                <SectionHeader icon={MdLocationOn} title="Operational & Billing Base" />
                <div className="space-y-5">
                    <Input
                        label="Registered Company Address"
                        placeholder="Plot 10, Industrial Area..."
                        icon={MdLocationOn}
                        {...register('companyAddress', { required: 'Address required' })}
                        error={errors.companyAddress?.message}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Input
                            label="City"
                            placeholder="Bhubaneswar"
                            {...register('city', { required: 'City required' })}
                            error={errors.city?.message}
                        />
                        <Input
                            label="State"
                            placeholder="Odisha"
                            {...register('state', { required: 'State required' })}
                            error={errors.state?.message}
                        />
                        <Input
                            label="Pincode"
                            placeholder="751001"
                            {...register('pincode', { required: 'Pincode required' })}
                            error={errors.pincode?.message}
                        />
                    </div>
                    <Input
                        label="Billing Address"
                        placeholder="Accounts Dept, Plot 10, Industrial Area..."
                        icon={MdReceipt}
                        {...register('billingAddress', { required: 'Billing address required' })}
                        error={errors.billingAddress?.message}
                    />
                </div>
            </section>

            {/* Section 3: Primary Contact Personnel */}
            <section>
                <SectionHeader icon={MdPerson} title="Contact Officer" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Contact Person Name"
                        placeholder="Client Manager"
                        icon={MdPerson}
                        {...register('contactPersonName', { required: 'Contact name required' })}
                        error={errors.contactPersonName?.message}
                    />
                    <Input
                        label="Designation"
                        placeholder="Operations Manager"
                        icon={MdWork}
                        {...register('designation', { required: 'Designation required' })}
                        error={errors.designation?.message}
                    />
                    <Input
                        label="Secure Email"
                        type="email"
                        placeholder="client@example.com"
                        icon={MdEmail}
                        {...register('email', { required: 'Email required' })}
                        error={errors.email?.message}
                    />
                    <Input
                        label="Direct Line (Phone)"
                        placeholder="9000000001"
                        icon={MdPhone}
                        {...register('phone', { required: 'Phone required' })}
                        error={errors.phone?.message}
                    />
                    <Input
                        label="Account Access Key"
                        type="password"
                        placeholder="Client@123"
                        icon={MdLock}
                        {...register('password', { required: !initialValues })}
                        error={errors.password?.message}
                    />
                </div>
            </section>

            {/* Section 4: Logistics Requirements */}
            <section>
                <SectionHeader icon={MdLocalShipping} title="Logistics Requirements" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Expected Monthly Vehicles"
                        type="number"
                        placeholder="30"
                        icon={MdLocalShipping}
                        {...register('expectedMonthlyVehicleRequirement', { valueAsNumber: true })}
                    />
                    <div className="flex flex-col space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                            Preferred Vehicle Types
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {["truck", "van", "container", "trailer"].map((type) => (
                                <label
                                    key={type}
                                    className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-white hover:border-primary-300 transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        value={type}
                                        {...register("preferredVehicleTypes")}
                                        className="w-4 h-4 accent-primary-600"
                                    />
                                    <span className="text-sm font-bold text-slate-700 capitalize">
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 5: Regulatory Attachments (Strings) */}
            <section>
                <SectionHeader icon={MdGavel} title="Regulatory Credentials" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                        label="GST Certificate Ref"
                        placeholder="Ref ID / Optional"
                        {...register('gstCertificate')}
                    />
                    <Input
                        label="Company PAN Ref"
                        placeholder="ABCDE1234F"
                        {...register('companyPan')}
                    />
                    <Input
                        label="Auth Letter Ref"
                        placeholder="Signed Ref ID"
                        {...register('authorizationLetter')}
                    />
                </div>
            </section>

            <div className="flex space-x-4 pt-8 sticky bottom-0 bg-white pb-2">
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

export default ClientForm;

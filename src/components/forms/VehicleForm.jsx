import React from 'react';
import { useForm } from 'react-hook-form';
import {
    MdLocalShipping, MdSettings, MdCalendarToday, MdColorLens,
    MdEventSeat, MdLayers, MdEvStation,
    MdAssignment, MdVerifiedUser, MdShield, MdGavel,
    MdPerson, MdGpsFixed, MdInfo
} from 'react-icons/md';
import { FaWeight } from "react-icons/fa";
import Input from '../ui/Input';
import Button from '../ui/Button';

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 pb-2 mb-4 border-b border-slate-100">
        <Icon className="text-primary-600" size={20} />
        <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">{title}</h4>
    </div>
);

const VehicleForm = ({ onSubmit, initialValues, onCancel }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialValues || {
            registrationNumber: '',
            type: 'truck',
            make: '',
            model: '',
            manufacturingYear: new Date().getFullYear(),
            color: '',
            loadCapacity: '',
            seatingCapacity: 1,
            bodyType: 'open',
            fuelType: 'diesel',
            rcNumber: '',
            rcExpiryDate: '',
            insuranceCompanyName: '',
            insurancePolicyNumber: '',
            insuranceExpiryDate: '',
            pucExpiryDate: '',
            fitnessCertificateExpiryDate: '',
            permitType: 'national',
            permitExpiryDate: '',
            ownerName: '',
            purchaseDate: '',
            status: 'available',
            gpsDeviceId: ''
        }
    });

    const onFormSubmit = (data) => {
        // 1. Strict casting for numeric fields to match backend expectations
        // 2. Remove empty strings for optional fields to avoid backend validation failure
        // 3. Ensure seatingCapacity is at least 1 (backend constraint)
        const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== "") {
                if (['manufacturingYear', 'loadCapacity', 'seatingCapacity'].includes(key)) {
                    let numValue = Number(value);
                    if (key === 'seatingCapacity') numValue = Math.max(1, numValue || 1);
                    acc[key] = numValue;
                } else {
                    acc[key] = value;
                }
            }
            return acc;
        }, {});

        // Fallback for required numerics if they were somehow stripped or invalid
        if (!cleanedData.manufacturingYear) cleanedData.manufacturingYear = new Date().getFullYear();
        if (cleanedData.loadCapacity === undefined) cleanedData.loadCapacity = 0;
        if (cleanedData.seatingCapacity === undefined) cleanedData.seatingCapacity = 1;

        onSubmit(cleanedData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10 pb-6 h-[75vh] overflow-y-auto px-2 scrollbar-hide">
            {/* Section 1: Core Asset Identity */}
            <section>
                <SectionHeader icon={MdLocalShipping} title="Asset Identity" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                        label="Registration Number"
                        placeholder="OD02AB1234"
                        {...register('registrationNumber', { required: 'Reg number required' })}
                        error={errors.registrationNumber?.message}
                    />
                    <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vehicle Type</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all"
                            {...register('type')}
                        >
                            <option value="truck">Truck</option>
                            <option value="van">Van</option>
                            <option value="trailer">Trailer</option>
                            <option value="container">Container</option>
                        </select>
                    </div>
                    <Input
                        label="Manufacturer (Make)"
                        placeholder="Tata / Ashok Leyland"
                        icon={MdSettings}
                        {...register('make', { required: 'Make required' })}
                        error={errors.make?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <Input
                        label="Model Designation"
                        placeholder="1109 / 407"
                        {...register('model', { required: 'Model required' })}
                        error={errors.model?.message}
                    />
                    <Input
                        label="Manufacturing Year"
                        type="number"
                        icon={MdCalendarToday}
                        {...register('manufacturingYear', { required: 'Year required', valueAsNumber: true })}
                        error={errors.manufacturingYear?.message}
                    />
                </div>
            </section>

            {/* Section 2: Technical Specifications */}
            <section>
                <SectionHeader icon={MdSettings} title="Technical Specifications" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                        label="Color"
                        icon={MdColorLens}
                        {...register('color')}
                    />
                    <Input
                        label="Load Capacity (Tons)"
                        type="number"
                        icon={FaWeight}
                        {...register('loadCapacity', { required: 'Load capacity required', valueAsNumber: true })}
                        error={errors.loadCapacity?.message}
                    />
                    <Input
                        label="Seating Capacity"
                        type="number"
                        min="1"
                        icon={MdEventSeat}
                        {...register('seatingCapacity', { required: 'Seating capacity required', valueAsNumber: true, min: 1 })}
                        error={errors.seatingCapacity?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Body Construction</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all"
                            {...register('bodyType')}
                        >
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                            <option value="container">Container</option>
                            <option value="flatbed">Flatbed</option>
                            <option value="refrigerated">Refrigerated</option>
                        </select>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fuel Propellant</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all"
                            {...register('fuelType')}
                        >
                            <option value="diesel">Diesel</option>
                            <option value="petrol">Petrol</option>
                            <option value="cng">CNG</option>
                            <option value="electric">Electric</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Section 3: Regulatory Credentials */}
            <section>
                <SectionHeader icon={MdAssignment} title="Regulatory Credentials" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="RC Number"
                        icon={MdAssignment}
                        {...register('rcNumber', { required: 'RC number required' })}
                        error={errors.rcNumber?.message}
                    />
                    <Input
                        label="RC Expiry Date"
                        type="date"
                        icon={MdCalendarToday}
                        {...register('rcExpiryDate', { required: 'RC Expiry required' })}
                        error={errors.rcExpiryDate?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                    <Input
                        label="PUC Expiry"
                        type="date"
                        {...register('pucExpiryDate')}
                    />
                    <Input
                        label="Fitness Expiry"
                        type="date"
                        {...register('fitnessCertificateExpiryDate')}
                    />
                    <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Permit Class</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all"
                            {...register('permitType')}
                        >
                            <option value="national">National Permit</option>
                            <option value="state">State Permit</option>
                            <option value="local">Local Permit</option>
                        </select>
                    </div>
                </div>
                <div className="mt-5">
                    <Input
                        label="Permit Expiry Date"
                        type="date"
                        {...register('permitExpiryDate')}
                    />
                </div>
            </section>

            {/* Section 4: Insurance Protocol */}
            <section>
                <SectionHeader icon={MdShield} title="Insurance Protocol" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Insurance Provider"
                        placeholder="ICICI Lombard"
                        icon={MdShield}
                        {...register('insuranceCompanyName')}
                    />
                    <Input
                        label="Policy Number"
                        icon={MdVerifiedUser}
                        {...register('insurancePolicyNumber')}
                    />
                    <Input
                        label="Coverage Expiry"
                        type="date"
                        icon={MdCalendarToday}
                        {...register('insuranceExpiryDate')}
                    />
                </div>
            </section>

            {/* Section 5: Ownership & Monitoring */}
            <section>
                <SectionHeader icon={MdGavel} title="Ownership & Monitoring" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        label="Owner Name"
                        placeholder="Entity or Individual"
                        icon={MdPerson}
                        {...register('ownerName', { required: 'Owner required' })}
                        error={errors.ownerName?.message}
                    />
                    <Input
                        label="Acquisition Date"
                        type="date"
                        icon={MdCalendarToday}
                        {...register('purchaseDate')}
                    />
                    <Input
                        label="GPS Sentinel ID"
                        placeholder="GPS-DEVICE-001"
                        icon={MdGpsFixed}
                        {...register('gpsDeviceId')}
                    />
                    <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operational Status</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all"
                            {...register('status')}
                        >
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="inactive">Inactive</option>
                            <option value="under_maintenance">Under Maintenance</option>
                        </select>
                    </div>
                </div>
            </section>

            <div className="flex space-x-4 pt-8 sticky bottom-0 bg-white">
                <Button variant="outline" className="flex-1 !rounded-[20px] py-4" onClick={onCancel}>Cancel</Button>
                <Button
                    type="submit"
                    className="flex-1 shadow-2xl shadow-primary-500/30 !rounded-[20px] py-4"
                    loading={isSubmitting}
                >
                    {initialValues ? 'Sync Parameters' : 'Deploy'}
                </Button>
            </div>
        </form>
    );
};

export default VehicleForm;

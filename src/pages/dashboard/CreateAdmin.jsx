import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdPersonAdd,
    MdEmail,
    MdPhone,
    MdLock,
    MdVerifiedUser,
    MdArrowBack,
    MdCheckCircle
} from 'react-icons/md';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import axiosInstance from '../../services/axios';

const CreateAdmin = () => {
    const [step, setStep] = useState('initiate'); // 'initiate' or 'verify'
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [verificationId, setVerificationId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateInitiate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInitiate = async (e) => {
        e.preventDefault();
        if (!validateInitiate()) return;

        setLoading(true);
        try {
            // Trim inputs to ensure no hidden characters cause API issues
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password
            };

            // Debug log to verify payload in browser console
            console.log('[CreateAdmin] Initiation Attempt:', payload);

            const response = await axiosInstance.post('/api/users/admin/initiate', payload);

            setVerificationId(response.data.verificationId);
            setStep('verify');
            setStatusMessage({ type: 'success', text: response.data.message || 'OTP sent successfully' });
        } catch (error) {
            console.error('[CreateAdmin] Initiation Failure:', error.response?.data || error);
            setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to initiate admin creation' });
            setErrors(error.response?.data?.errors || {});
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const trimmedOtp = otp.trim();
        if (!trimmedOtp) {
            setErrors({ otp: 'OTP is required' });
            return;
        }

        if (!verificationId) {
            setStatusMessage({ type: 'error', text: 'Verification ID missing. Please try initiating again.' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                verificationId: verificationId,
                code: trimmedOtp
            };

            console.log('[CreateAdmin] Verification Attempt:', payload);

            await axiosInstance.post('/api/users/admin/verify', payload);
            setStep('success');
            setStatusMessage({ type: 'success', text: 'Admin created successfully!' });
        } catch (error) {
            console.error('[CreateAdmin] Verification Failure:', error.response?.data || error);
            setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Invalid OTP' });
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 font-display tracking-tighter">
                    Manage Administrators
                </h1>
                <p className="text-slate-500 font-medium mt-2">
                    Create new admin accounts with secure WhatsApp verification.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'initiate' && (
                    <motion.div
                        key="initiate"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white rounded-[32px] p-8 shadow-premium border border-slate-100"
                    >
                        {statusMessage.text && (
                            <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {statusMessage.text}
                            </div>
                        )}
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                                <MdPersonAdd size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Admin Details</h3>
                                <p className="text-xs text-slate-400 font-medium">Step 1 of 2: Basic Information</p>
                            </div>
                        </div>

                        <form onSubmit={handleInitiate} className="space-y-6">
                            <Input
                                label="Full Name"
                                name="name"
                                placeholder="Enter admin's full name"
                                icon={MdPersonAdd}
                                value={formData.name}
                                onChange={handleInputChange}
                                error={errors.name}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    icon={MdEmail}
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    error={errors.email}
                                />
                                <Input
                                    label="Phone (WhatsApp)"
                                    name="phone"
                                    placeholder="+91..."
                                    icon={MdPhone}
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    error={errors.phone}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={MdLock}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    error={errors.password}
                                />
                                <Input
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    icon={MdLock}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    error={errors.confirmPassword}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 text-base"
                                loading={loading}
                                icon={MdVerifiedUser}
                            >
                                Send Verification OTP
                            </Button>
                        </form>
                    </motion.div>
                )}

                {step === 'verify' && (
                    <motion.div
                        key="verify"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white rounded-[32px] p-8 shadow-premium border border-slate-100"
                    >
                        <button
                            onClick={() => setStep('initiate')}
                            className="flex items-center text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors mb-6"
                        >
                            <MdArrowBack className="mr-2" /> Back to details
                        </button>

                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                                <MdVerifiedUser size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Verify Account</h3>
                                <p className="text-xs text-slate-400 font-medium">Step 2 of 2: OTP Verification</p>
                            </div>
                        </div>

                        {statusMessage.text && (
                            <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="bg-primary-50/50 rounded-2xl p-4 mb-8">
                            <p className="text-sm text-primary-800 font-medium">
                                We've sent a 6-digit verification code to your WhatsApp number <strong>{formData.phone}</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-6">
                            <Input
                                label="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl tracking-[1em] font-black"
                                error={errors.otp}
                            />

                            <Button
                                type="submit"
                                className="w-full py-4 text-base"
                                loading={loading}
                            >
                                Verify & Create Admin
                            </Button>
                        </form>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div
                        key="success"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-white rounded-[32px] p-12 shadow-premium border border-slate-100 text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                            <MdCheckCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Success!</h3>
                        <p className="text-slate-500 font-medium mt-2 mb-8">
                            The admin account for <strong>{formData.name}</strong> has been successfully created.
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setStep('initiate');
                                setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
                                setOtp('');
                            }}
                        >
                            Create Another Admin
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateAdmin;

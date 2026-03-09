import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdEmail, MdLockOutline } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import axiosInstance from '../../services/axios';

const Login = () => {
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState('');
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onLoginSubmit = async (data) => {
        setLoginError('');
        try {
            const response = await axiosInstance.post('/api/auth/login', data);

            // The API stores token in cookies, so we redirect on success (2xx)
            if (response.status === 200 || response.status === 201) {
                // Set a manual flag for ProtectedRoute since we use cookies
                localStorage.setItem('isAuthenticated', 'true');

                // Capture token from various possible keys (token, accessToken, access_token)
                const token = response.data?.token || response.data?.accessToken || response.data?.access_token || response.data?.data?.token;
                console.log('Login Response Data:', response.data);
                if (token) {
                    console.log('Token Captured and Saved:', token);
                    localStorage.setItem('token', token);
                } else {
                    console.warn('No token found in response data. Relying on cookies?');
                }
                window.location.href = '/dashboard';
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid credentials or server error. Please try again.';
            setLoginError(message);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 font-display uppercase tracking-tight">Log In</h3>
                <p className="text-slate-500 font-medium tracking-tight">Access your logistics command center.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onLoginSubmit)}>
                <Input
                    label=" Email"
                    type="email"
                    placeholder="admin@rstransport.com"
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

                <div className="space-y-2">
                    <Input
                        label=" Password"
                        type="password"
                        placeholder="••••••••"
                        icon={MdLockOutline}
                        {...register('password', { required: 'Password is required' })}
                        error={errors.password?.message}
                    />
                    <div className="flex justify-end">
                        <Link to="#" className="text-sm font-bold text-primary-600 hover:text-primary-700">
                            Recovery Key?
                        </Link>
                    </div>
                </div>

                {loginError && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                        <p className="text-xs font-bold text-rose-500 text-center">{loginError}</p>
                    </div>
                )}

                <div className="pt-2">
                    <Button
                        className="w-full shadow-xl shadow-primary-500/20"
                        size="lg"
                        type="submit"
                        loading={isSubmitting}
                    >
                        Login
                    </Button>
                </div>
            </form>

            {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-white px-4 text-slate-300 tracking-[4px]">Enterprise SSO</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full !rounded-2xl" size="md">Azure Directory</Button>
                <Button variant="outline" className="w-full !rounded-2xl" size="md">Google Workspace</Button>
            </div> */}

            <p className="text-center text-sm font-bold text-slate-400">
                New to the platform? <Link to="/auth/signup" className="text-primary-600 hover:underline">Sign up</Link>
            </p>
        </div>
    );
};

export default Login;
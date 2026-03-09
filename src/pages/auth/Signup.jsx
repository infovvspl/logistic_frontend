import React from 'react';
import { Link } from 'react-router-dom';
import { MdEmail, MdLockOutline, MdPersonOutline, MdBusiness } from 'react-icons/md';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Signup = () => {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 font-display">Create Account</h3>
                <p className="text-slate-500 font-medium">Join our transport network and start managing your fleet.</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" placeholder="John" icon={MdPersonOutline} />
                    <Input label="Last Name" placeholder="Doe" icon={MdPersonOutline} />
                </div>

                <Input label="Company" placeholder="R.S.Transport Ltd." icon={MdBusiness} />

                <Input
                    label="Corporate Email"
                    type="email"
                    placeholder="admin@enterprise.com"
                    icon={MdEmail}
                />

                <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    icon={MdLockOutline}
                />

                <div className="flex items-start space-x-3 pt-2">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-200 text-primary-600 focus:ring-primary-100" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        I agree to the <Link to="#" className="text-primary-600 font-bold hover:underline">Terms of Service</Link> and <Link to="#" className="text-primary-600 font-bold hover:underline">Privacy Policy</Link>.
                    </p>
                </div>

                <div className="pt-2">
                    <Button className="w-full" size="lg">Initialize Account</Button>
                </div>
            </form>

            <p className="text-center text-sm font-medium text-slate-600">
                Already have an account? <Link to="/auth/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
            </p>
        </div>
    );
};

export default Signup;

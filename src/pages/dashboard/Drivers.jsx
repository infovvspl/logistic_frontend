import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdSearch, MdFilterList, MdMoreVert, MdPhone,
    MdAssignmentInd, MdPerson, MdVerified, MdEdit, MdDelete,
    MdBadge, MdFingerprint, MdCreditCard, MdContactPhone
} from 'react-icons/md';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DriverForm from '../../components/forms/DriverForm';
import { addDriver, deleteDriver, setDrivers } from '../../features/drivers/driverSlice';
import axiosInstance from '../../services/axios';

const Drivers = () => {
    const dispatch = useDispatch();
    const driversData = useSelector(state => state.drivers.list);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching Drivers Ledger (GET /api/users/onboard)...');
            let response;
            try {
                response = await axiosInstance.get('/api/drivers');
            } catch (err) {
                // console.group('Onboarding API Error');
                // console.error('Status:', err.response?.status);
                // console.error('Data:', err.response?.data);
                // console.error('Headers:', err.response?.headers);
                // console.groupEnd();

                if (err.response?.status === 500 || err.response?.status === 404) {
                    console.log('Onboard endpoint failed, trying fallback /api/drivers');
                    response = await axiosInstance.get('/api/drivers');
                } else {
                    throw err;
                }
            }

            const list = response.data.data || response.data || [];
            if (!Array.isArray(list)) {
                throw new Error('Invalid data format received from server');
            }

            const isFallback = response.config?.url?.includes('/api/drivers');
            const driversOnly = isFallback ? list : list.filter(user => user.role === 'driver');

            // Normalize Data: Map varied API field names to standard UI keys
            const normalized = driversOnly.map((d, index) => {
                const name = d.name || d.fullName || d.driverName || d.user?.name || 'Unnamed Driver';
                const email = d.email || d.emailAddress || d.contactEmail || d.user?.email || 'N/A';
                const phone = d.phone || d.phoneNumber || d.contactNumber || d.user?.phone || 'N/A';

                return {
                    ...d,
                    _id: d._id || d.id || `drv-${index}-${name.replace(/\s+/g, '').toLowerCase()}`,
                    name,
                    email,
                    phone
                };
            });

            dispatch(setDrivers(normalized));
        } catch (error) {
            console.error('Fetch Failed:', error.response?.status, error.response?.data);
            setError(error.response?.data?.message || 'Failed to synchronize with workforce ledger.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterDriver = async (payload) => {
        try {
            console.log('Onboarding Payload:', payload);
            const response = await axiosInstance.post('/api/users/onboard', payload);

            if (response.status === 200 || response.status === 201) {
                // Refresh list to get the latest data from server
                fetchDrivers();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Operation failed:', error);
            const msg = error.response?.data?.message || 'Operation failed. Please check registry data.';
            alert(msg);
        }
    };

    const handleDeleteDriver = (id) => {
        if (window.confirm('Wipe personnel record from the local fleet intelligence?')) {
            dispatch(deleteDriver(id));
            setActiveMenuId(null);
        }
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const columns = [
        {
            header: 'Personnel Identity', accessor: 'name', render: (row) => (
                <div className="flex items-center group/driver">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mr-4 overflow-hidden shadow-xl group-hover/driver:scale-105 transition-all">
                        <img src={`https://ui-avatars.com/api/?name=${row.name}&background=0f172a&color=fff&bold=true`} alt={row.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <span className="font-black text-slate-800 text-[15px] tracking-tight">{row.name}</span>
                            <MdVerified className="ml-1.5 text-primary-500" size={14} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Secure Channel', accessor: 'email', render: (row) => (
                <div className="flex flex-col text-xs font-bold text-slate-600">
                    <span className="font-black text-slate-700">{row.email}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Email</span>
                </div>
            )
        },
        {
            header: 'Asset Credentials', accessor: 'drivingLicenseNumber', render: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        <MdBadge size={16} className="text-primary-500 mr-2" />
                        <span>{row.drivingLicenseNumber}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[9px] font-black bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-md border border-primary-100 uppercase">{row.licenseType}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Exp: {row.licenseExpiryDate}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Citizen Ledger', accessor: 'identity', render: (row) => (
                <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center"><MdFingerprint size={12} className="mr-1 text-slate-300" /> UID: ****{row.aadharNumber?.slice(-4) || '----'}</span>
                    <span className="flex items-center font-bold text-slate-400 uppercase tracking-widest leading-none"><MdCreditCard size={12} className="mr-1 text-slate-300" /> PAN: {row.panNumber || '----'}</span>
                </div>
            )
        },
        {
            header: 'Personnel Details', accessor: 'exp', render: (row) => (
                <div className="flex flex-col items-start gap-1">
                    <span className="text-xs font-black text-slate-700 tracking-tight">{row.yearsOfExperience || 0} YRS EXP</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
                        {row.preferredVehicleType || 'TRUCK'}
                    </span>
                </div>
            )
        },
        {
            header: '', accessor: 'actions', render: (row) => (
                <div className="relative">
                    <button
                        onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeMenuId === row._id ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <MdMoreVert size={24} />
                    </button>
                    <AnimatePresence>
                        {activeMenuId === row._id && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)}></div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-50 z-20 overflow-hidden"
                                >
                                    <div className="p-2 space-y-1">
                                        <button onClick={() => alert(`FULL INTEL: Driver: ${row.name}\nPhone: ${row.phone}\nLicense: ${row.drivingLicenseNumber}\nUID: ${row.aadharNumber || 'N/A'}`)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider">
                                            <MdAssignmentInd className="mr-3" size={18} />
                                            View Full
                                        </button>
                                        <button onClick={() => openEditModal(row)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider">
                                            <MdEdit className="mr-3" size={18} />
                                            Edit Profile
                                        </button>
                                        <div className="border-t border-slate-50 my-1"></div>
                                        <button onClick={() => handleDeleteDriver(row._id)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-wider">
                                            <MdDelete className="mr-3" size={18} />
                                            Terminate
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            )
        },
    ];

    const filteredDrivers = (driversData || []).filter(driver =>
        (driver.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (driver.drivingLicenseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (driver.aadharNumber || '').includes(searchTerm)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-primary-600 font-bold text-[10px] uppercase tracking-[4pt] mb-3">
                        <MdPerson size={16} />
                        <span>Driver Information</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter">Truck Drivers</h2>
                    <p className="text-slate-500 font-medium text-lg mt-2 tracking-tight">Access the highly-secured registry of verified carrier identities and operational credentials.</p>
                </div>
                <Button icon={MdAdd} size="lg" className="shadow-2xl shadow-primary-500/30 !rounded-2xl" onClick={() => { setEditingDriver(null); setIsModalOpen(true); }}>
                    Add Driver
                </Button>
            </div>

            <div className="premium-card !p-4 flex flex-col lg:flex-row lg:items-center gap-4 border border-slate-100 shadow-sm relative">
                <div className="relative flex-1 group">
                    <MdSearch size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan Workforce Ledger: Query by Name, License, UID or PAN..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" icon={MdFilterList} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6 border-slate-200">Protocols</Button>
                    <Button variant="secondary" icon={MdAssignmentInd} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6" onClick={fetchDrivers}>Refresh Audit</Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-12 left-0 right-0 flex items-center justify-between bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl"
                    >
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center">
                            <MdFilterList className="mr-2" size={14} />
                            Sync Interrupted: {error}
                        </p>
                        <button onClick={fetchDrivers} className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">Retry Sync</button>
                    </motion.div>
                )}
            </div>

            <div className={`premium-card !p-0 border border-slate-50 shadow-heavy rounded-[32px] transition-all ${error ? 'mt-12' : ''}`}>
                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Accessing Ledger...</p>
                    </div>
                ) : (
                    <Table columns={columns} data={filteredDrivers} />
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Asset Synchronization Terminal" : "Drivers Details"} maxWidth="max-w-4xl">
                <DriverForm
                    onSubmit={handleRegisterDriver}
                    onCancel={() => setIsModalOpen(false)}
                    initialValues={editingDriver}
                />
            </Modal>

        </div >
    );
};

export default Drivers;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdSearch, MdFilterList, MdSupervisorAccount,
    MdVerifiedUser, MdStar, MdMoreVert, MdEdit, MdDelete,
    MdPhone, MdAssignmentInd, MdPerson, MdBadge, MdWork
} from 'react-icons/md';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import HelperForm from '../../components/forms/HelperForm';
import { setHelpers, deleteHelper } from '../../features/helpers/helperSlice';
import axiosInstance from '../../services/axios';

const Helpers = () => {
    const dispatch = useDispatch();
    const helpersData = useSelector(state => state.helpers.list);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHelper, setEditingHelper] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHelpers();
    }, []);

    const fetchHelpers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching Support Personnel (GET /api/users?role=helper)...');
            const response = await axiosInstance.get('/api/users?role=helper');

            const list = response.data.data || response.data || [];
            if (!Array.isArray(list)) {
                throw new Error('Invalid workforce data format');
            }

            // Normalize Data: Map varied API field names to standard UI keys
            const normalized = list.map((h, index) => {
                const name = h.name || h.fullName || h.helperName || h.user?.name || 'Unnamed Personnel';
                const email = h.email || h.emailAddress || h.contactEmail || h.user?.email || 'N/A';
                const phone = h.phone || h.phoneNumber || h.contactNumber || h.user?.phone || 'N/A';

                return {
                    ...h,
                    _id: String(h._id || h.id || h.userId || h.user?._id || `hlp-${index}`),
                    name,
                    email,
                    phone
                };
            });

            dispatch(setHelpers(normalized));
        } catch (error) {
            console.error('Fetch Failed:', error.response?.status, error.response?.data);
            setError('Failed to synchronize with workforce support roster.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterHelper = async (payload) => {
        try {
            console.log('Initiating Helper Operation:', payload);
            const endpoint = editingHelper ? `/api/users/update/${editingHelper._id}` : '/api/users/onboard';
            const method = editingHelper ? 'patch' : 'post';

            const response = await axiosInstance[method](endpoint, payload);

            if (response.status === 200 || response.status === 201) {
                fetchHelpers();
                setIsModalOpen(false);
                setEditingHelper(null);
            }
        } catch (error) {
            console.error('Operation failed:', error);
            const msg = error.response?.data?.message || 'Operation failed. Please check registry data.';
            alert(msg);
        }
    };

    const handleEditHelper = (helper) => {
        setEditingHelper(helper);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteHelper = (id) => {
        if (window.confirm('Wipe personnel record from the support force?')) {
            dispatch(deleteHelper(id));
            setActiveMenuId(null);
        }
    };

    const columns = [
        {
            header: 'Support Force', accessor: 'name', render: (row) => (
                <div className="flex items-center group/helper">
                    <div className="w-12 h-12 rounded-[18px] bg-slate-50 text-slate-400 flex items-center justify-center mr-4 border border-slate-200/50 shadow-inner group-hover/helper:bg-teal-50 group-hover/helper:text-teal-600 transition-all overflow-hidden">
                        {/* <img src={`https://ui-avatars.cc/api/?name=${row.name}&background=f0fdfa&color=0d9488&bold=true`} alt={row.name} className="opacity-70 group-hover/helper:opacity-100 transition-opacity" /> */}
                        <img src={`https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg?semt=ais_rp_progressive&w=740&q=80`} alt={row.name} className="opacity-70 group-hover/helper:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <span className="font-black text-slate-800 text-[15px] tracking-tight">{row.name}</span>
                            <MdVerifiedUser className="ml-1.5 text-teal-500" size={14} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.phone}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Communication', accessor: 'email', render: (row) => (
                <div className="flex flex-col text-xs">
                    <span className="font-black text-slate-700">{row.email}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Channel</span>
                </div>
            )
        },
        {
            header: 'Operational Node', accessor: 'role', render: (row) => (
                <div className="flex items-center text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 uppercase tracking-widest">
                    {row.role || 'Personnel'}
                </div>
            )
        },
        {
            header: '', accessor: 'actions', render: (row) => (
                <div className="relative">
                    <button
                        onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeMenuId === row._id ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-700'}`}
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
                                        <button
                                            onClick={() => handleEditHelper(row)}
                                            className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-all uppercase tracking-wider"
                                        >
                                            <MdEdit className="mr-3" size={18} />
                                            Update
                                        </button>
                                        <div className="border-t border-slate-50 my-1"></div>
                                        <button onClick={() => handleDeleteHelper(row._id)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-wider">
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

    const filteredHelpers = (helpersData || []).filter(helper =>
        (helper.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (helper.phone || '').includes(searchTerm)
    );

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-teal-600 font-bold text-[10px] uppercase tracking-[4pt] mb-3">
                        <MdSupervisorAccount size={16} />
                        <span>Helpers Information</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter">Helper</h2>
                    <p className="text-slate-500 font-medium text-lg mt-2 tracking-tight">Roster of logistics assistance staff and rapid-response helpers for asset fulfillment.</p>
                </div>
                <Button icon={MdAdd} size="lg" className="bg-teal-600 hover:bg-teal-700 shadow-xl shadow-teal-500/20 !rounded-2xl" onClick={() => setIsModalOpen(true)}>
                    Add Helper
                </Button>
            </div>

            {/* Staff Search */}
            <div className="premium-card !p-4 flex flex-col lg:flex-row lg:items-center gap-4 border border-slate-100 shadow-sm relative">
                <div className="relative flex-1 group">
                    <MdSearch size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan Workforce Ledger: Identity query by name, role, or serial..."
                        className="w-full bg-slate-50/50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold focus:ring-4 focus:ring-teal-100 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" icon={MdFilterList} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6 border-slate-200">Deployed Only</Button>
                    <Button variant="secondary" icon={MdAssignmentInd} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6" onClick={fetchHelpers}>Refresh Audit</Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-12 left-0 right-0 flex items-center justify-between bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl"
                    >
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center">
                            <MdFilterList className="mr-2" size={14} />
                            Sync Interrupted: {error}
                        </p>
                        <button onClick={fetchHelpers} className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">Retry Sync</button>
                    </motion.div>
                )}
            </div>

            <div className={`premium-card !p-0 border border-slate-50 shadow-heavy rounded-[32px] transition-all ${error ? 'mt-12' : ''}`}>
                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Accessing Ledger...</p>
                    </div>
                ) : (
                    <Table columns={columns} data={filteredHelpers} />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingHelper(null);
                }}
                title={editingHelper ? "Helper Update Portal" : "Helper's Details"}
                maxWidth="max-w-4xl"
            >
                <HelperForm
                    onSubmit={handleRegisterHelper}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingHelper(null);
                    }}
                    initialValues={editingHelper}
                />
            </Modal>
        </div>
    );
};

export default Helpers;

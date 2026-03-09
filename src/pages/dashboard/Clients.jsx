import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdSearch, MdFilterList, MdBusiness,
    MdLocationOn, MdEmail, MdLayers, MdArrowOutward, MdPhone, MdLocalShipping,
    MdMoreVert, MdEdit, MdDelete, MdAssignmentInd
} from 'react-icons/md';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ClientForm from '../../components/forms/ClientForm';
import { setClients, deleteClient } from '../../features/clients/clientSlice';
import axiosInstance from '../../services/axios';

const Clients = () => {
    const dispatch = useDispatch();
    const clientsData = useSelector(state => state.clients.list);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Fetching Enterprise Partners (GET /api/users?role=client)...');
            const response = await axiosInstance.get('/api/users?role=client');

            const list = response.data.data || response.data || [];
            if (!Array.isArray(list)) {
                throw new Error('Invalid partner data format');
            }

            // Normalize Data: Map varied API field names to standard enterprise keys
            const normalized = list.map((c, index) => {
                const companyName = c.companyName || c.name || c.user?.name || 'Unnamed Enterprise';
                const contactPersonName = c.contactPersonName || c.contactPerson || c.name || c.user?.name || 'N/A';
                const email = c.email || c.contactEmail || c.user?.email || 'N/A';
                const phone = c.phone || c.contactNumber || c.user?.phone || 'N/A';

                return {
                    ...c,
                    _id: c._id || c.id || c.userId || c.user?._id || `cli-${index}`,
                    companyName,
                    contactPersonName,
                    email,
                    phone,
                    industryType: c.industryType || c.industry || 'General',
                };
            });

            dispatch(setClients(normalized));
        } catch (error) {
            console.error('Fetch Failed:', error.response?.status, error.response?.data);
            setError('Failed to synchronize with enterprise partner registry.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterClient = async (payload) => {
        try {
            console.log('Initiating Partner Onboarding:', payload);
            const endpoint = editingClient ? `/api/users/update/${editingClient._id}` : '/api/users/onboard';
            const method = editingClient ? 'patch' : 'post';

            const response = await axiosInstance[method](endpoint, payload);

            if (response.status === 200 || response.status === 201) {
                fetchClients();
                setIsModalOpen(false);
                setEditingClient(null);
            }
        } catch (error) {
            console.error('Operation failed:', error);
            const msg = error.response?.data?.message || 'Operation failed. Please check registry data.';
            alert(msg);
        }
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDeleteClient = (id) => {
        if (window.confirm('Terminate enterprise partnership and wipe records?')) {
            dispatch(deleteClient(id));
            setActiveMenuId(null);
        }
    };

    const columns = [
        {
            header: 'Commercial Entity', accessor: 'companyName', render: (row) => (
                <div className="flex items-center group/client">
                    <div className="w-12 h-12 rounded-[20px] bg-slate-900 text-white flex items-center justify-center mr-4 shadow-xl group-hover/client:scale-105 transition-all overflow-hidden border border-slate-700">
                        <img
                            src={`https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3407.jpg?semt=ais_rp_progressive&w=740&q=80`}
                            alt={row.companyName}
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-[15px] tracking-tight">{row.companyName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">REG: {row.companyRegistrationNumber || 'N/A'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Liaison Officer', accessor: 'contactPersonName', render: (row) => (
                <div className="flex flex-col text-xs space-y-0.5">
                    <span className="font-black text-slate-700">{row.contactPersonName}</span>
                    <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tighter">{row.designation || 'Manager'}</span>
                    <div className="flex items-center text-[10px] font-bold text-slate-400">
                        <MdPhone size={10} className="mr-1" /> {row.phone}
                    </div>
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
                                        <button
                                            onClick={() => handleEditClient(row)}
                                            className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider"
                                        >
                                            <MdEdit className="mr-3" size={18} />
                                            Update
                                        </button>
                                        <div className="border-t border-slate-50 my-1"></div>
                                        <button onClick={() => handleDeleteClient(row._id)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-wider">
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

    const filteredClients = (clientsData || []).filter(client =>
        (client.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactPersonName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.industryType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header Bar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-primary-600 font-bold text-[10px] uppercase tracking-[4pt] mb-3">
                        <MdBusiness size={16} />
                        <span>Corporate Partnership Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter leading-none">Clients</h2>
                    <p className="text-slate-500 font-medium text-lg mt-3">Portfolio of enterprise shipping partners and collaborative global entities.</p>
                </div>
                <Button icon={MdAdd} size="lg" className="shadow-2xl shadow-primary-500/20 !rounded-2xl" onClick={() => setIsModalOpen(true)}>Add Clients</Button>
            </div>

            {/* Advanced Search */}
            <div className="premium-card !p-4 flex flex-col lg:flex-row lg:items-center gap-4 border border-slate-100 shadow-sm relative">
                <div className="relative flex-1 group">
                    <MdSearch size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Scan Enterprise Accounts: Query by name, ID, or sector..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" icon={MdFilterList} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6 border-slate-200">Sector Audit</Button>
                    <Button variant="secondary" icon={MdAssignmentInd} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6" onClick={fetchClients}>Refresh List</Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-12 left-0 right-0 flex items-center justify-between bg-primary-50 border border-primary-100 px-4 py-2 rounded-xl"
                    >
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center">
                            <MdFilterList className="mr-2" size={14} />
                            Sync Interrupted: {error}
                        </p>
                        <button onClick={fetchClients} className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">Retry Sync</button>
                    </motion.div>
                )}
            </div>

            <div className={`premium-card !p-0 border border-slate-50 shadow-heavy rounded-[32px] transition-all ${error ? 'mt-12' : ''}`}>
                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Accessing Registry...</p>
                    </div>
                ) : (
                    <Table columns={columns} data={filteredClients} />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingClient(null);
                }}
                title={editingClient ? "Partner Registry Update" : "Client Details"}
                maxWidth="max-w-4xl"
            >
                <ClientForm
                    onSubmit={handleRegisterClient}
                    onCancel={() => {
                        setIsModalOpen(false);
                        setEditingClient(null);
                    }}
                    initialValues={editingClient}
                />
            </Modal>

            {/* Grid Footer Insight */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-slate-900/40 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Growth Index</p>
                        <p className="text-2xl font-black tracking-tighter">+18.5% <span className="text-xs text-emerald-400 font-bold underline ml-2 cursor-help">MoM</span></p>
                    </div>
                    <MdLayers size={40} className="text-slate-800" />
                </div>
            </div> */}
        </div>
    );
};

export default Clients;

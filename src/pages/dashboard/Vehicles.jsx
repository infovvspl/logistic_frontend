import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdSearch, MdFilterList, MdDirectionsCar, MdLocalShipping,
    MdSettings, MdEvStation, MdNumbers, MdMoreVert, MdEdit,
    MdDelete, MdGpsFixed, MdAssignment, MdInfo
} from 'react-icons/md';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import VehicleForm from '../../components/forms/VehicleForm';
import { setVehicles, deleteVehicle, setLoading, setError } from '../../features/vehicles/vehicleSlice';
import axiosInstance from '../../services/axios';

const Vehicles = () => {
    const dispatch = useDispatch();
    const { list: vehiclesData, loading: isLoading, error } = useSelector(state => state.vehicles);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        dispatch(setLoading(true));
        try {
            console.log('Accessing Fleet Registry (GET /api/vehicles)...');
            const response = await axiosInstance.get('/api/vehicles');
            const data = response.data.data || response.data || [];

            // Normalize IDs for menu targeting
            const normalized = data.map((v, index) => ({
                ...v,
                _id: v._id || v.id || `veh-${index}-${v.registrationNumber?.toLowerCase()}`
            }));

            dispatch(setVehicles(normalized));
        } catch (error) {
            console.error('Fleet Sync Failed:', error);
            dispatch(setError('Failed to synchronize with fleet registry.'));
        }
    };

    const handleRegisterVehicle = async (payload) => {
        try {
            if (editingVehicle) {
                console.log('Synchronizing Asset Parameters:', payload);
                await axiosInstance.patch(`/api/vehicles/${editingVehicle._id}`, payload);
            } else {
                console.log('Deploying New Asset:', payload);
                await axiosInstance.post('/api/vehicles', payload);
            }
            fetchVehicles();
            setEditingVehicle(null);
            setIsModalOpen(false);
        } catch (error) {
            const errorData = error.response?.data;
            console.error('Asset operation failed:', errorData || error);

            // Extract and format specific validation errors if available
            let msg = editingVehicle ? 'Synchronization failed.' : 'Onboarding failed.';
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                msg = `Validation Failed:\n${errorData.errors.join('\n')}`;
            } else if (errorData?.message) {
                msg = errorData.message;
            }

            alert(msg);
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (window.confirm('Decommission asset and wipe telemetry records?')) {
            try {
                await axiosInstance.delete(`/api/vehicles/${id}`);
                dispatch(deleteVehicle(id));
                setActiveMenuId(null);
            } catch (error) {
                console.error('Decommissioning failed:', error);
                alert('Failed to decommission asset. Registry locked.');
            }
        }
    };

    const columns = [
        {
            header: 'Asset Identity', accessor: 'registrationNumber', render: (row) => (
                <div className="flex items-center group/item">
                    <div className="w-14 h-14 rounded-[22px] bg-slate-900 text-white flex items-center justify-center mr-4 shadow-xl group-hover/item:scale-110 group-hover/item:bg-primary-600 transition-all duration-500 overflow-hidden border border-slate-700">
                        <div className="flex flex-col items-center">
                            <MdLocalShipping size={24} />
                            <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{row.type}</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-[15px] tracking-tight">{row.make} {row.model}</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{row.registrationNumber}</span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.manufacturingYear}</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Telemetry & Unit', accessor: 'gpsDeviceId', render: (row) => (
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-[11px] font-black text-slate-700">
                        <MdGpsFixed size={14} className="mr-2 text-primary-500" />
                        {row.gpsDeviceId || 'NO-GPS'}
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-slate-400">
                        <MdInfo size={12} className="mr-2" />
                        CAP: {row.loadCapacity}T | {row.fuelType}
                    </div>
                </div>
            )
        },
        {
            header: 'Owner / Entity', accessor: 'ownerName', render: (row) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700">{row.ownerName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Legal Fleet Owner</span>
                </div>
            )
        },
        {
            header: 'Compliance', accessor: 'rcNumber', render: (row) => (
                <div className="flex flex-col text-[10px] font-mono">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-bold uppercase">RC Exp:</span>
                        <span className="text-slate-700 font-black">{row.rcExpiryDate || '----'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-bold uppercase">Ins Exp:</span>
                        <span className="text-slate-700 font-black">{row.insuranceExpiryDate || '----'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Operational Status', accessor: 'status', render: (row) => {
                const colors = {
                    'available': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
                    'assigned': 'bg-primary-50 text-primary-600 border-primary-200/50',
                    'under_maintenance': 'bg-rose-50 text-rose-600 border-rose-200/50',
                    'inactive': 'bg-slate-50 text-slate-500 border-slate-200/50',
                };
                const status = row.status?.toLowerCase() || 'available';
                return (
                    <span className={`px-4 py-1.5 rounded-[12px] text-[10px] font-black uppercase tracking-[1.5px] border shadow-sm ${colors[status]}`}>
                        {status}
                    </span>
                );
            }
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
                                            onClick={() => {
                                                setEditingVehicle(row);
                                                setIsModalOpen(true);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider"
                                        >
                                            <MdEdit className="mr-3" size={18} />
                                            Edit Parameter
                                        </button>
                                        <button
                                            onClick={() => alert(`FULL ASSET INTEL:\nModel: ${row.make} ${row.model}\nRC: ${row.rcNumber}\nInsurance: ${row.insurancePolicyNumber}\nPermit: ${row.permitType}`)}
                                            className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider"
                                        >
                                            <MdAssignment className="mr-3" size={18} />
                                            View Full Intel
                                        </button>
                                        <div className="border-t border-slate-50 my-1"></div>
                                        <button onClick={() => handleDeleteVehicle(row._id)} className="w-full flex items-center px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-wider">
                                            <MdDelete className="mr-3" size={18} />
                                            Decommission
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

    const filteredVehicles = (vehiclesData || []).filter(vehicle =>
        (vehicle.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle.gpsDeviceId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-primary-600 font-bold text-[10px] uppercase tracking-[4pt] mb-3">
                        <MdDirectionsCar size={16} />
                        <span>All Vehicle Information</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter leading-none">Vehicle List</h2>
                    <p className="text-slate-500 font-medium text-lg mt-3">Advanced monitoring of vehicle operational status and lifecycle.</p>
                </div>
                <Button icon={MdAdd} size="lg" className="shadow-2xl shadow-primary-500/20 !rounded-2xl" onClick={() => setIsModalOpen(true)}>Add Truck</Button>
            </div>

            {/* Control Section */}
            <div className="premium-card !p-4 flex flex-col lg:flex-row lg:items-center gap-4 border border-slate-100 shadow-sm relative">
                <div className="relative flex-1 group">
                    <MdSearch size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Asset lookup: Scan by model, registration, or GPS ID..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-sm font-black focus:ring-4 focus:ring-primary-50 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" icon={MdFilterList} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6 border-slate-200">Asset Audit</Button>
                    <Button variant="secondary" icon={MdSettings} className="!rounded-2xl text-[10px] uppercase tracking-widest px-6" onClick={fetchVehicles}>Refresh Fleet</Button>
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
                        <button onClick={fetchVehicles} className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">Retry Sync</button>
                    </motion.div>
                )}
            </div>

            <div className={`premium-card !p-0 border border-slate-50 shadow-heavy rounded-[32px] transition-all pb-40 min-h-[500px] ${error ? 'mt-12' : ''}`}>
                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Accessing Registry...</p>
                    </div>
                ) : (
                    <Table columns={columns} data={filteredVehicles} />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setEditingVehicle(null);
                    setIsModalOpen(false);
                }}
                title={editingVehicle ? "Asset Parameter Synchronization" : "Truck Details"}
                maxWidth="max-w-4xl"
            >
                <VehicleForm
                    onSubmit={handleRegisterVehicle}
                    onCancel={() => {
                        setEditingVehicle(null);
                        setIsModalOpen(false);
                    }}
                    initialValues={editingVehicle}
                />
            </Modal>
        </div>
    );
};

export default Vehicles;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdAdd, MdSearch, MdFilterList, MdAssignment, MdSchedule,
    MdCheckCircleOutline, MdMap, MdArrowForward, MdPeople,
    MdDirectionsCar, MdSupervisorAccount, MdClose, MdCheck, MdBlock,
    MdMoreVert, MdEdit, MdDelete
} from 'react-icons/md';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
    setAssignments,
    setRequests,
    setMyAssignments,
    setAvailableDrivers,
    setLoading,
    setError,
    updateAssignmentStatus
} from '../../features/assignments/assignmentSlice';
import {
    getAssignmentsByRequestAPI,
    bulkAssignAPI,
    getAvailableDriversAPI,
    getMyAssignmentsAPI,
    respondAssignmentAPI
} from '../../features/assignments/assignmentAPI';
import { getVehiclesAPI } from '../../features/vehicles/vehicleAPI';
import { setVehicles } from '../../features/vehicles/vehicleSlice';

const Assignments = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { list, requests, myAssignments, availableDrivers, loading, error } = useSelector(state => state.assignments);
    const { list: vehicles } = useSelector(state => state.vehicles);

    // Explicitly check role from user object or fallback to localStorage if needed
    // In many setups, role is part of the user object
    const role = user?.role || localStorage.getItem('role') || 'admin'; // fallback to admin for testing

    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [bulkData, setBulkData] = useState({
        requestId: '',
        assignments: [{
            vehicleId: '',
            driverId: '',
            helperId: ''
        }]
    });

    useEffect(() => {
        fetchData();
    }, [role]);

    const fetchData = async () => {
        dispatch(setLoading(true));
        try {
            if (role === 'admin') {
                const [reqRes, driversRes, vehiclesRes] = await Promise.all([
                    getAssignmentsByRequestAPI(),
                    getAvailableDriversAPI(),
                    getVehiclesAPI()
                ]);
                dispatch(setRequests(reqRes.data.data || reqRes.data || []));
                const vList = vehiclesRes.data.data || vehiclesRes.data || [];
                console.log('Vehicles List:', vList);
                dispatch(setVehicles(vList));

                // Normalize drivers to handle nested user objects (consistent with Drivers.jsx)
                const rawDrivers = driversRes.data.data || driversRes.data || [];
                console.log('Raw Drivers Data:', rawDrivers);
                const normalizedDrivers = rawDrivers.map(d => ({
                    ...d,
                    // Prioritize the User ID if available, as backend seems to expect User ID
                    _id: d.userId || d.user?._id || d.user?.id || d._id || d.id,
                    name: d.name || d.user?.name || 'Unnamed Driver',
                    phone: d.phone || d.user?.phone || 'N/A'
                }));
                console.log('Normalized Drivers:', normalizedDrivers);
                dispatch(setAvailableDrivers(normalizedDrivers));
            } else {
                const myRes = await getMyAssignmentsAPI();
                dispatch(setMyAssignments(myRes.data.data || myRes.data || []));
            }
        } catch (err) {
            console.error('Failed to fetch assignments:', err);
            dispatch(setError(err.response?.data?.message || 'Failed to load assignment intelligence.'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleRespond = async (id, status, reason = '') => {
        try {
            await respondAssignmentAPI(id, status, reason);
            dispatch(updateAssignmentStatus({ id, status }));
            alert(`Assignment ${status} successfully.`);
        } catch (err) {
            console.error('Response failed:', err);
            alert('Failed to update assignment status.');
        }
    };

    const handleBulkSubmit = async () => {
        const firstAssignment = bulkData.assignments[0];
        if (!bulkData.requestId || !firstAssignment.driverId || !firstAssignment.vehicleId) {
            alert('Please select a Request, Driver, and Vehicle to proceed.');
            return;
        }

        const cleanedPayload = {
            requestId: String(bulkData.requestId),
            assignments: bulkData.assignments.map(a => ({
                vehicleId: String(a.vehicleId),
                driverId: String(a.driverId),
                helperId: a.helperId && a.helperId !== "HELPER-001" ? String(a.helperId) : null
            }))
        };

        try {
            console.log("FINAL PAYLOAD:", cleanedPayload);
            await bulkAssignAPI(cleanedPayload);
            alert('Bulk assignment deployment successful.');
            setIsBulkModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Bulk assignment failed:', err.response?.data || err);
            alert(err.response?.data?.message || 'Bulk deployment failed.');
        }
    };

    // Handlers for action menu
    const handleCompleteAssignment = async (id) => {
        try {
            await handleRespond(id, 'completed');
            setActiveMenuId(null);
        } catch (err) {
            console.error('Failed to complete assignment:', err);
        }
    };

    // Columns configuration based on role
    const getColumns = () => {
        const columns = [
            {
                header: 'Company Name',
                accessor: 'client',
                render: (row) => (
                    <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-[13px]">{row.client?.name || row.request?.client?.name || 'In-House'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Enterprise Partner</span>
                    </div>
                )
            },
            {
                header: 'Contact Person',
                accessor: 'contact',
                render: (row) => (
                    <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-[12px]">{row.client?.contactPersonName || row.request?.client?.contactPersonName || 'N/A'}</span>
                        <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tighter">Liaison Officer</span>
                    </div>
                )
            },
            {
                header: 'Source',
                accessor: 'source',
                render: (row) => (
                    <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-[12px]">{row.source || row.request?.source || 'Origin Point'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pickup Node</span>
                    </div>
                )
            },
            {
                header: 'Destination',
                accessor: 'destination',
                render: (row) => (
                    <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-[12px]">{row.destination || row.request?.destination || 'Terminal Point'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Drop Node</span>
                    </div>
                )
            },
            {
                header: 'Status',
                accessor: 'status',
                render: (row) => {
                    const status = row.status || 'pending';
                    const colors = {
                        'completed': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
                        'fulfilled': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
                        'accepted': 'bg-primary-50 text-primary-600 border-primary-200/50 shadow-primary-50',
                        'pending': 'bg-slate-100 text-slate-400 border-slate-200 shadow-inner',
                        'rejected': 'bg-rose-50 text-rose-600 border-rose-200/50',
                        'modified': 'bg-amber-50 text-amber-600 border-amber-200/50',
                        'in transit': 'bg-indigo-50 text-indigo-600 border-indigo-200/50',
                    };
                    return (
                        <span className={`px-3 py-1.5 rounded-[12px] text-[10px] font-black uppercase tracking-[1.5px] border shadow-sm flex items-center w-fit ${colors[status.toLowerCase()] || colors.pending}`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'completed' || status === 'fulfilled' ? 'bg-emerald-500' :
                                status === 'accepted' ? 'bg-primary-500' :
                                    status === 'modified' ? 'bg-amber-500' :
                                        status === 'in transit' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'
                                }`}></div>
                            {status}
                        </span>
                    );
                }
            },
            {
                header: '',
                accessor: 'actions',
                render: (row) => (
                    <div className="relative flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row._id ? null : row._id);
                            }}
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
                                        className="absolute right-0 mt-12 w-52 bg-white rounded-2xl shadow-2xl border border-slate-50 z-20 overflow-hidden"
                                    >
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    alert("Update logic to be implemented or linked to existing Edit flow.");
                                                    setActiveMenuId(null);
                                                }}
                                                className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-xl transition-all uppercase tracking-wider"
                                            >
                                                <MdEdit className="mr-3" size={18} />
                                                Update
                                            </button>
                                            <button
                                                onClick={() => handleCompleteAssignment(row._id || row.id)}
                                                className="w-full flex items-center px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-xl transition-all uppercase tracking-wider"
                                            >
                                                <MdCheckCircleOutline className="mr-3" size={18} />
                                                Complete
                                            </button>
                                            <div className="border-t border-slate-50 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this assignment permanently?')) {
                                                        // Fallback delete logic
                                                        setActiveMenuId(null);
                                                    }
                                                }}
                                                className="w-full flex items-center px-4 py-3 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all uppercase tracking-wider"
                                            >
                                                <MdDelete className="mr-3" size={18} />
                                                Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )
            }
        ];

        return columns;
    };

    const displayData = role === 'admin' ? requests : myAssignments;
    const filteredData = (displayData || []).filter(item =>
        (item._id || item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.request?.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    {/* <div className="flex items-center space-x-2 text-primary-600 font-bold text-xs uppercase tracking-[3px] mb-3">
                        <MdAssignment size={16} />
                        <span>operational core • {role.toUpperCase()} MODE</span>
                    </div> */}
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter">
                        {role === 'admin' ? 'Assignments' : 'My Assignments'}
                    </h2>
                    <p className="text-slate-500 font-medium text-lg mt-3">
                        {role === 'admin'
                            ? 'Active orchestration of drivers, vehicles, and client fulfillment orders.'
                            : 'Personal deployment queue and route intelligence.'}
                    </p>
                </div>
                {role === 'admin' && (
                    <Button icon={MdAdd} size="lg" className="shadow-2xl shadow-primary-500/20" onClick={() => setIsBulkModalOpen(true)}>
                        Assign Driver for Client
                    </Button>
                )}
            </div>

            {/* Protocol Filter */}
            <div className="premium-card !p-4 flex flex-col lg:flex-row lg:items-center gap-4 bg-white/40 border border-slate-100 shadow-sm">
                <div className="relative flex-1 group">
                    <MdSearch size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Identity Filter: Search tokens, personnel, or route nodes..."
                        className="w-full bg-slate-50/50 border-none rounded-2xl py-3.5 pl-12 pr-5 text-sm font-semibold focus:ring-4 focus:ring-primary-100 focus:bg-white outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="!rounded-2xl border-slate-200 text-[11px] font-black uppercase tracking-widest">In-Transit Only</Button>
                    <Button variant="secondary" size="md" className="!rounded-2xl" onClick={fetchData}>Refresh Stream</Button>
                </div>
            </div>

            <div className="premium-card !p-0 overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/40 min-h-[400px]">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Syncing Operational Data...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center">
                        <p className="text-rose-500 font-black text-sm uppercase tracking-widest">{error}</p>
                        <Button variant="outline" className="mt-6 mx-auto" onClick={fetchData}>Retry Handshake</Button>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="p-20 text-center">
                        <MdAssignment size={48} className="mx-auto text-slate-100 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active assignments found in registry.</p>
                    </div>
                ) : (
                    <Table columns={getColumns()} data={filteredData} />
                )}
            </div>

            {/* Bulk Assignment Modal */}
            <Modal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                title="Assign truck to client"
                maxWidth="max-w-4xl"
            >
                <div className="space-y-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Vehicle Request</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={bulkData.requestId}
                                onChange={(e) => {
                                    const reqId = e.target.value;
                                    const selectedReq = requests.find(r => (r._id || r.id) === reqId);
                                    setBulkData({
                                        ...bulkData,
                                        requestId: reqId,
                                        assignments: [{
                                            vehicleId: selectedReq?.vehicle?._id || selectedReq?.vehicleId || '',
                                            driverId: '',
                                            helperId: ''
                                        }]
                                    });
                                    console.log('Request Selected. Base Assignment Data:', {
                                        reqId,
                                        foundVehicle: selectedReq?.vehicle?._id || selectedReq?.vehicleId,
                                        fullReq: selectedReq
                                    });
                                }}
                            >
                                <option value="">Select Operational Request...</option>
                                {requests
                                    .filter(req => ['accepted', 'modified'].includes(req.status?.toLowerCase()))
                                    .map(req => (
                                        <option key={req._id || req.id} value={req._id || req.id}>
                                            [{req.status?.toUpperCase()}] {req.id || req._id} - {req.client?.name || 'Internal'}
                                        </option>
                                    ))}
                                {requests.filter(req => ['accepted', 'modified'].includes(req.status?.toLowerCase())).length === 0 && (
                                    <option disabled>No accepted requests available for assignment</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Asset Allocation</label>
                            <div className="space-y-3">
                                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                                    <MdDirectionsCar size={20} className="text-primary-500 mr-3" />
                                    <select
                                        className="flex-1 bg-transparent border-none font-bold text-sm outline-none"
                                        value={bulkData.assignments[0].vehicleId}
                                        onChange={(e) => {
                                            const updated = [...bulkData.assignments];
                                            updated[0].vehicleId = e.target.value;
                                            setBulkData({ ...bulkData, assignments: updated });
                                        }}
                                    >
                                        <option value="">Select Available Vehicle...</option>
                                        {vehicles.map(v => (
                                            <option key={v._id || v.id} value={v._id || v.id}>{v.registrationNumber} ({v.model || v.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <MdPeople size={20} className="text-primary-500 mr-3" />
                                    <select
                                        className="flex-1 bg-transparent border-none font-bold text-sm outline-none"
                                        value={bulkData.assignments[0].driverId}
                                        onChange={(e) => {
                                            const updated = [...bulkData.assignments];
                                            updated[0].driverId = e.target.value;
                                            setBulkData({ ...bulkData, assignments: updated });
                                        }}
                                    >
                                        <option value="">Select Available Driver...</option>
                                        {availableDrivers.map(d => (
                                            <option key={d._id || d.id} value={d._id || d.id}>{d.name} ({d.phone})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <MdSupervisorAccount size={20} className="text-primary-500 mr-3" />
                                    <select
                                        className="flex-1 bg-transparent border-none font-bold text-sm outline-none"
                                        value={bulkData.assignments[0].helperId}
                                        onChange={(e) => {
                                            const updated = [...bulkData.assignments];
                                            updated[0].helperId = e.target.value;
                                            setBulkData({ ...bulkData, assignments: updated });
                                        }}
                                    >
                                        <option value="">Select Available Helper (Optional)...</option>
                                        {/* Fallback to drivers if helper API not separate yet or empty */}
                                        <option value="HELPER-001">Standard Helper Unit</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkSubmit} className="shadow-lg shadow-primary-500/20">Confirm</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Assignments;

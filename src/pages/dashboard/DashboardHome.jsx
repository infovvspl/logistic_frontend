import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
    MdTrendingUp,
    MdPeople,
    MdDirectionsCar,
    MdBusiness,
    MdAutoGraph,
    MdSupervisorAccount
} from 'react-icons/md';

import StatCard from '../../components/ui/StatCard';
import LogisticsCommandCenter from '../../components/dashboard/LogisticsCommandCenter';

// Import necessary actions and APIs
import { setClients } from '../../features/clients/clientSlice';
import { setDrivers } from '../../features/drivers/driverSlice';
import { setHelpers } from '../../features/helpers/helperSlice';
import { setVehicles } from '../../features/vehicles/vehicleSlice';

import { getClientsAPI } from '../../features/clients/clientAPI';
import { getDriversAPI } from '../../features/drivers/driverAPI';
import { getVehiclesAPI } from '../../features/vehicles/vehicleAPI';
import axiosInstance from '../../services/axios';

const DashboardHome = () => {
    const dispatch = useDispatch();

    // Select data from Redux
    const clients = useSelector(state => state.clients.list);
    const drivers = useSelector(state => state.drivers.list);
    const helpers = useSelector(state => state.helpers.list);
    const vehicles = useSelector(state => state.vehicles.list);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            // Fetch everything in parallel
            const [clientsRes, driversRes, vehiclesRes, helpersRes] = await Promise.all([
                getClientsAPI(),
                getDriversAPI(),
                getVehiclesAPI(),
                axiosInstance.get('/api/users?role=helper') // Direct call for helpers as per Helpers.jsx
            ]);

            dispatch(setClients(clientsRes.data?.data || clientsRes.data || []));
            dispatch(setDrivers(driversRes.data?.data || driversRes.data || []));
            dispatch(setVehicles(vehiclesRes.data?.data || vehiclesRes.data || []));
            dispatch(setHelpers(helpersRes.data?.data || helpersRes.data || []));
        } catch (error) {
            console.error('[Dashboard] Data Sync Failure:', error);
        }
    };

    const counts = {
        clients: clients.length,
        drivers: drivers.length,
        helpers: helpers.length,
        vehicles: vehicles.length
    };

    return (
        <div className="space-y-10 pb-12">
            {/* High-Impact Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-2 text-primary-600 font-black text-[10px] uppercase tracking-[4px] mb-4"
                    >
                        <MdAutoGraph size={16} />
                        <span>Operations Dashboard</span>
                    </motion.div>
                    <h2 className="text-4xl font-black text-slate-900 font-display tracking-tighter leading-none mb-3">
                        Dashboard
                    </h2>
                    <p className="text-slate-500 font-medium text-lg">
                        A unified view of your fleet operational intelligence.
                    </p>
                </div>
            </div>

            {/* Core KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Clients"
                    value={counts.clients}
                    icon={MdBusiness}
                    color="blue"
                />
                <StatCard
                    title="Drivers"
                    value={counts.drivers}
                    icon={MdPeople}
                    color="indigo"
                />
                <StatCard
                    title="Helpers"
                    value={counts.helpers}
                    icon={MdSupervisorAccount}
                    color="emerald"
                />
                <StatCard
                    title="Vehicles"
                    value={counts.vehicles}
                    icon={MdDirectionsCar}
                    color="amber"
                />
            </div>

            {/* The Unified Logistics Command Center */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-4">
                    <LogisticsCommandCenter data={{ clients, drivers, helpers, vehicles }} />
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;

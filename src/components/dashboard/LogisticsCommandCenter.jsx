import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdShowChart,
    MdBusiness,
    MdPerson,
    MdInventory,
    MdCalendarToday,
    MdHistory,
    MdTimeline
} from 'react-icons/md';

import RevenueChart from './RevenueChart';
import Table from '../ui/Table';

const LogisticsCommandCenter = ({ data }) => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [revenuePeriod, setRevenuePeriod] = useState('monthly');

    const tabs = [
        { id: 'revenue', label: 'Revenue Analytics', icon: MdTimeline },
        { id: 'clients', label: 'Clients Roster', icon: MdBusiness },
        { id: 'drivers', label: 'Driver Squad', icon: MdPerson },
        { id: 'helpers', label: 'Support Force', icon: MdShowChart },
        { id: 'vehicles', label: 'Vehicle Fleet', icon: MdInventory },
    ];

    const periods = [
        { id: 'daily', label: 'Daily', icon: MdCalendarToday },
        { id: 'monthly', label: 'Monthly', icon: MdHistory },
        { id: 'yearly', label: 'Yearly', icon: MdTimeline },
    ];

    const renderContent = () => {
        const { clients = [], drivers = [], helpers = [], vehicles = [] } = data;

        const listColumns = [
            {
                header: 'Identity',
                accessor: 'name',
                render: (row) => (
                    <span className="font-bold text-slate-700">
                        {row.name || row.fullName || row.registrationNumber || 'N/A'}
                    </span>
                )
            },
            {
                header: 'Reference',
                accessor: 'id',
                render: (row) => (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {row._id || row.id || 'N/A'}
                    </span>
                )
            },
            {
                header: 'Status',
                accessor: 'status',
                render: () => (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase">
                        Active
                    </span>
                )
            }
        ];

        switch (activeTab) {
            case 'revenue':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-100 w-fit">
                            {periods.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setRevenuePeriod(p.id)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${revenuePeriod === p.id
                                            ? 'bg-white text-primary-600 shadow-sm border border-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <RevenueChart period={revenuePeriod} />
                    </div>
                );
            case 'clients': return <div className="max-h-[350px] overflow-auto"><Table columns={listColumns} data={clients} /></div>;
            case 'drivers': return <div className="max-h-[350px] overflow-auto"><Table columns={listColumns} data={drivers} /></div>;
            case 'helpers': return <div className="max-h-[350px] overflow-auto"><Table columns={listColumns} data={helpers} /></div>;
            case 'vehicles': return <div className="max-h-[350px] overflow-auto"><Table columns={listColumns} data={vehicles} /></div>;
            default: return null;
        }
    };

    const getHeader = () => {
        const current = tabs.find(t => t.id === activeTab);
        return (
            <div>
                <h3 className="text-xl font-black text-slate-900 font-display transition-all duration-300 uppercase tracking-tighter">
                    {current.label}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">
                    Operational Intelligence Node • {activeTab === 'revenue' ? `Period: ${revenuePeriod}` : 'Live Roster'}
                </p>
            </div>
        );
    };

    return (
        <div className="premium-card space-y-8 min-h-[520px] flex flex-col">
            {/* Platform Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-50">
                <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-primary-600 shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? 'text-primary-600' : 'text-slate-300'} />
                            <span>{tab.id}</span>
                        </button>
                    ))}
                </div>

                {getHeader()}
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 flex flex-col pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab + (activeTab === 'revenue' ? revenuePeriod : '')}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Insight */}
            <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">
                    System Optimized • Active Session
                </p>
            </div>
        </div>
    );
};

export default LogisticsCommandCenter;

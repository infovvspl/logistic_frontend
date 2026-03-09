import React from 'react';
import { MdVerified, MdStar } from 'react-icons/md';

const performanceData = [
    { id: 1, name: 'Robert Fox', rating: 4.9, jobs: 124, status: 'Elite', color: 'bg-emerald-500' },
    { id: 2, name: 'Jane Cooper', rating: 4.8, jobs: 112, status: 'Top Rated', color: 'bg-blue-500' },
    { id: 3, name: 'Wade Warren', rating: 4.7, jobs: 98, status: 'Top Rated', color: 'bg-indigo-500' },
    { id: 4, name: 'Brooklyn Simmons', rating: 4.6, jobs: 86, status: 'Active', color: 'bg-slate-400' },
];

const DriverLeaderboard = () => {
    return (
        <div className="space-y-4">
            {performanceData.map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/150?u=${driver.id}`} alt={driver.name} className="opacity-80" />
                            </div>
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold ${driver.color}`}>
                                {index + 1}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center space-x-1">
                                <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                                {driver.status === 'Elite' && <MdVerified className="text-blue-500" size={14} />}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{driver.jobs} Assignments</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end text-amber-500 space-x-1">
                            <MdStar size={14} />
                            <span className="text-sm font-black">{driver.rating}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{driver.status}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DriverLeaderboard;

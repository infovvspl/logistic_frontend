import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MdDashboard,
    MdPeople,
    MdDirectionsCar,
    MdBusiness,
    MdAssignment,
    MdLogout,
    MdSupervisorAccount,
    MdNotificationsNone,
    MdSearch,
    MdMenuOpen,
    MdChevronLeft,
    MdDescription,
    MdCategory,
    MdInventory,
    MdSwapHoriz,
    MdShoppingCart
} from 'react-icons/md';

const SidebarItem = ({ to, icon: Icon, label, collapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`group flex items-center px-4 py-3.5 mx-3 my-1 rounded-2xl transition-all duration-300 relative ${isActive
                ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30'
                : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'
                }`}
        >
            <Icon className={`w-6 h-6 shrink-0 transition-transform duration-300 group-hover:scale-110 ${collapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`} />
            {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{label}</span>}

            {isActive && !collapsed && (
                <motion.div
                    layoutId="sidebar-active-indicator"
                    className="ml-auto w-1.5 h-6 bg-white/40 rounded-full"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                />
            )}
        </Link>
    );
};

const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Johnathan Doe';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/auth/login');
    };

    const avatarUrl = `https://ui-avatars.com/api/?name=${userName.replace(/ /g, '+')}&background=2563eb&color=fff&bold=true`;

    return (
        <div className="flex h-screen bg-[#F8FAFC] gradient-mesh">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 100 : 280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white border-r border-slate-100 flex flex-col relative z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
            >
                <div className="h-24 flex items-center justify-between px-7">
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-black tracking-tighter text-slate-800 font-display flex items-center"
                        >
                            <div className="w-9 h-9 bg-primary-600 rounded-xl mr-3 flex items-center justify-center text-white text-sm shadow-lg shadow-primary-200">RS</div>
                            RS Transport
                        </motion.span>
                    )}
                    {collapsed && (
                        <div className="mx-auto w-12 h-12 bg-primary-600 rounded-[14px] flex items-center justify-center text-white font-black shadow-lg shadow-primary-200">RS</div>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="absolute -right-4 top-10 bg-white border border-slate-100 text-slate-400 w-8 h-8 flex items-center justify-center rounded-full hover:text-primary-600 shadow-premium transition-all hover:scale-110 z-50"
                    >
                        {collapsed ? <MdMenuOpen size={18} /> : <MdChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="flex-1 mt-6">
                    <SidebarItem to="/dashboard" icon={MdDashboard} label="Dashboard" collapsed={collapsed} />

                    <div className="mt-8 mb-3 px-8">
                        {!collapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-[3px]">Management</p>}
                    </div>

                    {localStorage.getItem('userRole') === 'superadmin' && (
                        <SidebarItem to="/dashboard/create-admin" icon={MdSupervisorAccount} label="Create Admin" collapsed={collapsed} />
                    )}
                    <SidebarItem to="/dashboard/drivers" icon={MdPeople} label="Drivers" collapsed={collapsed} />
                    <SidebarItem to="/dashboard/helpers" icon={MdSupervisorAccount} label="Helpers" collapsed={collapsed} />
                    <SidebarItem to="/dashboard/vehicles" icon={MdDirectionsCar} label="Vehicles" collapsed={collapsed} />
                    <SidebarItem to="/dashboard/clients" icon={MdBusiness} label="Clients" collapsed={collapsed} />
                    <SidebarItem to="/dashboard/assignments" icon={MdAssignment} label="Assignments" collapsed={collapsed} />
                    <SidebarItem to="/dashboard/reports" icon={MdDescription} label="Daily Report" collapsed={collapsed} />

                    <div className="mt-8 mb-3 px-8">
                        {!collapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-[3px]">Inventory</p>}
                    </div>

                    <SidebarItem to="/dashboard/inventory" icon={MdInventory} label="Inventory Hub" collapsed={collapsed} />
                </nav>

                <div className="p-6 border-t border-slate-50">
                    <button
                        onClick={handleLogout}
                        className={`group flex items-center w-full p-4 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all ${collapsed ? 'justify-center font-black' : ''}`}
                    >
                        <MdLogout className={`w-6 h-6 shrink-0 transition-transform group-hover:rotate-12 ${collapsed ? '' : 'mr-3'}`} />
                        {!collapsed && <span>Sign Out Account</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-24 glass flex items-center justify-between px-10 sticky top-0 z-20 border-b-white/20">
                    <div className="flex items-center max-w-md w-full mr-4">
                        <div className="relative w-full group">
                            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Global Search Commands..."
                                className="w-full bg-slate-100/50 hover:bg-slate-100 border-none rounded-[20px] py-3.5 pl-12 pr-5 text-sm font-medium focus:ring-4 focus:ring-primary-100 transition-all outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex space-x-2">
                            <button className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-white hover:text-primary-600 rounded-[14px] transition-all hover:shadow-premium relative">
                                <MdNotificationsNone size={24} />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-[2.5px] border-white animate-pulse"></span>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-200"></div>

                        <div className="flex items-center space-x-4 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-800 leading-none group-hover:text-primary-600 transition-colors">{userName}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {localStorage.getItem('userRole') === 'superadmin' ? 'Super Administrator' : 'Fleet Administrator'}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-[14px] bg-primary-100 border-2 border-white shadow-premium overflow-hidden group-hover:scale-105 transition-all">
                                <img src={avatarUrl} alt={userName} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10">
                    <div className="max-w-[1500px] mx-auto pb-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;

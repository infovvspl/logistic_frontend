import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FiHome,
  FiLogOut,
  FiTruck,
  FiGrid,
  FiChevronRight,
  FiShield,
  FiUsers,
  FiMap,
  FiBriefcase,
  FiTag,
  FiUserCheck,
  FiMenu,
  FiX,
  FiMapPin,
  FiPackage,
  FiBarChart2,
  FiDollarSign,
  FiClipboard,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { APP_NAME } from "../utils/constants.js";
import { useAuth } from "../hooks/useAuth.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { GrUserPolice } from "react-icons/gr";

const navItems = [
  { to: "/dashboard",           label: "Overview",      icon: FiHome, end: true },
  { to: "/dashboard/admins",    label: "Create Admins", icon: FiShield },
  { to: "/dashboard/drivers",   label: "Drivers",       icon: GrUserPolice },
  { to: "/dashboard/helpers",   label: "Helpers",       icon: FiUserCheck },
  { to: "/dashboard/vehicles",  label: "Vehicles",      icon: FiTruck },
  { to: "/dashboard/companies", label: "Companies",     icon: FiBriefcase },
  { to: "/dashboard/customers", label: "Customers",     icon: FiUsers },
  { to: "/dashboard/roles",     label: "Roles",         icon: FiTag },
  { to: "/dashboard/trips",     label: "Trips",         icon: FiMap },
  { to: "/dashboard/places",        label: "Places",        icon: FiMapPin },
  { to: "/dashboard/consignments",  label: "Consignments",  icon: FiPackage },
  { to: "/dashboard/metrics",       label: "Metrics",       icon: FiBarChart2 },
  { to: "/dashboard/rate-charts",   label: "Rate Charts",   icon: FaRupeeSign },
  { to: "/dashboard/challans",      label: "Challans",      icon: FiClipboard },
];

const navGroups = [
  {
    label: "Main",
    items: [navItems[0]],
  },
  {
    label: "People",
    items: [navItems[1], navItems[2], navItems[3], navItems[7]],
  },
  {
    label: "Operations",
    items: [navItems[4], navItems[5], navItems[6], navItems[8], navItems[9], navItems[10], navItems[11], navItems[12], navItems[13]],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentPage = navItems.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  );

  const visibleNavGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.to !== '/dashboard/admins' || isSuperAdmin
    ),
  }));

  const allVisibleItems = visibleNavGroups.flatMap((g) => g.items);

  return (<>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .db-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', sans-serif;
          display: flex;
          padding: 24px;
          gap: 24px;
        }

        /* ── Sidebar ── */
        .db-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 0;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.08),
            0 1px 3px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          position: relative;
        }

        .db-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          opacity: 0.7;
        }

        .db-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 32px 24px 28px;
          position: relative;
          z-index: 2;
        }

        /* ── Brand ── */
        .db-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 28px;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .db-brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 10px 30px rgba(59, 130, 246, 0.3),
            0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .db-brand-icon svg {
          color: white;
          width: 20px;
          height: 20px;
        }

        .db-brand-text {
          flex: 1;
        }

        .db-brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .db-brand-sub {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── Nav groups ── */
        .db-nav-group {
          margin-bottom: 28px;
        }

        .db-nav-group:last-child {
          margin-bottom: 0;
        }

        .db-nav-group-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          padding: 0 4px;
          margin-bottom: 12px;
        }

        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px;
          // padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          margin-bottom: 4px;
        }

        .db-nav-item:hover {
          background: rgba(59, 130, 246, 0.08);
          color: #1e40af;
          transform: translateX(4px);
        }

        .db-nav-item.active {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
          color: #1d4ed8;
          font-weight: 600;
          box-shadow: 
            0 4px 20px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .db-nav-item.active .nav-icon {
          color: #3b82f6;
        }

        /* ── User card ── */
        .db-user-card {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding-bottom: 8px;
        }

        .db-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .db-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border: 2px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #1d4ed8;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .db-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .db-user-role {
          font-size: 12px;
          color: #64748b;
        }

        .db-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          color: #64748b;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .db-logout-btn:hover {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
          color: white;
          border-color: rgba(255, 107, 107, 0.3);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
          transform: translateY(-1px);
        }

        /* ── Main area ── */
        .db-main-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        /* Top bar */
        .db-topbar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          border-radius: 20px;
          padding: 20px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.08),
            0 1px 3px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .db-breadcrumb {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .db-breadcrumb-root {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .db-breadcrumb-sep {
          color: #94a3b8;
          font-size: 14px;
        }

        .db-breadcrumb-current {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .db-topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .db-search-input {
          position: relative;
        }

        .db-search-input input {
          padding: 10px 16px 10px 40px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          width: 280px;
          transition: all 0.2s ease;
        }

        .db-search-input input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .db-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .db-notification {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
          transition: all 0.2s ease;
        }

        .db-notification:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
        }

        /* Status indicator */
        .db-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-status-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: db-pulse 2s ease-in-out infinite;
        }

        @keyframes db-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        .db-status-text {
          font-size: 13px;
          color: #059669;
          font-weight: 500;
        }

        /* ── Content card ── */
        .db-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
          overflow: auto;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .db-search-input input { width: 200px; }
        }

        @media (max-width: 768px) {
          .db-root {
            flex-direction: column;
            padding: 12px;
            gap: 12px;
            padding-bottom: 80px;
          }
          .db-sidebar { display: none; }
          .db-topbar { padding: 14px 20px; }
          .db-content { padding: 20px 16px; }
        }

        @media (min-width: 1024px) {
          .db-mobile-topbar-menu { display: none !important; }
        }

        /* ── Mobile bottom navbar ── */
        .db-mobile-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0,0,0,0.08);
          padding: 8px 4px;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
        }

        .db-mobile-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
        }

        .db-mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 6px 10px;
          border-radius: 12px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 52px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .db-mobile-nav-item.active {
          color: #1d4ed8;
          background: rgba(59,130,246,0.08);
        }

        .db-mobile-nav-item svg { width: 20px; height: 20px; }

        /* ── Mobile drawer ── */
        .db-drawer {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 280px;
          background: white;
          box-shadow: 4px 0 40px rgba(0,0,0,0.15);
          overflow-y: auto;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
        }

        .db-drawer-close {
          position: absolute;
          top: 16px; right: 16px;
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
        }

        .db-mobile-topbar-menu {
          width: 38px; height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1e293b;
        }
        `}
      </style>
      <div className="db-root">
        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-inner">
            {/* Brand */}
            <div className="db-brand">
              <div className="db-brand-icon">
                <FiGrid />
              </div>
              <div className="db-brand-text">
                <div className="db-brand-name">{APP_NAME}</div>
                <div className="db-brand-sub">Dashboard</div>
              </div>
            </div>

            {/* Nav */}
            <nav>
              {visibleNavGroups.map((group) => (
                <div className="db-nav-group" key={group.label}>
                  <div className="db-nav-group-label">{group.label}</div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `db-nav-item${isActive ? " active" : ""}`
                        }
                      >
                        <Icon className="nav-icon" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* User */}
            <div className="db-user-card">
              <div className="db-user-info">
                <div className="db-avatar">
                  {(user?.email ?? "A")[0].toUpperCase()}
                </div>
                <div>
                  <div className="db-user-name">
                    {user?.name || user?.email?.split('@')[0] || 'Admin'}
                  </div>
                  <div className="db-user-role">
                    {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                  </div>
                </div>
              </div>
              <button className="db-logout-btn" onClick={logout}>
                <FiLogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="db-main-wrap">
          {/* Top bar */}
          <div className="db-topbar">
            <div className="db-breadcrumb">
              <span className="db-breadcrumb-root">{APP_NAME}</span>
              <FiChevronRight className="db-breadcrumb-sep" size={16} />
              <span className="db-breadcrumb-current">
                {currentPage?.label ?? "Dashboard"}
              </span>
            </div>
            <div className="db-topbar-right">
              <div className="db-status">
                <div className="db-status-dot" />
                <span className="db-status-text">Online</span>
              </div>
              {/* <button className="db-mobile-topbar-menu lg:hidden" onClick={() => setDrawerOpen(true)}>
                <FiMenu size={18} />
              </button> */}
            </div>
          </div>

          {/* Page content */}
          <div className="db-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ height: "100%" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom navbar ── */}
      <nav className="db-mobile-nav md:hidden">
        <div className="db-mobile-nav-inner">
          {allVisibleItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `db-mobile-nav-item${isActive ? ' active' : ''}`}
              >
                <Icon />
                <span>{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
          <button className="db-mobile-nav-item" onClick={() => setDrawerOpen(true)}>
            <FiMenu />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer — rendered via portal-like fixed overlay, no CSS display toggling ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              className="db-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="db-drawer-close" onClick={() => setDrawerOpen(false)}>
                <FiX size={16} />
              </button>

              <div className="db-brand" style={{ marginBottom: 24 }}>
                <div className="db-brand-icon"><FiGrid /></div>
                <div className="db-brand-text">
                  <div className="db-brand-name">{APP_NAME}</div>
                  <div className="db-brand-sub">Dashboard</div>
                </div>
              </div>

              <nav style={{ flex: 1 }}>
                {visibleNavGroups.map((group) => (
                  <div className="db-nav-group" key={group.label}>
                    <div className="db-nav-group-label">{group.label}</div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          onClick={() => setDrawerOpen(false)}
                          className={({ isActive }) => `db-nav-item${isActive ? ' active' : ''}`}
                        >
                          <Icon className="nav-icon" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="db-user-card">
                <div className="db-user-info">
                  <div className="db-avatar">{(user?.email ?? 'A')[0].toUpperCase()}</div>
                  <div>
                    <div className="db-user-name">{user?.name || user?.email?.split('@')[0] || 'Admin'}</div>
                    <div className="db-user-role">{isSuperAdmin ? 'Super Admin' : 'Administrator'}</div>
                  </div>
                </div>
                <button className="db-logout-btn" onClick={logout}>
                  <FiLogOut size={16} />
                  Sign out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  History,
  Truck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clearAuth, getUser } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

export default function CollectorLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const usr = getUser();
    if (!usr) {
      navigate("/login?returnTo=/collector");
      return;
    }
    // "Collector" or "2"
    if (usr.role !== "Collector" && usr.role !== "2") {
      navigate("/");
      return;
    }
    setUser(usr);
  }, [navigate]);

  if (!user) return null;

  function onLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface-container-low relative min-h-0">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-primary/40 active:scale-95 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative top-0 bottom-0 left-0 w-72 lg:w-64 bg-surface-container-lowest border-r border-surface-container-highest 
        flex flex-col eco-glass z-50 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-6 h-6 text-primary" />
              <h2 className="font-extrabold tracking-tight text-lg text-on-surface">
                Cổng nhân viên
              </h2>
            </div>
            <p className="text-[10px] text-on-surface-variant/70 font-black tracking-widest uppercase">
              Khu vực thu gom
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
          <NavLink
            to="/collector"
            end
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Tổng quan</span>
          </NavLink>

          <NavLink
            to="/collector/tasks"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-sm">Quản lí công việc</span>
          </NavLink>

          <NavLink
            to="/collector/history"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="text-sm">Lịch sử công việc</span>
          </NavLink>
        </nav>

        {/* Bottom user card + logout */}
        <div className="mt-auto border-t border-surface-container-highest p-4">
          <div className="flex items-center gap-3">
            <img
              src={(user?.avatarUrl || user?.AvatarUrl || user?.avatar) ? `${user?.avatarUrl || user?.AvatarUrl || user?.avatar}${ (user?.avatarUrl || user?.AvatarUrl || user?.avatar).includes('?') ? '&' : '?' }t=${new Date().getTime()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
              alt="User profile"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container/30"
              referrerPolicy="no-referrer"
              key={user?.avatarUrl || user?.AvatarUrl}
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-on-surface truncate">
                {user.displayName || user.email || "Collector"}
              </p>
              <p className="text-[10px] font-black tracking-widest uppercase text-on-surface-variant/60">
                {user.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98] transition-all"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-surface relative min-h-0">
        {/* Floating Top Right Notification Bell */}
        <div className="absolute top-6 right-6 lg:right-12 z-50">
          <NotificationBell />
        </div>

        {/* Decorative Grid Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* Content Container */}
        <div className="p-4 md:p-8 lg:p-12 relative z-10 w-full">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

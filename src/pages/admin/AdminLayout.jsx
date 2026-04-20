import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  MessageSquare,
  Ticket,
  ShieldCheck,
  Star,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clearAuth, getUser } from "../../lib/auth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const accountsActive = location.pathname.startsWith("/admin/accounts");
  const accountsMenuId = "admin-accounts-menu";
  const [accountsOpen, setAccountsOpen] = useState(accountsActive);
  const systemActive = location.pathname.startsWith("/admin/system");
  const systemMenuId = "admin-system-menu";
  const [systemOpen, setSystemOpen] = useState(systemActive);

  useEffect(() => {
    const usr = getUser();
    if (!usr) {
      navigate("/login?returnTo=/admin");
      return;
    }
    // "Administrator" or "3"
    if (usr.role !== "Administrator" && usr.role !== "3") {
      navigate("/");
      return;
    }
    setUser(usr);
  }, [navigate]);

  useEffect(() => {
    if (accountsActive) setAccountsOpen(true);
  }, [accountsActive]);

  useEffect(() => {
    if (systemActive) setSystemOpen(true);
  }, [systemActive]);

  if (!user) return null;

  function onLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-surface-container-low relative">
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
        fixed lg:relative top-0 bottom-0 left-0 w-[min(20rem,100vw)] lg:w-72 shrink-0 bg-surface-container-lowest border-r border-surface-container-highest 
        flex flex-col min-h-0 h-dvh lg:h-auto lg:min-h-0 eco-glass z-50 transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h2 className="font-extrabold tracking-tight text-lg text-on-surface">
                Admin Console
              </h2>
            </div>
            <p className="text-[10px] text-on-surface-variant/70 font-black tracking-widest uppercase">
              Quản trị hệ thống
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar min-h-0">
          <NavLink
            to="/admin"
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

          <div className="space-y-1.5">
            <div
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                systemActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`}
            >
              <NavLink
                to="/admin/system/waste-categories"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setSystemOpen(true);
                }}
                className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none"
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span className="text-sm truncate whitespace-nowrap">
                  Quản lí hệ thống
                </span>
              </NavLink>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSystemOpen((v) => !v);
                }}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-expanded={systemOpen}
                aria-controls={systemMenuId}
                aria-label={systemOpen ? "Thu gọn" : "Mở rộng"}
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    systemOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {systemOpen && (
                <motion.div
                  id={systemMenuId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-2 py-1 space-y-1">
                    <NavLink
                      to="/admin/system/waste-categories"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-2xl font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
                        }`
                      }
                    >
                      <span className="text-sm">Loại rác</span>
                    </NavLink>

                    <NavLink
                      to="/admin/system/areas"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-2xl font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
                        }`
                      }
                    >
                      <span className="text-sm">Khu vực</span>
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1.5">
            <div
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                accountsActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`}
            >
              <NavLink
                to="/admin/accounts/citizens"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setAccountsOpen(true);
                }}
                className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none"
              >
                <Users className="w-5 h-5 shrink-0" />
                <span className="text-sm truncate whitespace-nowrap">
                  Quản lý tài khoản
                </span>
              </NavLink>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAccountsOpen((v) => !v);
                }}
                className="p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-expanded={accountsOpen}
                aria-controls={accountsMenuId}
                aria-label={accountsOpen ? "Thu gọn" : "Mở rộng"}
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    accountsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {accountsOpen && (
                <motion.div
                  id={accountsMenuId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-2 py-1 space-y-1">
                    <NavLink
                      to="/admin/accounts/citizens"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-2xl font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
                        }`
                      }
                    >
                      <span className="text-sm">Dân cư</span>
                    </NavLink>

                    <NavLink
                      to="/admin/accounts/collectors"
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-2xl font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
                        }`
                      }
                    >
                      <span className="text-sm">Người thu gom</span>
                    </NavLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink
            to="/admin/feedback"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Quản lý khiếu nại</span>
          </NavLink>

          <div className="pt-6 pb-2 px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
              Mở rộng
            </p>
          </div>

          <NavLink
            to="/admin/rewards"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <Star className="w-5 h-5" />
            <span className="text-sm">Quản lí điểm thưởng</span>
          </NavLink>

          <NavLink
            to="/admin/vouchers"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary active:scale-[0.98]"
              }`
            }
          >
            <Ticket className="w-5 h-5" />
            <span className="text-sm">Quản lí Voucher</span>
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
                {user.displayName || user.email || "Admin"}
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
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden bg-surface relative">
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
        <div className="p-4 md:p-8 lg:p-12 relative z-10 w-full min-w-0 max-w-full box-border">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Clock } from "lucide-react";
import notificationApi from "../api/notificationApi";
import { getToken } from "../lib/auth";

export default function NotificationBell() {
  const [isAuthed, setIsAuthed] = useState(() => !!getToken() || localStorage.getItem("ecosort_auth") === "1");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Polling unread count
  useEffect(() => {
    if (!isAuthed) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s
    return () => clearInterval(interval);
  }, [isAuthed]);

  // Fetch full list when opening notification dropdown
  useEffect(() => {
    if (notifOpen && isAuthed) {
      const fetchNotifs = async () => {
        try {
          const data = await notificationApi.getNotifications();
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      };
      fetchNotifs();
    }
  }, [notifOpen, isAuthed]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthed) return null;

  return (
    <div className="relative z-[60]" ref={notifRef}>
      <button
        type="button"
        className="relative p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-full transition-all"
        onClick={() => setNotifOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={notifOpen}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse"></span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[2rem] bg-surface-container-lowest border border-surface-container-high/70 botanical-shadow overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-6 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low/30">
            <h3 className="font-black text-on-surface flex items-center gap-2">
              Thông báo
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await notificationApi.markAllAsRead();
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, isRead: true }))
                    );
                    setUnreadCount(0);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-surface-container-high">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-5 flex gap-4 hover:bg-surface-container-low transition-colors group cursor-pointer relative ${
                      !notif.isRead ? "bg-primary/[0.02]" : ""
                    }`}
                    onClick={async () => {
                      if (!notif.isRead) {
                        try {
                          await notificationApi.markAsRead(notif.id);
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, isRead: true } : n
                            )
                          );
                          setUnreadCount((prev) => Math.max(0, prev - 1));
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                    )}
                    <div
                      className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                        notif.type === "warning"
                          ? "bg-amber-100 text-amber-600"
                          : notif.type === "success"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {notif.type === "warning" ? (
                        <Bell className="w-6 h-6" />
                      ) : notif.type === "success" ? (
                        <CheckCheck className="w-6 h-6" />
                      ) : (
                        <Bell className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-sm font-black leading-tight ${
                          !notif.isRead
                            ? "text-on-surface"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs font-medium text-on-surface-variant/80 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/50 pt-1">
                        <Clock className="w-3 h-3" />
                        {notif.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center opacity-40">
                <Bell className="w-12 h-12 mb-4" />
                <p className="font-bold">Không có thông báo nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

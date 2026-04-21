import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  User,
} from "lucide-react";
import { getAllComplaints } from "../../api/complaintApi";

const STATUS_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "Submitted", label: "Chờ xử lý" },
  { id: "InReview", label: "Đang xử lý" },
  { id: "Resolved", label: "Đã giải quyết" },
  { id: "Rejected", label: "Bị từ chối" },
];

function statusBadge(status) {
  if (status === "Submitted") return "bg-rose-100 text-rose-700";
  if (status === "InReview") return "bg-amber-100 text-amber-700";
  if (status === "Resolved") return "bg-emerald-100 text-emerald-700";
  return "bg-zinc-100 text-zinc-700";
}

export function statusText(status) {
  if (status === "Submitted") return "Chờ xử lý";
  if (status === "InReview") return "Đang xử lý";
  if (status === "Resolved") return "Đã giải quyết";
  if (status === "Rejected") return "Bị từ chối";
  return status;
}

export default function AdminFeedback() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllComplaints(activeStatus === "all" ? "" : activeStatus);
        setItems(data);
      } catch (err) {
        console.error("Failed to load complaints", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeStatus]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      return (
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.citizenName && item.citizenName.toLowerCase().includes(q)) ||
        item.id.toString().includes(q)
      );
    });
  }, [items, query]);

  const openCount = items.filter((x) => x.status === "Submitted").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col mb-4 md:mb-6 px-2">
        <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
          Quản lý khiếu nại
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant font-bold mt-1 opacity-60">
          Theo dõi và xử lý danh sách khiếu nại người dùng gửi về hệ thống.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <article className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-5">
          <p className="text-xs uppercase tracking-widest font-black text-on-surface-variant">
            Tổng tiếp nhận
          </p>
          <p className="mt-2 text-3xl font-extrabold text-on-surface">
            {items.length}
          </p>
        </article>
        <article className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-5">
          <p className="text-xs uppercase tracking-widest font-black text-on-surface-variant">
            Chờ xử lý
          </p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600">
            {openCount}
          </p>
        </article>
        <article className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-5">
          <p className="text-xs uppercase tracking-widest font-black text-on-surface-variant">
            Đã giải quyết
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {items.filter((x) => x.status === "Resolved").length}
          </p>
        </article>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatus(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  activeStatus === tab.id
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-surface text-on-surface-variant border-surface-container-high hover:text-primary hover:border-primary/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã, tên, tiêu đề..."
              className="w-full rounded-xl border border-surface-container-high bg-surface pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40"
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="py-12 text-center text-on-surface-variant font-semibold animate-pulse">
               Đang tải dữ liệu khiếu nại...
             </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-semibold">
              Không có khiếu nại phù hợp bộ lọc.
            </div>
          ) : (
            filteredItems.map((item) => {
              const basePath = window.location.pathname.startsWith('/enterprise') 
                ? '/enterprise/feedback' 
                : '/admin/feedback';
              return (
              <Link
                key={item.id}
                to={`${basePath}/${item.id}`}
                className="block rounded-2xl border border-surface-container-high bg-surface p-5 space-y-3 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">
                      #{item.id}
                    </p>
                    <h3 className="text-lg font-bold text-on-surface">
                      {item.reason}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge(item.status)}`}
                    >
                      {statusText(item.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      {item.citizenName || "Khách"} - {item.citizenEmail || "Không có Email"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="w-4 h-4 text-primary" />
                      {new Date(item.createdAtUtc).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {item.status === "Resolved" || item.status === "Rejected" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã xử lý xong
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        Cần theo dõi
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

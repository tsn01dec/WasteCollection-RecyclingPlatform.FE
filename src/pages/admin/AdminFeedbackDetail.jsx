import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  User,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { getComplaintDetail, updateComplaintStatus } from "../../api/complaintApi";
import { statusText } from "./AdminFeedback";

const STATUS_OPTIONS = [
  { value: "Submitted", label: "Chờ xử lý" },
  { value: "InReview", label: "Đang xử lý" },
  { value: "Resolved", label: "Đã giải quyết" },
  { value: "Rejected", label: "Bị từ chối" },
];

export default function AdminFeedbackDetail() {
  const { id = "" } = useParams();
  const decodedId = decodeURIComponent(id);
  
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [status, setStatus] = useState("Submitted");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function loadDetail() {
      if (!decodedId) return;
      try {
        setLoading(true);
        const data = await getComplaintDetail(decodedId);
        setFeedback(data);
        setStatus(data.status || "Submitted");
        setNote(data.adminNote || "");
      } catch (err) {
        setFetchError("Không thể tải thông tin khiếu nại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [decodedId]);

  const basePath = window.location.pathname.startsWith('/enterprise') 
    ? '/enterprise/feedback' 
    : '/admin/feedback';

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          to={basePath}
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách khiếu nại
        </Link>
        <div className="py-12 text-center text-on-surface-variant font-semibold animate-pulse">
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  if (!feedback || fetchError) {
    return (
      <div className="space-y-6">
        <Link
          to={basePath}
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách khiếu nại
        </Link>
        <div className="rounded-2xl border border-surface-container-high bg-surface p-6 text-on-surface-variant">
          {fetchError || (
            <>
              Không tìm thấy khiếu nại với mã{" "}
              <span className="font-bold text-on-surface">#{decodedId}</span>.
            </>
          )}
        </div>
      </div>
    );
  }

  async function onSave() {
    try {
      setSaving(true);
      setSaveError("");
      const result = await updateComplaintStatus(feedback.id, {
        status,
        adminNote: note,
      });
      setFeedback(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu xử lý.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col gap-3 mb-4 md:mb-6 px-2">
        <Link
          to={basePath}
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách khiếu nại
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
            Chi tiết khiếu nại
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant font-bold mt-1 opacity-60">
            Mã đơn: #{feedback.id}
          </p>
        </div>
      </header>

      <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-6 space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">
            Lý do khiếu nại
          </p>
          <h2 className="text-2xl font-bold text-on-surface">
            {feedback.reason}
          </h2>
          {feedback.reportTitle && (
            <p className="text-sm font-semibold text-on-surface-variant mt-1">
              Liên quan báo cáo: <Link to={`/admin/reports/${feedback.wasteReportId}`} className="text-primary hover:underline">{feedback.reportTitle}</Link>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-on-surface-variant">
          <p className="inline-flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {feedback.citizenName || "Khách"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            {feedback.citizenEmail || "Không có Email"}
          </p>
          <p className="inline-flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-primary" />
            {new Date(feedback.createdAtUtc).toLocaleString('vi-VN')}
          </p>
          <p className="inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Trạng thái hiện tại:{" "}
            <span className="font-bold text-on-surface">
              {statusText(feedback.status)}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-surface-container-high bg-surface p-5">
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">Nội dung chi tiết</p>
          <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
            {feedback.description}
          </p>
        </div>

        {feedback.evidenceFiles?.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold text-on-surface inline-flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-on-surface-variant" />
              Minh chứng đính kèm
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {feedback.evidenceFiles.map((ev, index) => {
                const isImage = ev.contentType?.startsWith("image/") || ev.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i);
                return (
                  <a
                    key={ev.id || index}
                    href={ev.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[4/3] rounded-xl overflow-hidden border border-surface-container-highest hover:ring-2 hover:ring-primary/50 transition-all bg-surface-container-lowest"
                  >
                    {isImage ? (
                      <img src={ev.fileUrl} alt={ev.originalFileName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant p-4">
                        <Paperclip className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs text-center truncate w-full">{ev.originalFileName}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-highest p-6 space-y-4">
        <h3 className="text-lg font-bold text-on-surface">Xử lý khiếu nại</h3>
        
        {saveError && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-sm font-semibold border border-rose-200">
            {saveError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Cập nhật trạng thái
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full md:max-w-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface">
            Ghi chú phản hồi admin
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập nội dung xử lý hoặc hướng dẫn phản hồi người dùng..."
            className="w-full rounded-xl border border-surface-container-high bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-container disabled:opacity-50 transition-all"
          >
            {saving ? "Đang lưu..." : "Lưu xử lý"}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 fade-in animate-in duration-300">
              <CheckCircle2 className="w-4 h-4" />
              Đã lưu cập nhật
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

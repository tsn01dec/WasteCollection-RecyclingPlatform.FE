import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Edit2, 
  Package,
  Layers,
  Zap,
  X,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import AlertModal from '../../components/ui/AlertModal';
import { getAllWasteCategories, updateWasteCategoryPoints } from '../../api/wasteCategoryApi';

// Color/icon mapping by category name (decorates API data)
const CATEGORY_STYLE = {
  'Nhựa':              { color: 'from-emerald-500 to-teal-600',  shadow: 'shadow-emerald-500/30' },
  'Kim Loại':          { color: 'from-blue-500 to-indigo-600',   shadow: 'shadow-blue-500/30' },
  'Các loại rác chung':{ color: 'from-amber-500 to-orange-600',  shadow: 'shadow-amber-500/30' },
};
const DEFAULT_STYLE = { color: 'from-primary to-primary-dark', shadow: 'shadow-primary/30' };

function CategoryIcon({ name, className }) {
  if (name === 'Nhựa')    return <Zap     className={className} />;
  if (name === 'Kim Loại') return <Layers className={className} />;
  return                          <Package className={className} />;
}

export default function RewardManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success', onConfirm: null });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllWasteCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id, pointsPerKg) => {
    try {
      const updated = await updateWasteCategoryPoints(id, pointsPerKg);
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditing(null);
      setAlertConfig({ isOpen: true, title: 'Đã lưu', message: 'Cập nhật tỷ lệ tích điểm thành công.', type: 'success', onConfirm: null });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Lỗi', message: err.message || 'Không thể cập nhật tỷ lệ điểm.', type: 'error', onConfirm: null });
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Header */}
      <header className="px-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Cấu hình tích điểm</h1>
          <p className="text-sm text-on-surface-variant font-bold mt-1 opacity-60">
            Thiết lập điểm thưởng tự động dựa trên khối lượng rác thải. Điểm được cộng liên tục theo từng 0.1 kg thu gom được.
          </p>
        </div>
        <button onClick={loadCategories} title="Tải lại" className="p-2.5 hover:bg-surface-container rounded-xl transition-all text-on-surface-variant/40 hover:text-primary mt-1">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 opacity-40">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
          <button onClick={loadCategories} className="ml-auto text-xs font-black underline">Thử lại</button>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const style = CATEGORY_STYLE[cat.name] || DEFAULT_STYLE;
            // API: pointsPerKg = điểm/kg → FE hiển thị per 0.1kg
            const pointsPer0_1kg = Math.round(cat.pointsPerKg / 10);
            const exampleKg = [0.1, 0.5, 1, 5];
            return (
              <motion.div
                layout
                key={cat.id}
                className="group bg-surface rounded-[2.5rem] border border-surface-container-high overflow-hidden botanical-shadow-lg hover:border-primary/40 transition-all flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 bg-gradient-to-br ${style.color} rounded-[1.4rem] text-white shadow-xl ${style.shadow}`}>
                      <CategoryIcon name={cat.name} className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary block mb-0.5">Danh mục</span>
                      <h3 className="text-xl font-black text-on-surface tracking-tighter leading-none">{cat.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing({ ...cat, pointsPer0_1kg })}
                    className="p-2.5 text-on-surface-variant/20 hover:text-primary transition-colors bg-surface-container-low rounded-xl"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rate Display */}
                <div className="px-6 pb-4">
                  <div className="bg-surface-container-low rounded-[1.8rem] border border-surface-container-high p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 block mb-1">Tỷ lệ tích điểm</span>
                      <p className="text-2xl font-black text-on-surface tracking-tighter">
                        0.1 <span className="text-base text-on-surface-variant/50">kg</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 block mb-1">= Cộng</span>
                      <div className="flex items-center gap-1.5 text-primary">
                        <Zap className="w-4 h-4" fill="currentColor" />
                        <span className="text-2xl font-black italic">{pointsPer0_1kg}</span>
                        <span className="text-sm font-bold opacity-60">điểm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example table */}
                <div className="px-6 pb-6 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-on-surface-variant/30 mb-3 px-1">Ví dụ tích lũy</p>
                  <div className="space-y-1.5">
                    {exampleKg.map(kg => (
                      <div key={kg} className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/60 rounded-2xl border border-surface-container-high/60">
                        <span className="font-black text-on-surface text-sm tabular-nums">{kg} kg</span>
                        <div className="flex items-center gap-1.5 text-primary">
                          <TrendingUp className="w-3 h-3 opacity-50" />
                          <span className="font-black tabular-nums">{Math.round(kg / 0.1 * pointsPer0_1kg).toLocaleString()}</span>
                          <span className="text-[10px] opacity-50">điểm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </main>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <EditModal cat={editing} onClose={() => setEditing(null)} onSave={handleSave} />
        )}
      </AnimatePresence>

      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}

function EditModal({ cat, onClose, onSave }) {
  const [value, setValue] = useState(cat.pointsPer0_1kg);
  const [saving, setSaving] = useState(false);

  const exampleKg = [0.1, 0.5, 1, 5, 10];

  const handleSubmit = async () => {
    setSaving(true);
    // Convert back to PointsPerKg for API (FE shows per 0.1kg, API stores per kg)
    await onSave(cat.id, value * 10);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        className="relative bg-surface p-8 rounded-[3rem] w-full max-w-md space-y-8 botanical-shadow-lg border border-surface-container-high"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <CategoryIcon name={cat.name} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-on-surface">Chỉnh tỷ lệ điểm</h2>
              <p className="text-xs font-bold text-on-surface-variant opacity-60">{cat.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-surface-container hover:bg-error/10 hover:text-error rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="bg-surface-container-low rounded-[2rem] border border-surface-container-high p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Điểm cộng mỗi 0.1 kg</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-surface rounded-2xl px-5 py-4 border border-surface-container-high focus-within:border-primary/40 transition-all">
              <Zap className="w-5 h-5 text-primary opacity-50 shrink-0" fill="currentColor" />
              <input
                type="number"
                min={1}
                value={value}
                onChange={e => setValue(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-transparent font-black text-2xl text-primary outline-none tabular-nums"
              />
              <span className="text-sm font-bold text-on-surface-variant/40 shrink-0">điểm</span>
            </div>
            <span className="text-on-surface-variant/30 font-black text-lg">/ 0.1 kg</span>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-on-surface-variant/30 px-1">Xem trước tích lũy</p>
          {[0.1, 0.5, 1, 5, 10].map(kg => (
            <div key={kg} className="flex items-center justify-between px-5 py-3 bg-surface-container-low rounded-2xl border border-surface-container-high">
              <span className="font-black text-on-surface tabular-nums">{kg} kg</span>
              <div className="flex items-center gap-1.5 text-primary">
                <Zap className="w-3 h-3 opacity-50" fill="currentColor" />
                <span className="font-black tabular-nums">{Math.round(kg / 0.1 * value).toLocaleString()}</span>
                <span className="text-[10px] opacity-50">điểm</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-[2] bg-primary text-white py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

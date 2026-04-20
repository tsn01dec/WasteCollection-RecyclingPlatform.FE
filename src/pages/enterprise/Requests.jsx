import React, { useEffect, useState, useMemo } from 'react';
import { 
  getAllWasteReports, 
  updateWasteReportStatus, 
  assignWasteReportCollector 
} from '../../api/WasteReportapi';
import { getCollectors } from '../../api/userApi';
import Pagination from '../../components/ui/Pagination';
import {  
  MapPin, 
  Scale, 
  Clock, 
  User, 
  CheckCircle2, 
  Search,
  ArrowRight,
  Package,
  CheckCircle,
  Users as UsersIcon,
  X,
  FileText,
  ChevronRight,
  Info,
  Calendar,
  Truck,
  HelpCircle,
  Edit,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [coordinatingRequest, setCoordinatingRequest] = useState(null);
  const [cancellingRequest, setCancellingRequest] = useState(null);

  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, cols] = await Promise.all([getAllWasteReports(), getCollectors()]);
      
      // Map API response to match FE expectations if needed
      const mappedCollectors = cols.map(c => ({
        ...c,
        name: c.displayName || c.fullName || "N/A"
      }));

      setRequests(reqs);
      setCollectors(mappedCollectors);
      console.log("Loaded Waste Reports:", reqs);
    } catch (err) {
      console.error("Failed to load requests:", err);
      // alert("Lỗi khi tải danh sách: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleAssign = async (reqId, colId) => {
    try {
      await assignWasteReportCollector(reqId, colId);
      setRequests(prev => prev.map(r => 
        r.id === reqId ? { ...r, status: 'Assigned', collectorId: colId } : r
      ));
    } catch (err) {
      console.error("Assignment failed", err);
    }
  };

  const handleStatus = async (reqId, status, reason = null) => {
    try {
      await updateWasteReportStatus(reqId, status, reason);
      setRequests(prev => prev.map(r => 
        r.id === reqId ? { ...r, status, cancellationReason: reason } : r
      ));
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const handleOpenCoordination = (req) => {
    setCoordinatingRequest(req);
  };

  const filteredRequests = useMemo(() => {
    let result = requests;
    if (activeTab !== 'All') {
      result = result.filter(r => r.status === activeTab);
    }
    if (searchQuery) {
      result = result.filter(r => 
        (r.citizenName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.id?.toString() || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [requests, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const totalWeight = requests.reduce((sum, r) => sum + parseFloat(r.weightKg || 0), 0);
    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const completedWeight = requests.filter(r => r.status === 'Collected').reduce((sum, r) => sum + (r.weightKg || 0), 0);
    
    return [
      { label: 'Tổng khối lượng', value: `${totalWeight.toFixed(1)}kg`, icon: Scale, color: 'text-primary' },
      { label: 'Yêu cầu mới', value: pendingCount, icon: Clock, color: 'text-amber-500' },
      { label: 'Đã thu hồi', value: `${completedWeight.toFixed(1)}kg`, icon: CheckCircle2, color: 'text-emerald-500' },
      { label: 'Đội ngũ', value: collectors.length, icon: UsersIcon, color: 'text-blue-500' },
    ];
  }, [requests, collectors]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center opacity-40">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
      <p className="font-black tracking-widest uppercase text-[10px]">Đang tải dữ liệu...</p>
    </div>
  );

  const tabs = [
    { id: 'All', label: 'Tất cả', count: requests.length },
    { id: 'Pending', label: 'Mới', count: requests.filter(r => r.status === 'Pending').length, color: 'text-orange-500' },
    { id: 'Assigned', label: 'Đã điều phối', count: requests.filter(r => r.status === 'Assigned').length, color: 'text-indigo-500' },
    { id: 'Accepted', label: 'Đang thu gom', count: requests.filter(r => r.status === 'Accepted').length, color: 'text-blue-500' },
    { id: 'Collected', label: 'Đã hoàn thành', count: requests.filter(r => r.status === 'Collected').length, color: 'text-emerald-500' }
  ];

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Quản lý Thu gom</h1>
          <p className="text-on-surface-variant font-medium text-sm">Xử lý tập trung các yêu cầu thu gom vật liệu từ cộng đồng.</p>
        </div>
        <div className="flex wrap gap-3">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-surface-container-low border border-surface-container-high px-4 py-3 rounded-2xl flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-surface-container-high ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">{stat.label}</p>
                <p className="text-base font-black text-on-surface leading-none">{stat.value}</p>
              </div>
            </div>
            ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest/50 backdrop-blur-md rounded-3xl p-3 border border-surface-container-high flex flex-col xl:flex-row gap-4">
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-1 bg-surface-container-high/30 rounded-2xl flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/40'}
              `}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant/40'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/30" />
            <input 
              type="text" 
              placeholder="Tìm kiếm cư dân, địa chỉ..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-surface-container-high rounded-2xl py-2.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        <button type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <FileText className="w-4 h-4" />
            Báo cáo
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="px-8 grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
          <div className="col-span-1">Mã số</div>
          <div className="col-span-3">Cư dân & Địa chỉ</div>
          <div className="col-span-1 text-center">Vật liệu</div>
          <div className="col-span-2 text-center">Thời gian</div>
          <div className="col-span-2 text-center">Phụ trách</div>
          <div className="col-span-1 text-center font-bold">Trạng thái</div>
          <div className="col-span-2 text-center">Thao tác</div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar pb-10 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage + activeTab + searchQuery}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                exit: { opacity: 0, transition: { duration: 0.2 } }
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              className="space-y-3"
            >
              {paginatedRequests.length > 0 ? paginatedRequests.map((req, idx) => (
                <RequestRow 
                  key={req.id} 
                  index={idx}
                  req={req} 
                collectors={collectors}
                  onStatus={handleStatus}
                  onAssign={handleAssign}
                  onView={() => { setSelectedRequest(req); setModalMode('view'); }}
                  onEdit={() => { setSelectedRequest(req); setModalMode('edit'); }}
                  onOpenCoordination={() => handleOpenCoordination(req)}
                  onCancel={() => setCancellingRequest(req)}
                />
            )) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
                  className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-surface-container-highest rounded-[3rem] text-on-surface-variant"
                >
                  <Package className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-xs">Không tìm thấy yêu cầu nào</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRequest && (
          <RequestDetailModal 
            req={requests.find(r => r.id == selectedRequest.id) || selectedRequest} 
            readOnly={modalMode === 'view'}
            onClose={() => { setSelectedRequest(null); setModalMode('view'); }} 
            collectors={collectors}
            onAssign={handleAssign}
            onStatus={handleStatus}
            onCancel={(req) => { setSelectedRequest(null); setCancellingRequest(req); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {coordinatingRequest && (
          <CoordinationDrawer 
            req={coordinatingRequest}
            collectors={collectors}
            onAssign={handleAssign}
            onClose={() => setCoordinatingRequest(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancellingRequest && (
          <CancellationDialog
            req={cancellingRequest}
            onClose={() => setCancellingRequest(null)}
            onConfirm={(reason) => {
              handleStatus(cancellingRequest.id, 'Cancelled', reason);
              setCancellingRequest(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RequestRow({ req, collectors, onStatus, onAssign, onView, onEdit, onOpenCoordination, onCancel, index }) {
  const getStatusBadge = () => {
    switch(req.status) {
      case 'Pending': return { color: 'text-orange-500 bg-orange-50', icon: Clock, label: 'Mới' };
      case 'Assigned': return { color: 'text-indigo-500 bg-indigo-50', icon: UsersIcon, label: 'Đã điều phối' };
      case 'Accepted': return { color: 'text-blue-500 bg-blue-50', icon: Truck, label: 'Đang đi' };
      case 'Collected': return { color: 'text-emerald-500 bg-emerald-50', icon: CheckCircle, label: 'Xong' };
      case 'Cancelled': return { color: 'text-red-500 bg-red-50', icon: X, label: 'Đã hủy' };
      default: return { color: 'text-on-surface-variant/40 bg-surface-container', icon: HelpCircle, label: 'N/A' };
    }
  };

  const status = getStatusBadge();

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
      }}
      whileHover={{ scale: 1.005, backgroundColor: 'white', transition: { duration: 0.2 } }}
      onClick={onView}
      className="bg-white/60 backdrop-blur-sm border border-surface-container-high rounded-[1.5rem] p-4 grid grid-cols-12 gap-4 items-center cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all group relative"
    >
      <div className="col-span-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary/40 font-mono leading-none mb-1">REQ</span>
          <span className="text-sm font-black text-on-surface leading-none">
            {req.id?.toString().includes('-') ? req.id.toString().split('-')[1] : (req.id || 'N/A')}
          </span>
        </div>
        </div>
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant font-black shrink-0 shadow-sm border border-white/50">
            {req.citizenName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-on-surface text-sm truncate group-hover:text-primary transition-colors">
              {req.citizenName || 'Khách vãng lai'}
            </h4>
            <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/40 truncate">
              <MapPin className="w-3 h-3" />
              {req.address || req.locationText || 'Không rõ địa chỉ'}
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1 text-center flex flex-col items-center justify-center">
        <p className="text-[11px] font-black text-on-surface truncate w-full mb-1">{req.wasteType}</p>
        <div className="px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1.5 leading-none">
          <Scale className="w-2.5 h-2.5 text-emerald-600/60" />
          <span className="text-[10px] font-black text-emerald-700">{req.weightKg} kg</span>
        </div>
      </div>
      <div className="col-span-2 text-center flex justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-black text-on-surface mb-1"><Calendar className="w-3.5 h-3.5 text-primary/50" />{new Date(req.createdAt).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/40"><Clock className="w-3.5 h-3.5" />{new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
        </div>
      </div>
      <div className="col-span-2 text-center flex justify-center">
        {req.collectorId && (req.status === 'Assigned' || req.status === 'Collected') ? (
          <div className="inline-flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/30">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <div className="flex flex-col items-start leading-tight">
              <p className="text-[11px] font-extrabold text-indigo-600 truncate max-w-[80px]">
                {req.collectorName || 'Đang cập nhật...'}
              </p>
              <p className="text-[9px] font-bold text-indigo-400/60">
                {req.collectorPhone || "Chưa có SĐT"}
              </p>
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm transition-all antialiased">
            <User className="w-4 h-4 text-indigo-400" />
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none">
              N/A
            </p>
          </div>
        )}
      </div>
      <div className="col-span-1 flex justify-center items-center">
          <div className={`p-2 rounded-2xl ${status.color} border border-white/50 flex flex-col items-center gap-1 min-w-[55px]`}>
          <status.icon className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-tighter">{status.label}</span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center gap-2">
        {req.status === 'Pending' && (
          <div className="flex gap-1.5">
            <button type="button" onClick={(e) => { e.stopPropagation(); onOpenCoordination(); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all flex items-center gap-1">Điều phối</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onCancel(); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10 active:scale-95 transition-all">Hủy</button>
          </div>
        )}
        {req.status === 'Assigned' && (
           <button type="button" onClick={(e) => { e.stopPropagation(); onOpenCoordination(); }} className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-colors">Sửa điều phối</button>
        )}
        {(req.status === 'Accepted' || req.status === 'Collected') && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20"><Edit className="w-3.5 h-3.5" /> Sửa</button>
        )}
        {req.status === 'Cancelled' && (
          <div className="flex items-center gap-2 px-5 py-2 bg-on-surface/5 text-on-surface-variant/20 rounded-xl border border-dashed border-on-surface/10 grayscale">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Đã khóa</span>
          </div>
        )}
      </div>
      </motion.div>
  );
}

function CoordinationDrawer({ req, onAssign, onClose }) {
  const [selectedCol, setSelectedCol] = useState(null);
  const [localCollectors, setLocalCollectors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocalCollectors = async () => {
      setLoading(true);
      try {
        const cols = await getCollectors(req.wardId);
        const mapped = cols.map(c => ({
          ...c,
          name: c.displayName || c.fullName || "N/A"
        }));
        setLocalCollectors(mapped);
      } catch (err) {
        console.error("Failed to fetch local collectors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocalCollectors();
  }, [req.wardId]);

  return (
    <div className="fixed inset-0 z-[150] flex justify-end overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.2)] flex flex-col">
        <div className="p-8 border-b border-surface-container-high bg-surface-container-low/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 font-mono">Trung tâm điều phối</p>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Khu vực: {req.wardName || 'Chưa xác định'}</h2>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-surface-container-highest rounded-2xl transition-all"><X className="w-6 h-6 text-on-surface-variant/30" /></button>
          </div>
          <div className="bg-surface-container-low border border-surface-container-high rounded-3xl p-5 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">{(req.citizenName || "?").charAt(0)}</div>
                <div>
                   <h4 className="font-black text-on-surface leading-tight mb-1">{req.citizenName || 'Người dân'}</h4>
                   <p className="text-[10px] font-bold text-on-surface-variant/50 flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{req.address || req.locationText}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-surface-container-low/20">
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
               <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Đang tìm cộng tác viên trong Phường...</p>
             </div>
           ) : localCollectors.length > 0 ? (
             <div className="grid grid-cols-2 gap-4">
                {localCollectors.map(c => (
                  <button
                    key={c.userId} onClick={() => setSelectedCol(c.userId)}
                    className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 relative group ${selectedCol === c.userId ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-500/10' : 'border-transparent bg-on-surface/5 hover:bg-on-surface/10 hover:scale-[1.02]'}`}
                  >
                    {selectedCol && selectedCol === c.userId && <div className="absolute top-4 right-4 bg-indigo-500 text-white rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300"><CheckCircle className="w-3.5 h-3.5" /></div>}
                    <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center transition-all duration-300 ${selectedCol && selectedCol === c.userId ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30' : 'bg-surface-container-highest text-on-surface-variant/40'}`}><User className="w-7 h-7" /></div>
                    <div className="text-center">
                       <p className={`text-xs font-black tracking-tight mb-1 ${selectedCol === c.userId ? 'text-indigo-700' : 'text-on-surface'}`}>{c.name}</p>
                       <p className={`text-[11px] font-black uppercase tracking-tighter font-mono ${selectedCol === c.userId ? 'text-indigo-500' : 'text-on-surface-variant/50'}`}>
                         {c.phoneNumber || c.phone || "Chưa có SĐT"}
                       </p>
                    </div>
                  </button>
                ))}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center space-y-4 text-center opacity-40">
               <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center"><User className="w-8 h-8" /></div>
               <p className="text-xs font-bold text-on-surface max-w-[200px]">Không tìm thấy cộng tác viên nào được giao phụ trách phường này.</p>
             </div>
           )}
        </div>

        <div className="p-8 bg-white border-t border-surface-container-high">
           <button
             disabled={!selectedCol}
             onClick={() => { if(selectedCol) { onAssign(req.id, selectedCol); onClose(); } }}
             className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${
               selectedCol 
                 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/40' 
                 : 'bg-surface-container-high text-on-surface-variant/20 cursor-not-allowed border-2 border-dashed border-surface-container-highest'
             }`}
           >
             {selectedCol ? 'Xác nhận nhân viên' : 'Chọn nhân viên để tiếp tục'}
             <ArrowRight className={`w-4 h-4 ${!selectedCol && 'opacity-20'}`} />
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function RequestDetailModal({ req, onClose, collectors, onAssign, onStatus, onCancel, readOnly = false }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = req.images || req.imageUrls || [];
  console.log("Images in ReportModal:", images);

  const currentStatus = (() => {
    switch(req.status) {
      case 'Pending': return { color: 'text-orange-500 bg-orange-50', icon: Clock, label: 'Mới' };
      case 'Accepted': return { color: 'text-blue-500 bg-blue-50', icon: CheckCircle2, label: 'Đã duyệt' };
      case 'Assigned': return { color: 'text-indigo-500 bg-indigo-50', icon: Truck, label: 'Đang đi' };
      case 'Collected': return { color: 'text-emerald-500 bg-emerald-50', icon: CheckCircle, label: 'Xong' };
      case 'Cancelled': return { color: 'text-red-500 bg-red-50', icon: X, label: 'Đã hủy' };
      default: return { color: 'text-on-surface-variant/40 bg-surface-container', icon: HelpCircle, label: 'N/A' };
    }
  })();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-on-surface/60 backdrop-blur-md" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="bg-white w-full max-w-6xl overflow-hidden rounded-[3rem] shadow-2xl relative z-10 flex h-auto max-h-[85vh]"
      >
        {/* Left: Image Section */}
        <div className="w-4/12 bg-surface-container-high relative flex-shrink-0 flex flex-col">
          <div className="flex-1 relative bg-black/5">
            {images.length > 0 ? (
              <img src={`${images[currentImageIndex]}?t=${Date.now()}`} alt="Waste" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-highest text-on-surface-variant/20">
                <Package className="w-16 h-16 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Không có hình ảnh</p>
              </div>
            )}
            <div className="absolute top-6 left-6">
              <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center gap-2 border border-white/50 z-10">
                 <div className="w-2 h-2 rounded-full bg-primary" />
                 <span className="text-[10px] font-black text-on-surface uppercase tracking-widest font-mono">#{req.id}</span>
              </div>
            </div>
          </div>
          
          {/* Thumbnails below the main image if there are multiple */}
          {images.length > 1 && (
            <div className="bg-surface-container-low border-t border-surface-container p-4 flex gap-3 overflow-x-auto no-scrollbar shadow-inner shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    currentImageIndex === idx 
                      ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={`${img}?t=${Date.now()}`} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Content Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-10 pb-0 flex justify-between items-start gap-6">
            <div className="min-w-0">
              <h2 className="text-3xl font-black text-on-surface leading-tight mb-2 truncate">{req.citizenName}</h2>
              <div className="flex items-center gap-2 text-on-surface-variant/60 font-bold text-sm truncate">
                <MapPin className="w-4 h-4 text-primary" />
                {req.address || req.locationText}
              </div>
            </div>
            
            <div className={`px-5 py-2.5 rounded-[1.5rem] ${currentStatus.color} border border-white shadow-sm flex items-center gap-3 shrink-0`}>
               <currentStatus.icon className="w-4 h-4" />
               <span className="text-xs font-black uppercase tracking-widest">{currentStatus.label}</span>
            </div>

            {req.priority && (
              <div className={`px-4 py-2 rounded-2xl border-2 flex items-center gap-2 shrink-0 ${
                req.priority === 'High' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                req.priority === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  req.priority === 'High' ? 'bg-rose-500 animate-pulse' :
                  req.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">{req.priority === 'High' ? 'Ưu tiên cao' : req.priority === 'Medium' ? 'Trung bình' : 'Tiêu chuẩn'}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-10 pt-8 no-scrollbar space-y-8">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Materials */}
              <div className="bg-surface-container/50 rounded-[2rem] p-6 border border-surface-container-high">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                   <Package className="w-3.5 h-3.5" /> Cơ cấu loại rác
                 </h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-on-surface/5 pb-3">
                       <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">{req.wasteType}</span>
                       <span className="text-xs font-bold text-on-surface-variant/40">{req.weightKg} kg (Tổng)</span>
                    </div>

                    <div className="space-y-3">
                      {req.materials?.map((m, i) => (
                        <div key={i} className="flex justify-between items-center group">
                          <span className="text-xs font-black text-on-surface">{m.type}</span>
                          <span className="text-xs font-bold text-on-surface-variant/40">{m.amount} {m.unit}</span>
                        </div>
                      )) || <p className="text-xs font-black text-on-surface-variant/30 italic">Không có chi tiết thành phần</p>}
                    </div>
                  </div>
              </div>

              {/* Note & Times */}
               <div className="flex flex-col gap-6">
                 <div className="bg-surface-container/50 rounded-[2rem] p-6 border border-surface-container-high italic text-on-surface-variant/70 min-h-[120px]">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-3 not-italic">
                       Ghi chú của cư dân
                    </h4>
                    <p className="text-xs font-bold leading-relaxed">"{req.note || 'Không có ghi chú thêm.'}"</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-high">
                       <p className="text-[9px] font-black text-on-surface-variant/40 uppercase mb-2">Giờ bắt đầu</p>
                       <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-black text-on-surface">
                            {req.status === 'Assigned' || req.status === 'Collected' 
                              ? new Date(new Date(req.createdAt).getTime() + 3600000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                              : '---'}
                          </span>
                       </div>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-high">
                       <p className="text-[9px] font-black text-on-surface-variant/40 uppercase mb-2">Giờ hoàn tất</p>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-black text-on-surface">
                            {req.status === 'Collected' 
                              ? new Date(new Date(req.createdAt).getTime() + 7200000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                              : '---'}
                          </span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Interaction Grid: Status & Staff Selection */}
            {req.status !== 'Cancelled' && (
              <div className="grid grid-cols-12 gap-8">
                {/* Status Updates */}
                {!readOnly && (
                  <div className="col-span-4 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <h4 className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] whitespace-nowrap">Cập nhật tiến độ</h4>
                      <div className="flex-1 h-[1px] bg-on-surface/5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'Accepted', label: 'Duyệt hồ sơ', color: 'bg-blue-500' },
                        { id: 'Assigned', label: 'Đang vận chuyển', color: 'bg-indigo-500' },
                        { id: 'Collected', label: 'Đã hoàn thành', color: 'bg-emerald-500' }
                      ].map(s => (
                        <button 
                          key={s.id} 
                          type="button"
                          onClick={() => onStatus(req.id, s.id)}
                          className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            req.status === s.id 
                              ? `${s.color} text-white shadow-lg shadow-on-surface/5 scale-[1.02]` 
                              : 'bg-surface-container-high text-on-surface-variant/40 hover:bg-surface-container-highest'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              
           {/* Staff Selection Area */}
                <div className={`${readOnly ? 'col-span-12' : 'col-span-8'} space-y-4`}>
                  <div className="flex items-center gap-3 px-2">
                     <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] whitespace-nowrap">
                       {readOnly ? 'Nhân viên phụ trách' : 'Điều phối nhân viên'}
                     </h4>
                     <div className="flex-1 h-[1px] bg-on-surface/5" />
                  </div>
                  
                  <div className={`grid ${readOnly ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
                    {(() => {
                      const filtered = collectors.filter(c => {
                        if (readOnly && req.collectorId === (c.userId || c.id)) return true;
                        // Check if collector is assigned to this ward
                        return c.wardIds && c.wardIds.includes(Number(req.wardId));
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="col-span-12 py-8 flex flex-col items-center justify-center bg-surface-container/30 rounded-[2rem] border border-dashed border-on-surface/5">
                            <UsersIcon className="w-8 h-8 text-on-surface-variant/20 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Không có nhân viên trong khu vực này</p>
                          </div>
                        );
                      }

                      return filtered.map(c => (
                        <button 
                          key={c.userId || c.id} 
                          type="button"
                          onClick={() => !readOnly && onAssign(req.id, c.userId || c.id)}
                          className={`p-3 rounded-[1.8rem] flex items-center gap-3 border-2 transition-all group ${
                            req.collectorId === (c.userId || c.id)
                            ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10' 
                            : 'border-transparent bg-on-surface-variant/5'
                          } ${readOnly ? 'cursor-default' : 'hover:bg-on-surface-variant/10 cursor-pointer'}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            req.collectorId === (c.userId || c.id) ? 'bg-indigo-500 text-white' : 'bg-surface-container-high text-on-surface-variant/40'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 text-left">
                            <p className={`text-[10px] font-black truncate leading-none mb-1.5 ${req.collectorId === (c.userId || c.id) ? 'text-indigo-700' : 'text-on-surface'}`}>{c.name || c.displayName}</p>
                            <p className={`text-[11px] font-black font-mono tracking-tighter truncate ${req.collectorId === (c.userId || c.id) ? 'text-indigo-500' : 'text-on-surface-variant/50'}`}>
                              {c.phoneNumber || c.phone || "Chưa có SĐT"}
                            </p>
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-10 pt-4 bg-white/50 border-t border-on-surface/5 flex justify-between items-center">
             <div className="flex items-center gap-6">
                {!readOnly && req.status === 'Pending' && (
                  <button type="button" onClick={() => onStatus(req.id, 'Accepted')} className="px-10 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3">
                    Tiếp nhận hồ sơ <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {!readOnly && req.status !== 'Pending' && req.status !== 'Cancelled' && req.status !== 'Collected' && (
                  <button 
                    type="button"
                    onClick={() => onCancel(req)} 
                    className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black uppercase tracking-widest hover:bg-red-100 transition-all text-[10px]"
                  >
                    Hủy đơn thu gom
                  </button>
                )}
             </div>
             
             <div className="flex gap-4">
                {!readOnly && req.status === 'Pending' && (
                  <button type="button" onClick={() => onCancel(req)} className="px-8 bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-100 transition-all">Hủy đơn</button>
                )}
                
                {!readOnly && req.status !== 'Pending' && req.status !== 'Cancelled' && (
                  <button type="button" onClick={onClose} className="px-12 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Xác nhận
                  </button>
                )}

                <button type="button" onClick={onClose} className="px-10 py-4 bg-surface-container-high text-on-surface-variant rounded-2xl font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all">
                  {req.status === 'Pending' ? 'Đóng' : 'Quay lại'}
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CancellationDialog({ req, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-red-950/20 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 10 }} 
        className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-10 pb-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-on-surface mb-2">Hủy đơn thu gom?</h3>
          <p className="text-sm font-bold text-on-surface-variant/60 leading-relaxed mb-8">
            Vui lòng cho biết lý do hủy đơn của <span className="text-on-surface font-black">{req.citizenName}</span>.
          </p>

          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Sai thông tin địa chỉ, rác không đúng quy định..."
            className="w-full h-32 bg-surface-container border-2 border-surface-container-highest focus:border-red-500 rounded-[2rem] p-6 text-sm font-bold text-on-surface focus:outline-none transition-all resize-none placeholder:text-on-surface-variant/20"
          />
        </div>

        <div className="p-8 bg-surface-container-high/50 flex flex-col gap-3">
          <button 
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className={`w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${
              reason.trim() 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/30' 
                : 'bg-on-surface/5 text-on-surface-variant/20 cursor-not-allowed border-2 border-dashed border-on-surface/10'
            }`}
          >
            {reason.trim() ? 'Xác nhận hủy đơn' : 'Hãy nhập lý do'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-xs font-black text-on-surface-variant hover:text-on-surface transition-all uppercase tracking-widest"
          >
            Quay lại
          </button>
        </div>
      </motion.div>
    </div>
  );
}
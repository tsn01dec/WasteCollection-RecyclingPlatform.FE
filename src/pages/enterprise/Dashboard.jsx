import React, { useEffect, useState } from 'react';
import { getCapacity } from '../../api/areaApi';
import { getAllWasteReports } from '../../api/WasteReportapi';
import { Activity, PackageCheck, AlertCircle, Weight } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({ capacity: null, requests: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cap, reqs] = await Promise.all([getCapacity(), getAllWasteReports()]);
        setData({ capacity: cap, requests: reqs });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { capacity, requests } = data;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const assignedCount = requests.filter(r => r.status === 'Assigned').length;
  const totalKgThisMonth = capacity?.areas?.reduce((sum, a) => sum + (a.processedThisMonthKg || 0), 0) || 0;
  const totalCapacityKg = capacity?.areas?.reduce((sum, a) => sum + (a.monthlyCapacityKg || 0), 0) || 0;
  const capacityPct = totalCapacityKg ? Math.min(100, Math.round((totalKgThisMonth / totalCapacityKg) * 100)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Chào mừng trở lại, Doanh nghiệp</h1>
        <p className="text-on-surface-variant font-medium text-lg">Dưới đây là tình hình thu gom rác của bạn hôm nay.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Chờ xử lý" value={pendingCount} icon={<AlertCircle className="w-6 h-6 text-error" />} />
        <StatCard title="Đang thực hiện" value={assignedCount} icon={<Activity className="w-6 h-6 text-primary" />} />
        <StatCard title="Đã xử lý" value={`${totalKgThisMonth.toLocaleString()} kg`} icon={<Weight className="w-6 h-6 text-primary" />} />
        <StatCard title="Công suất tháng" value={`${capacityPct}%`} icon={<PackageCheck className="w-6 h-6 text-primary-container" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 border border-surface-container-highest botanical-shadow">
          <h2 className="text-2xl font-bold mb-6 text-on-surface">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors">
                <div>
                  <p className="font-bold text-on-surface">{req.citizenName || 'Người dân'}</p>
                  <p className="text-sm text-on-surface-variant">
                    {req.wasteType} • {req.weightKg || req.actualTotalWeightKg || 0}kg • {req.locationText || req.address}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                  req.status === 'Pending' ? 'bg-error/10 text-error' :
                  req.status === 'Assigned' ? 'bg-primary/10 text-primary' :
                  'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary text-white rounded-3xl p-8 botanical-shadow flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Tình trạng Năng lực</h2>
            <p className="text-primary-container/80 text-sm mb-8 font-medium">Hệ thống đang hoạt động trơn tru.</p>
            
            <div className="flex items-end gap-2 mb-4">
              <span className="text-6xl font-extrabold tracking-tighter">{capacityPct}%</span>
              <span className="text-lg font-bold mb-2 opacity-80">Đã dùng</span>
            </div>
            
            <div className="w-full bg-black/20 rounded-full h-3 mb-2 overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${capacityPct}%` }}></div>
            </div>
            <p className="text-xs opacity-70 text-right">{totalKgThisMonth.toLocaleString()} / {totalCapacityKg.toLocaleString()} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container-highest botanical-shadow hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{title}</h3>
        <div className="p-3 bg-surface-container-low rounded-2xl">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold text-on-surface">{value}</p>
    </div>
  );
}

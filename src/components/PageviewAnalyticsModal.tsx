import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  X, 
  RefreshCw, 
  Search, 
  Globe, 
  Calendar, 
  Clock, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Filter
} from 'lucide-react';
import { fetchAnalyticsSummary, AnalyticsSummaryRow } from '../services/analyticsService';

interface PageviewAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PageviewAnalyticsModal: React.FC<PageviewAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<AnalyticsSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const rows = await fetchAnalyticsSummary();
      setData(rows);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const uniqueDomains = useMemo(() => {
    const domains = new Set(data.map((d) => d.domain));
    return Array.from(domains).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = 
        row.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDomain = selectedDomain === 'all' || row.domain === selectedDomain;
      return matchesSearch && matchesDomain;
    });
  }, [data, searchTerm, selectedDomain]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, r) => {
        acc.total += Number(r.totalViews) || 0;
        acc.month += Number(r.viewsThisMonth) || 0;
        acc.today += Number(r.viewsToday) || 0;
        return acc;
      },
      { total: 0, month: 0, today: 0 }
    );
  }, [filteredData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-prompt">
                  Pageview Analytics (สถิติการเข้าชมหน้าเพจ)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Cloudflare Workers & D1
                </span>
              </div>
              <p className="text-xs text-slate-300">
                สถิติผู้เข้าชมแบบเรียลไทม์ เชื่อมโยงฐานข้อมูลเดียวกันกับ MedNU Scopus Dashboard & iRAM Ecosystem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader / Summary KPIs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">ยอดเข้าชมทั้งหมด (Views)</span>
              <span className="text-xl font-bold font-mono text-blue-700">{totals.total.toLocaleString()}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">ยอดเข้าชมเดือนนี้ (Month)</span>
              <span className="text-xl font-bold font-mono text-emerald-700">{totals.month.toLocaleString()}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-orange-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">ยอดเข้าชมวันนี้ (Today)</span>
              <span className="text-xl font-bold font-mono text-orange-700">{totals.today.toLocaleString()}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Domain Filter, Refresh */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาโดเมน หรือ เส้นทาง (/path)..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">ทุกโดเมน ({uniqueDomains.length})</option>
              {uniqueDomains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {lastRefreshed && (
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                อัปเดตเมื่อ: {lastRefreshed.toLocaleTimeString('th-TH')}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4 font-prompt">Domain / Path</th>
                  <th className="py-2.5 px-4 text-center w-24 font-prompt">Views</th>
                  <th className="py-2.5 px-4 text-center w-24 font-prompt">Month</th>
                  <th className="py-2.5 px-4 text-center w-24 font-prompt">Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      <span>กำลังดึงข้อมูลสถิติจาก Cloudflare API...</span>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      ไม่พบข้อมูลสถิติที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const isCurrentHost = window.location.hostname === row.domain;
                    return (
                      <tr 
                        key={`${row.domain}-${row.path}-${idx}`}
                        className={`hover:bg-blue-50/40 transition-colors ${isCurrentHost ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900 flex items-center gap-2">
                          <Globe className={`w-3.5 h-3.5 shrink-0 ${isCurrentHost ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span className="truncate max-w-[360px] sm:max-w-none">
                            <span className={isCurrentHost ? 'text-blue-900 font-bold' : 'text-slate-800'}>
                              {row.domain}
                            </span>
                            <span className="text-slate-500">{row.path}</span>
                          </span>
                          {isCurrentHost && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0 font-sans">
                              ระบบนี้
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono text-white bg-[#2563eb] shadow-2xs">
                            {row.totalViews}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono text-white bg-[#059669] shadow-2xs">
                            {row.viewsThisMonth}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono text-white bg-[#ea580c] shadow-2xs">
                            {row.viewsToday}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Anonymous Analytics (ไม่เก็บข้อมูลส่วนบุคคล, ป้องกันการนับซ้ำ 30 นาทีต่อเซสชัน)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};

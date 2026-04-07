import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
    LayoutDashboard, Database, ShoppingCart, Smartphone, Activity, Zap, Plus, Package,
    CheckCircle2, XCircle, X, Search, ChevronDown, RefreshCw, Warehouse, AlertTriangle,
    Truck, FileSpreadsheet, Box, Filter, Clock, ArrowDownCircle, Layers, Info, PlusCircle, Tag,
    TrendingUp, BarChart3, PieChart, ArrowUpRight, ShieldCheck
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5188/api/mes';

// --- Dashboard Helper Components ---

function StatCard({ label, value, unit, icon: Icon, color, trend }) {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
    };

    return (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform ${color === 'blue' ? 'text-blue-600' : color === 'red' ? 'text-red-600' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>
                <Icon size={120} />
            </div>
            <div className="flex justify-between items-start mb-4 text-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${colorMap[color]}`}>{trend}</span>
            </div>
            <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">
                {value}<span className="text-sm not-italic ml-1 opacity-20 uppercase font-bold">{unit}</span>
            </h4>
        </div>
    );
}

function ProgressItem({ label, val, color }) {
    return (
        <div>
            <div className="flex justify-between text-[10px] font-black uppercase mb-2 opacity-50">
                <span>{label}</span>
                <span>{val}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div style={{ width: `${val}%` }} className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} />
            </div>
        </div>
    );
}

// --- Dash Component (Integrated with Real DB Data) ---

const Dash = ({ inventoryList, finishedList, defectList, pdaJobs, loading, onRefresh }) => {
    // 💡 DB에서 넘어온 데이터를 기반으로 실시간 통계 계산
    const stats = useMemo(() => {
        const totalProduced = finishedList.length;
        const totalDefects = defectList.length;
        const totalInbound = inventoryList.reduce((acc, cur) => acc + (cur.StockQty || cur.stockQty || 0), 0);

        // 수율 계산: (정상 / (정상+불량)) * 100
        const yieldRate = (totalProduced + totalDefects) > 0
            ? ((totalProduced / (totalProduced + totalDefects)) * 100).toFixed(1)
            : "100.0";

        // 💡 날짜별 생산량 계산 (최근 7일 추이)
        const dailyStats = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

            // DB의 InDate가 YYYY-MM-DD 형식을 포함하는지 체크
            const dayProduced = finishedList.filter(item => {
                const itemDate = (item.InDate || item.inDate || "");
                return itemDate.startsWith(dateStr);
            }).length;

            return { date: dateStr.slice(5), qty: dayProduced }; // MM-DD 형식으로 표시
        }).reverse();


        return { totalProduced, totalDefects, totalInbound, yieldRate, dailyStats };
    }, [inventoryList, finishedList, defectList]);

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="text-left">
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">Intelligence<br />Center</h2>
                    <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Activity size={12} className="text-blue-500 animate-pulse" /> REALTIME FACTORY ANALYTICS
                    </p>
                </div>
                <button onClick={onRefresh} className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:rotate-180 duration-500">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* 통계 카드 섹션 */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard label="완성차 창고" value={stats.totalProduced} unit="Units" icon={Truck} color="blue" trend="Live" />
                <StatCard label="불량 격리소" value={stats.totalDefects} unit="Cases" icon={XCircle} color="red" trend={`${((stats.totalDefects / (stats.totalProduced || 1)) * 100).toFixed(1)}%`} />
                <StatCard label="부품 재고 합계" value={stats.totalInbound} unit="Parts" icon={Package} color="amber" trend="Stock" />
                <StatCard label="공정 수율" value={stats.yieldRate} unit="%" icon={ShieldCheck} color="emerald" trend="Safe" />
            </div>

            <div className="grid grid-cols-3 gap-10">
                {/* 생산량 추이 그래프 */}
                <div className="col-span-2 bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 flex flex-col h-[480px]">
                    <div className="flex justify-between items-start mb-12 text-left">
                        <div>
                            <h3 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">Production Trend</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">실제 DB 입고일(InDate) 기준 최근 7일 통계</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-2xl flex gap-1">
                            <button className="px-4 py-2 bg-white shadow-sm rounded-xl text-[10px] font-black uppercase text-blue-600">Daily</button>
                            <button className="px-4 py-2 text-[10px] font-black uppercase text-slate-400">Weekly</button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-end gap-8 pb-4">
                        {stats.dailyStats.map((d, i) => {
                            const maxQty = Math.max(...stats.dailyStats.map(x => x.qty)) || 1;
                            const barHeight = (d.qty / maxQty) * 250;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
                                    <div className="relative w-full flex flex-col justify-end items-center">
                                        <div
                                            style={{ height: `${barHeight}px`, minHeight: d.qty > 0 ? '4px' : '0' }}
                                            className="w-full max-w-[40px] bg-slate-900 rounded-t-2xl transition-all duration-1000 delay-100 group-hover:bg-blue-600 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                                        />
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg">
                                            {d.qty} Units
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{d.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 창고 점유 및 부족 알림 */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden h-[230px] flex flex-col justify-between shadow-2xl text-left">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full" />
                        <div>
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <PieChart size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Space utilization</span>
                            </div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase">Warehouse Load</h3>
                        </div>
                        <div className="space-y-4 relative">
                            <ProgressItem label="FINISHED WH" val={Math.min(stats.totalProduced * 2, 100)} color="bg-blue-500" />
                            <ProgressItem label="PARTS WH" val={Math.min(Math.floor(stats.totalInbound / 100), 100)} color="bg-amber-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-100 h-[225px] flex flex-col overflow-hidden text-left">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><AlertTriangle size={16} /></div>
                            <h3 className="text-lg font-black italic uppercase tracking-tighter text-slate-800">Critical Stock</h3>
                        </div>
                        <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-hide">
                            {inventoryList.filter(p => (p.StockQty || p.stockQty) < 100).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-red-200 transition-colors">
                                    <span className="text-[10px] font-black text-slate-700 uppercase">{p.PartId || p.partId}</span>
                                    <span className="text-xs font-black text-red-600 italic tracking-tighter animate-pulse">Low: {p.StockQty || p.stockQty}</span>
                                </div>
                            ))}
                            {inventoryList.filter(p => (p.StockQty || p.stockQty) < 100).length === 0 && (
                                <div className="py-10 text-center flex flex-col items-center gap-2 opacity-20">
                                    <Zap size={32} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Stock Safe</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 실시간 로그 섹션 */}
            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50">
                <div className="flex items-center justify-between mb-10 text-left">
                    <h3 className="text-xl font-black italic text-slate-800 uppercase tracking-tighter">Realtime Operations</h3>
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Database Linked</span>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-6">
                    {finishedList.slice(0, 5).map((log, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group hover:bg-slate-900 transition-all duration-500 text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-blue-500 transition-all">
                                <ArrowUpRight size={20} />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 group-hover:text-white/40 uppercase mb-2">Production Done</p>
                            <h5 className="text-lg font-black text-slate-800 group-hover:text-white uppercase italic tracking-tighter mb-1 leading-tight">{log.ModelId || log.modelId}</h5>
                            <p className="text-[10px] font-mono text-blue-600 font-bold group-hover:text-blue-400">{log.LotId || log.lotId}</p>
                        </div>
                    ))}
                    {finishedList.length === 0 && (
                        <div className="col-span-5 py-10 text-center text-slate-300 font-black uppercase italic tracking-widest opacity-30">No Recent Production Data</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Stock Component (Integrated) ---

const Stock = ({
    tab, setTab, inventoryList, finishedList, defectList,
    searchTerm, setSearchTerm, loading, fetchAllStocks, handleInboundSubmit, inboundForm, setInboundForm
}) => {
    const getActiveList = () => {
        if (tab === 'FINISHED') return finishedList || [];
        if (tab === 'DEFECT') return defectList || [];
        return inventoryList || [];
    };

    const filteredList = getActiveList().filter(item => {
        const s = searchTerm.toLowerCase();
        const lotId = (item.LotId || item.lotId || "").toString().toLowerCase();
        const defectId = (item.DefectId || item.defectId || "").toString().toLowerCase();
        const partId = (item.PartId || item.partId || "").toString().toLowerCase();
        const modelInfo = (item.Models || item.models || item.ModelId || item.modelId || "").toLowerCase();
        const category = (item.Category || item.category || "").toLowerCase();
        return lotId.includes(s) || defectId.includes(s) || partId.includes(s) || modelInfo.includes(s) || category.includes(s);
    });

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white p-1.5 rounded-3xl shadow-sm border border-slate-200 gap-1">
                        <button onClick={() => setTab('inventory')} className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'inventory' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Package size={14} /> 부품재고
                        </button>
                        <button onClick={() => setTab('FINISHED')} className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'FINISHED' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <Truck size={14} /> 완성차 창고
                        </button>
                        <button onClick={() => setTab('DEFECT')} className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${tab === 'DEFECT' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                            <AlertTriangle size={14} /> 불량 격리소
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="text" placeholder="통합 키워드 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 py-3 pl-12 pr-6 rounded-2xl text-xs font-bold outline-none w-64 shadow-sm focus:ring-4 focus:ring-blue-50" />
                        </div>
                        <button onClick={fetchAllStocks} className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                    </div>
                </div>

                {tab === 'inventory' && (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-blue-100 mb-8 flex items-center justify-between animate-in slide-in-from-top-4 text-left">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ArrowDownCircle size={24} /></div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Inbound Registry</h3>
                                <p className="text-[10px] text-blue-500 font-bold tracking-widest mt-1 italic uppercase">부품 재고 보충</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-800">
                            <select value={inboundForm.partId} onChange={(e) => setInboundForm({ ...inboundForm, partId: e.target.value })} className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-xs font-black outline-none w-64 cursor-pointer">
                                {inventoryList.map((p, idx) => (
                                    <option key={idx} value={p.PartId || p.partId}>{p.PartId || p.partId}</option>
                                ))}
                            </select>
                            <input type="number" value={inboundForm.qty} min="1" onChange={(e) => setInboundForm({ ...inboundForm, qty: e.target.value })} className="bg-slate-50 px-6 py-3 w-28 rounded-2xl border border-slate-100 text-center font-black outline-none text-blue-600" />
                            <button onClick={handleInboundSubmit} disabled={loading} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">입고 확정</button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse text-slate-800">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-10 py-6 w-20 text-center border-r border-slate-100">No.</th>
                                    <th className="px-10 py-6 border-r border-slate-100">{tab === 'inventory' ? '부품 ID' : '식별 ID'}</th>
                                    <th className="px-10 py-6 border-r border-slate-100">모델 / 상세 정보</th>
                                    <th className="px-10 py-6 border-r border-slate-100 text-center">수량</th>
                                    <th className="px-10 py-6 text-center">일시/상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                                {filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Activity className="text-slate-200 animate-pulse" size={48} />
                                                <p className="text-slate-300 font-black uppercase tracking-widest italic">{loading ? 'Fetching Data...' : `No Data Available`}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredList.map((item, idx) => {
                                        const partId = item.PartId || item.partId;
                                        const category = item.Category || item.category;
                                        const models = item.Models || item.models;
                                        const stockQty = item.StockQty !== undefined ? item.StockQty : item.stockQty;
                                        const displayId = tab === 'FINISHED' ? (item.LotId || item.lotId) : tab === 'DEFECT' ? (item.DefectId || item.defectId) : partId;
                                        const modelId = item.ModelId || item.modelId || 'N/A';
                                        const jobId = item.JobId || item.jobId || 'N/A';
                                        const reason = item.Reason || item.reason || 'Manual Rejected';
                                        const date = item.InDate || item.inDate || item.RegDate || item.regDate;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-10 py-7 text-[10px] text-slate-300 font-mono text-center italic border-r border-slate-100/30">{idx + 1}</td>
                                                <td className="px-10 py-7 border-r border-slate-100/30 text-left">
                                                    <span className="text-blue-600 font-mono text-xl uppercase tracking-tighter">{displayId}</span>
                                                    {tab !== 'inventory' && <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 text-xs">Job: {jobId}</div>}
                                                </td>
                                                <td className="px-10 py-7 border-r border-slate-100/30 text-left">
                                                    <div className="flex flex-col">
                                                        <span className={`font-black uppercase text-2xl italic tracking-tighter leading-none ${tab === 'DEFECT' ? 'text-red-600' : 'text-slate-800'}`}>
                                                            {tab === 'inventory' ? (models || 'All Models') : modelId}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${tab === 'FINISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : tab === 'DEFECT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                                                                {tab === 'FINISHED' ? 'Completed' : tab === 'DEFECT' ? reason : category || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-center border-r border-slate-100/30">
                                                    <span className={`text-4xl font-black italic tracking-tighter ${(tab === 'inventory' ? stockQty : (item.Qty || item.qty || 0)) < 10 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                                                        x{tab === 'inventory' ? stockQty : (item.Qty || item.qty || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-7 text-center text-left">
                                                    {tab === 'inventory' ? (
                                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase border bg-slate-100 text-slate-500">In Stock</span>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-slate-400 font-mono text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={14} className={tab === 'DEFECT' ? 'text-red-400' : 'text-blue-500'} />
                                                                {date ? new Date(date).toLocaleDateString() : '-'}
                                                            </div>
                                                            <div className="text-[10px] text-slate-300 uppercase">{date ? new Date(date).toLocaleTimeString() : ''}</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-16 bg-slate-900 px-12 flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-10">
                            <span className="underline decoration-blue-500 decoration-2 underline-offset-4 tracking-tighter font-black text-xs text-white/80">{tab} STOCK TERMINAL</span>
                            <span>COUNT: {filteredList.length} UNITS</span>
                        </div>
                        <div className="flex items-center gap-3 italic text-blue-400"><Activity size={14} className="animate-pulse" /> DATABASE SYNC ACTIVE</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component (Integrated) ---

export default function App() {
    const [activeMenu, setActiveMenu] = useState(0); // Default: Dashboard (0)
    const [isPdaOpen, setIsPdaOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // State for all data
    const [pdaJobs, setPdaJobs] = useState([]);
    const [inventoryList, setInventoryList] = useState([]);
    const [finishedList, setFinishedList] = useState([]);
    const [defectList, setDefectList] = useState([]);

    // States for components
    const [tab, setTab] = useState('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [inboundForm, setInboundForm] = useState({ partId: '', qty: 1 });

    // Registration states
    const [selectedModel, setSelectedModel] = useState('AVN-01');
    const [inputQty, setInputQty] = useState(20);

    const showNotice = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // 💡 모든 데이터를 서버에서 가져오는 핵심 로직
    const fetchAllStocks = useCallback(async () => {
        setLoading(true);
        try {
            const [resInv, resFin, resDef, resPda] = await Promise.all([
                fetch(`${API_BASE_URL}/inventory`),
                fetch(`${API_BASE_URL}/finished-list`),
                fetch(`${API_BASE_URL}/defect-list`),
                fetch(`${API_BASE_URL}/pda-list`)
            ]);

            if (resInv.ok) {
                const data = await resInv.json();
                setInventoryList(data);
                if (data.length > 0 && !inboundForm.partId) {
                    setInboundForm(prev => ({ ...prev, partId: data[0].PartId || data[0].partId }));
                }
            }
            if (resFin.ok) setFinishedList(await resFin.json());
            if (resDef.ok) setDefectList(await resDef.json());
            if (resPda.ok) setPdaJobs(await resPda.json());
        } catch (error) {
            console.error("Fetch Error:", error);
            showNotice("데이터 동기화 실패", "error");
        } finally {
            setLoading(false);
        }
    }, [inboundForm.partId]);

    useEffect(() => {
        fetchAllStocks();
    }, [fetchAllStocks]);

    // 생산 완료 핸들러
    const handleCompleteProduction = async (jobId, result) => {
        if (!window.confirm(`${result === 'PASS' ? '정상 생산' : '불량 등록'} 처리하시겠습니까?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ JobId: jobId, Result: result })
            });
            if (res.ok) {
                alert("✅ 작업 완료!");
                await fetchAllStocks(); // 대시보드 그래프도 즉시 갱신됨 ㅋ
            } else {
                showNotice(`❌ 부품부족: 재고를 확인하세요.`, "error");
            }
        } catch (e) {
            showNotice(e.message, "error");
        }
    };

    // 입고 등록 핸들러
    const handleInboundSubmit = async () => {
        if (!inboundForm.partId) return showNotice("부품을 선택하세요!", "error");
        setLoading(true);
        if (!window.confirm(`입고등록 하시겠습니까?`)) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ PartId: inboundForm.partId, Qty: Number(inboundForm.qty) })
            });
            if (res.ok) {
                showNotice("✅ 입고 성공");
                fetchAllStocks();
            }
        } catch (e) {
            showNotice("통신 에러", "error");
        } finally {
            setLoading(false);
        }
    };

    // 수주 등록 핸들러
    const handleRegisterOrder = async () => {
        if (inputQty <= 0) return alert("수량을 입력하세요!");
        if (!window.confirm(`수주등록 하시겠습니까?`)) return;
        const payload = {
            OrderId: `SO-${Date.now().toString().slice(-6)}`,
            Customer: '기아 자동차',
            ModelId: selectedModel,
            Qty: inputQty
        };
        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showNotice(`✅ 수주 완료!`);
                fetchAllStocks();
            }
        } catch (e) {
            alert("통신 오류!");
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden select-none text-slate-900 text-left">
            {message.text && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-6 rounded-[2.5rem] shadow-2xl animate-bounce font-black text-sm uppercase border-4 ${message.type === 'error' ? 'bg-red-600 text-white border-red-300' : 'bg-slate-900 text-white border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                        {message.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                        {message.text}
                    </div>
                </div>
            )}

            <aside className="w-64 bg-[#0a1128] flex flex-col shadow-2xl z-30">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-blue-600/20"><Zap size={22} fill="currentColor" /></div>
                    <div className="font-black text-xl text-white tracking-tighter uppercase">NexMES <span className="text-blue-500">PRO</span></div>
                </div>
                <nav className="flex-1 mt-4">
                    {[
                        { id: 0, label: "통합대시보드", icon: LayoutDashboard },
                        { id: 2, label: "수주관리", icon: ShoppingCart },
                        { id: 5, label: "창고관리", icon: Warehouse },
                    ].map((menu) => (
                        <div key={menu.id} onClick={() => setActiveMenu(menu.id)} className={`flex items-center gap-4 px-8 py-4 cursor-pointer transition-all ${activeMenu === menu.id ? 'bg-blue-600 text-white shadow-xl translate-x-2 rounded-l-full' : 'text-slate-400 hover:text-slate-200'}`}>
                            <menu.icon size={18} /><span className="text-[11px] font-bold tracking-tight uppercase">{menu.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="p-6">
                    <button onClick={() => setIsPdaOpen(!isPdaOpen)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 active:scale-95 transition-all shadow-lg border border-slate-700">
                        <Smartphone size={14} /> PDA {isPdaOpen ? '닫기' : '활성화'}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f1f5f9]">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10 shadow-sm text-left">
                    <h2 className="text-lg font-black text-slate-800 tracking-tighter italic uppercase text-left">
                        {activeMenu === 0 ? "Intelligence Dashboard" : activeMenu === 2 ? "Order Management" : "Warehouse & Stock"}
                    </h2>
                    <button onClick={fetchAllStocks} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-200 shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {/* 대시보드 렌더링 시 실시간 데이터 전달 💡 */}
                    {activeMenu === 0 && (
                        <Dash
                            inventoryList={inventoryList}
                            finishedList={finishedList}
                            defectList={defectList}
                            pdaJobs={pdaJobs}
                            loading={loading}
                            onRefresh={fetchAllStocks}
                        />
                    )}

                    {activeMenu === 2 && (
                        <div className="p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl ring-8 ring-blue-50 text-left"><PlusCircle size={32} /></div>
                                    <h3 className="text-3xl font-black text-slate-900 italic uppercase leading-none tracking-tighter text-left">NEW<br />WORK ORDER</h3>
                                </div>
                                <div className="flex items-center gap-4 text-slate-800 text-left">
                                    <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 flex items-center shadow-inner">
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-transparent text-sm font-black outline-none appearance-none cursor-pointer pr-4">
                                            <option value="AVN-01">아반떼 CN7</option>
                                            <option value="G80-01">제네시스 G80</option>
                                            <option value="ION-06">아이오닉 6</option>
                                        </select>
                                        <ChevronDown size={16} className="text-slate-400" />
                                    </div>
                                    <input type="number" value={inputQty} onChange={(e) => setInputQty(parseInt(e.target.value) || 0)} className="bg-slate-50 px-6 py-4 w-32 rounded-3xl border border-slate-100 text-sm font-black text-center focus:ring-4 ring-blue-100 outline-none" />
                                    <button onClick={handleRegisterOrder} className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 shadow-blue-500/30 transition-transform"><Plus size={32} strokeWidth={3} /></button>
                                </div>
                            </div>
                            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 min-h-[400px]">
                                <table className="w-full text-left border-collapse text-slate-800">
                                    <thead className="text-[11px] font-bold text-slate-400 uppercase border-b pb-8"><tr><th className="pb-8 pl-4">지시 ID</th><th className="pb-8">수주 NO</th><th className="pb-8">모델</th><th className="pb-8 text-right pr-4">수량</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50 font-bold">
                                        {pdaJobs.map(job => (
                                            <tr key={job.jobId} className="hover:bg-slate-50/50 transition-colors"><td className="py-8 pl-4 font-mono text-[11px] text-slate-400 uppercase text-left">{job.jobId}</td><td className="py-8 text-blue-600 uppercase italic font-black text-left">{job.soId}</td><td className="py-8 text-slate-700 uppercase tracking-tight font-black text-left">{job.modelId}</td><td className="py-8 text-right pr-4 text-purple-600 text-2xl italic font-black">x{job.batchQty}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeMenu === 5 && (
                        <Stock
                            tab={tab} setTab={setTab}
                            inventoryList={inventoryList} finishedList={finishedList} defectList={defectList}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            loading={loading} fetchAllStocks={fetchAllStocks}
                            handleInboundSubmit={handleInboundSubmit}
                            inboundForm={inboundForm} setInboundForm={setInboundForm}
                        />
                    )}
                </div>
            </main>

            <aside className={`bg-[#111c3a] border-l border-white/5 transition-all duration-500 ease-in-out relative flex flex-col shadow-2xl z-20 ${isPdaOpen ? 'w-[420px]' : 'w-0 overflow-hidden opacity-0'}`}>
                <div className="p-8 h-full flex flex-col overflow-hidden text-white text-left">
                    <header className="flex justify-between items-center mb-8 text-blue-400"><div className="flex items-center gap-3"><Smartphone size={20} /><h4 className="text-[11px] font-black uppercase tracking-widest italic">PDA Terminal</h4></div><button onClick={() => setIsPdaOpen(false)} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button></header>
                    <div className="flex-1 overflow-y-auto space-y-5 scrollbar-hide pr-1">
                        {pdaJobs.map(job => (
                            <div key={job.jobId} className="bg-white/5 border border-white/10 p-7 rounded-[2.5rem] hover:bg-white/10 transition-all group relative overflow-hidden shadow-xl text-left">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
                                <div className="flex justify-between items-start mb-5 relative"><div className="bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black italic text-white shadow-lg uppercase tracking-tighter">수주: {job.soId}</div><span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{job.jobId}</span></div>
                                <div className="text-2xl font-black text-white mb-1 uppercase italic tracking-tight">{job.modelId}</div>
                                <div className="text-4xl font-black italic text-blue-400 mb-8">x{job.batchQty} <span className="text-[10px] not-italic opacity-40 uppercase font-bold tracking-widest">PCS</span></div>
                                <div className="grid grid-cols-2 gap-4 relative">
                                    <button onClick={() => handleCompleteProduction(job.jobId, 'PASS')} className="bg-green-600 py-4 rounded-2xl text-[10px] font-black text-white uppercase active:scale-95 transition-all shadow-lg hover:bg-green-500">생산 완료</button>
                                    <button onClick={() => handleCompleteProduction(job.jobId, 'FAIL')} className="bg-red-600 py-4 rounded-2xl text-[10px] font-black text-white uppercase active:scale-95 transition-all shadow-lg shadow-red-900/20 hover:bg-red-500">불량 등록</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
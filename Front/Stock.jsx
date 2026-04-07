import React, { useState, useEffect } from 'react';
import {
    Package, Search, RefreshCw, Box, ArrowDownCircle,
    Layers, Truck, AlertTriangle, Activity, CheckCircle2, XCircle, Clock, Info, PlusCircle, Tag
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5188/api/mes';

export default function App() {
    const [tab, setTab] = useState('inventory');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [inventoryList, setInventoryList] = useState([]);
    const [finishedList, setFinishedList] = useState([]);
    const [defectList, setDefectList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [inboundForm, setInboundForm] = useState({ partId: '', qty: 1 });

    const showNotice = (text, type = 'success') => {
        setMessage({ text, type });
        const duration = type === 'error' ? 5000 : 3000;
        setTimeout(() => setMessage({ text: '', type: '' }), duration);
    };

    const fetchAllStocks = async () => {
        setLoading(true);
        try {
            const [resInv, resFin, resDef] = await Promise.all([
                fetch(`${API_BASE_URL}/inventory`),
                fetch(`${API_BASE_URL}/finished-list?`),
                fetch(`${API_BASE_URL}/defect-list?`)
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

        } catch (error) {
            console.error("Fetch Error:", error);
            showNotice("서버 연결 실패", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchAllStocks();

    }, [tab]);

    const handleInboundSubmit = async () => {
        if (!inboundForm.partId) return showNotice("부품을 선택하세요!", "error");
        if (inboundForm.qty <= 0) return showNotice("수량을 1개 이상 입력하세요!", "error");

        


        setLoading(true);
        try {


            const res = await fetch(`${API_BASE_URL}/inventory/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    PartId: inboundForm.partId,
                    Qty: Number(inboundForm.qty)
                })
            });




            const result = await res.json();
            if (res.ok) {
                showNotice(`✅ [${inboundForm.partId}] ${inboundForm.qty}개 입고 완료!`);
                setInboundForm(prev => ({ ...prev, qty: 1 }));
                fetchAllStocks();
            } else {



                showNotice(`❌ 실패: ${result.message || '입고 처리 오류'}`, "error");
            }
        } catch (e) {
            showNotice("서버 통신 중 에러 발생", "error");
        } finally {
            setLoading(false);
        }
    };





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
        <div className="flex h-screen bg-[#f1f5f9] font-sans overflow-hidden text-slate-900">
            {message.text && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-6 rounded-[2.5rem] shadow-2xl animate-bounce font-black text-sm uppercase tracking-widest border-4 ${message.type === 'error' ? 'bg-red-600 text-white border-red-300' : 'bg-slate-900 text-white border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                        {message.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                        {message.text}
                    </div>
                </div>
            )}

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
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-blue-100 mb-8 flex items-center justify-between animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ArrowDownCircle size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Inbound Registry</h3>
                                <p className="text-[10px] text-blue-500 font-bold tracking-widest mt-1 italic uppercase">부품 재고 보충</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
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
                        <table className="w-full text-left border-collapse">
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
                                                <td className="px-10 py-7 border-r border-slate-100/30">
                                                    <span className="text-blue-600 font-mono text-xl uppercase tracking-tighter">{displayId}</span>
                                                    {tab !== 'inventory' && <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 text-xs">Job: {jobId}</div>}
                                                </td>

                                                {/* 💡 모델 / 정보 컬럼 (불량격리소도 크게 수정됨) */}
                                                <td className="px-10 py-7 border-r border-slate-100/30">
                                                    {tab === 'inventory' ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <Truck size={14} className="text-slate-400" />
                                                                <span className="text-slate-800 font-black uppercase text-2xl italic tracking-tighter leading-none">{models || 'All Models'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span className="bg-blue-50 text-blue-500 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-blue-100">{category || 'General'}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* 완성차(FINISHED)와 불량(DEFECT) 둘 다 모델명을 크게 표시 */
                                                        <div className="flex flex-col">
                                                            <span className={`font-black uppercase text-3xl italic tracking-tighter leading-none ${tab === 'DEFECT' ? 'text-red-600' : 'text-slate-800'}`}>
                                                                {modelId}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {tab === 'FINISHED' ? (
                                                                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                                                        <CheckCircle2 size={10} /> Completed
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-red-600 font-black uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                                                                        <AlertTriangle size={10} /> {reason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-10 py-7 text-center border-r border-slate-100/30">
                                                    <span className={`text-4xl font-black italic tracking-tighter ${(tab === 'inventory' ? stockQty : (item.Qty || item.qty || 0)) < 10 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                                                        x{tab === 'inventory' ? stockQty : (item.Qty || item.qty || 0)}
                                                    </span>
                                                </td>

                                                <td className="px-10 py-7 text-center">
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
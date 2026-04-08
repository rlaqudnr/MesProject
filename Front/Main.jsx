import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
    LayoutDashboard, Database, ShoppingCart, Smartphone, Activity, Zap, Plus, Package,
    CheckCircle2, XCircle, X, Search, ChevronDown, RefreshCw, Warehouse, AlertTriangle,
    Truck, FileSpreadsheet, Box, Filter, Clock, ArrowDownCircle, Layers, Info, PlusCircle, Tag,
    TrendingUp, BarChart3, PieChart, ArrowUpRight, ShieldCheck, MessageSquare, Megaphone,
    AlertOctagon, Send, Trash2, ArrowLeft, User, MessageCircle, LogIn, UserPlus, LogOut, Lock, UserMinus,
    Calendar, Hash, Minus,ChevronLeft, ChevronRight
} from 'lucide-react';

// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const API_BASE_URL = 'http://localhost:5188/api/mes';

// --- 🔥 Firebase 설정 (로컬 에러 방지용 가드 로직 ) ---
const firebaseConfig = {
    apiKey: "AIzaSyBVcUFFV19sHxxHrRWEPWcnp-clCWtNpZU",
    authDomain: "wook-6919c.firebaseapp.com",
    projectId: "wook-6919c",
    storageBucket: "wook-6919c.firebasestorage.app",
    messagingSenderId: "17560345576",
    appId: "1:17560345576:web:f3b285172861c4fe87225d",
    measurementId: "G-SRPEPVLNW1"
};



const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const appId = 'nex-mes-master-wook';

// --- 📊 Dashboard Helper Components ---

function StatCard({ label, value, unit, icon: Icon, color, trend }) {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        red: "text-red-600 bg-red-50 border-red-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100"
    };

    return (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition-transform text-left text-slate-800">
            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform ${color === 'blue' ? 'text-blue-600' : 'text-slate-400'}`}>
                <Icon size={120} />
            </div>
            <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${colorMap[color]}`}>{trend}</span>
            </div>
            <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">
                {value}<span className="text-sm not-italic ml-1 opacity-20 uppercase font-bold">{unit}</span>
            </h4>
        </div>
    );
}

// --- 📢 1. Issue Component ---

const Issue = ({ onShowNotice, currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [newPost, setNewPost] = useState({ Type: 'ISSUE', Title: '', Content: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/board?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error("게시판 로드 실패", e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleCreate = async () => {
        if (!newPost.Title || !newPost.Content) return onShowNotice("제목과 내용을 입력하쇼 ㅋ", "error");

        // 💡 [해결 1] currentUser에서 ID와 이름을 더 꼼꼼하게 
        const myId = currentUser?.UserId || currentUser?.userId;
        const myName = currentUser?.UserName || currentUser?.userName;

        if (!myId) return onShowNotice("로그인 정보가 없습니다! 다시 로그인 하쇼 ㅋ", "error");

        const payload = {
            Type: newPost.Type,
            Title: newPost.Title,
            Content: newPost.Content,
            UserId: myId,
            UserName: myName || myId // 이름 없으면 ID라도 보냄 
        };

        console.log("🚀 [글쓰기 시도] 보낼 데이터:", payload);

        try {
            const res = await fetch(`${API_BASE_URL}/board`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                setNewPost({ Type: 'ISSUE', Title: '', Content: '' });
                fetchPosts();
                onShowNotice("✅ 포스팅 완료! 슈웃!");
            } else {
                // 💡 400 에러 시 서버가 뱉는 구체적인 이유를 확인 
                const responseText = await res.text();
                let errMsg = "데이터 형식 오류 ㅋ";
                try {
                    const errData = JSON.parse(responseText);
                    errMsg = errData.message || responseText;
                } catch (e) { errMsg = responseText; }

                onShowNotice(`❌ 등록 실패: ${errMsg}`, "error");
            }
        } catch (e) {
            console.error("글 등록 오류", e);
            onShowNotice("서버 통신 실패 ", "error");
        }
    };

    const handleDeletePost = async (e, postNo, postUserId) => {
        e.stopPropagation();
        const curUid = currentUser?.userId || currentUser?.UserId;
        if (curUid !== postUserId && currentUser?.Role !== 'ADMIN') {
            onShowNotice("본인 글만 삭제 가능합니다!", "error");
            return;
        }

        if (!window.confirm("정말로 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/${postNo}?UserId=${curUid}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSelectedPost(null);
                fetchPosts();
                onShowNotice("🗑️ 게시글이 삭제되었습니다.");
            } else {
                onShowNotice("❌ 삭제 실패 ", "error");
            }
        } catch (e) { console.error(e); }
    };

    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            const pTitle = (p.Title || p.title || "").toLowerCase();
            const pType = (p.Type || p.type || "");
            const matchesFilter = filter === 'ALL' || pType === filter;
            return matchesFilter && pTitle.includes(searchTerm.toLowerCase());
        });
    }, [posts, filter, searchTerm]);

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 text-left relative">
            {selectedPost && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setSelectedPost(null)} />
                    <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-12 overflow-y-auto max-h-[80vh] scrollbar-hide text-left text-slate-800 font-bold">
                            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6 inline-block">{(selectedPost.Type || selectedPost.type)}</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic mb-8">{(selectedPost.Title || selectedPost.title)}</h2>
                            <div className="flex items-center gap-6 text-slate-400 font-bold text-[11px] uppercase border-b border-slate-50 pb-8 mb-8">
                                <div className="flex items-center gap-2"><User size={14} /> {(selectedPost.UserName || selectedPost.userName || selectedPost.userId)}</div>
                                <div className="flex items-center gap-2"><Clock size={14} /> {new Date(selectedPost.RegDate || selectedPost.regDate).toLocaleString()}</div>
                            </div>
                            <div className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap font-medium italic">
                                {(selectedPost.Content || selectedPost.content)}
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex justify-end gap-4">
                            {(currentUser?.userId || currentUser?.UserId) === (selectedPost.UserId || selectedPost.userId) && (
                                <button onClick={(e) => handleDeletePost(e, selectedPost.PostNo || selectedPost.postNo, selectedPost.UserId || selectedPost.userId)} className="px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all">Delete Post</button>
                            )}
                            <button onClick={() => setSelectedPost(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px]">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-end justify-between">
                <div className="text-left text-slate-900 font-black italic uppercase">
                    <h2 className="text-5xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">Communication<br />Center</h2>
                    <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] mt-4 uppercase">Field Operations Intelligence</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative text-slate-300">
                        <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search Title..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="bg-white border border-slate-100 py-5 pl-16 pr-8 rounded-[2.5rem] text-sm font-bold outline-none w-80 shadow-sm focus:ring-4 ring-blue-50 transition-all text-slate-800" />
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] text-xs font-black uppercase shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 text-white"><Plus size={20} strokeWidth={3} /> Write Post</button>
                </div>
            </div>

            <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 w-fit gap-2">
                {['ALL', 'NOTICE', 'ISSUE', 'SOP'].map(t => (
                    <button key={t} onClick={() => { setFilter(t); setCurrentPage(1); }} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${filter === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                ))}
            </div>

            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-50 overflow-hidden min-h-[500px] flex flex-col text-slate-800 font-bold">
                <div className="divide-y divide-slate-50 flex-1">
                    {currentPosts.map((post, index) => (
                        <div key={post.PostNo || post.postNo || `post-${index}`} onClick={() => setSelectedPost(post)} className="p-10 flex items-center justify-between hover:bg-slate-50/80 transition-all group cursor-pointer text-left">
                            <div className="flex items-center gap-10">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${(post.Type || post.type) === 'NOTICE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {(post.Type || post.type) === 'NOTICE' ? <Megaphone size={28} /> : <AlertOctagon size={28} />}
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-3 mb-2 font-black text-blue-500 uppercase tracking-widest text-[10px]">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{post.Type || post.type}</span>
                                        {/* 💡 [해결 2] 작성자 이름이 안 나오던 현상 수정: 여러 키값을 체크  */}
                                        <span className="text-slate-800 font-black"> {post.UserName || post.userName || post.UserId || post.userId || 'Guest'}</span>      
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight italic">{(post.Title || post.title)}</h3>
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-1 max-w-xl font-bold opacity-60">{(post.Content || post.content)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right text-slate-300 font-mono text-[11px] font-bold uppercase">
                                    <span>{new Date(post.RegDate || post.regDate).toLocaleDateString()}</span><br />
                                    <span className="opacity-40">{new Date(post.RegDate || post.regDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {(currentUser?.userId || currentUser?.UserId) === (post.UserId || post.userId) && (
                                    <button onClick={(e) => handleDeletePost(e, post.PostNo || post.postNo, post.UserId || post.userId)} className="p-4 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={22} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                    {currentPosts.length === 0 && !loading && (
                        <div className="py-40 text-center opacity-10 flex flex-col items-center"><MessageSquare size={80} className="mb-4" /><p className="font-black uppercase tracking-[0.5em] text-sm">Empty Communication</p></div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="h-24 border-t border-slate-50 flex items-center justify-center gap-4 bg-slate-50/30">
                        <button onClick={() => paginate(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-3 rounded-full hover:bg-white transition-all disabled:opacity-20 text-slate-900"><ChevronLeft size={20} /></button>
                        <div className="flex gap-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={`page-${i}`} onClick={() => paginate(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-lg scale-110' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}>{i + 1}</button>
                            ))}
                        </div>
                        <button onClick={() => paginate(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-3 rounded-full hover:bg-white transition-all disabled:opacity-20 text-slate-900"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl relative animate-in zoom-in-95 duration-300 text-left text-slate-800 font-bold">
                        <h3 className="text-3xl font-black italic text-slate-900 uppercase mb-10 leading-none">Create<br />Intelligence</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                {['NOTICE', 'ISSUE', 'SOP'].map(t => (
                                    <button key={`type-${t}`} onClick={() => setNewPost({ ...newPost, Type: t })} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${newPost.Type === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{t}</button>
                                ))}
                            </div>
                            <input type="text" placeholder="Title of Report" value={newPost.Title} onChange={e => setNewPost({ ...newPost, Title: e.target.value })} className="w-full bg-slate-50 border-none p-6 rounded-3xl font-bold text-sm outline-none focus:ring-4 ring-blue-50 text-slate-800" />
                            <textarea placeholder="Detail Description..." value={newPost.Content} onChange={e => setNewPost({ ...newPost, Content: e.target.value })} className="w-full bg-slate-50 border-none p-6 rounded-3xl font-bold text-sm outline-none h-48 resize-none focus:ring-4 ring-blue-50 text-slate-800" />
                            <button onClick={handleCreate} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-xs shadow-2xl active:scale-95 hover:bg-blue-600 transition-all text-white">Broadcast Posting</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// --- 📊 2. Dash Component ---

const Dash = ({ inventoryList = [], finishedList = [], defectList = [], loading, onRefresh }) => {
    const stats = useMemo(() => {
        const totalProduced = finishedList.reduce((acc, cur) => acc + (cur.Qty || cur.qty || cur.StockQty || 0), 0);
        const totalDefects = defectList.reduce((acc, cur) => acc + (cur.Qty || cur.qty || 0), 0);
        const totalInbound = inventoryList.reduce((acc, cur) => acc + (cur.StockQty || cur.stockQty || 0), 0);
        const yieldRate = (totalProduced + totalDefects) > 0 ? ((totalProduced / (totalProduced + totalDefects)) * 100).toFixed(1) : "100.0";
        return { totalProduced, totalDefects, totalInbound, yieldRate };
    }, [inventoryList, finishedList, defectList]);

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 text-left">
            <div className="flex items-center justify-between text-slate-900 font-black tracking-tighter uppercase italic leading-none font-black text-slate-900 font-black">
                <div className="text-left text-slate-900">
                    <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase leading-none font-black">Intelligence Center</h2>
                    <div className="text-[10px] text-slate-400 font-bold tracking-[0.3em] mt-2 flex items-center gap-2 uppercase font-bold">
                        <Activity size={12} className="text-blue-500 animate-pulse" /> REALTIME FACTORY ANALYTICS
                    </div>
                </div>
                <button onClick={onRefresh} className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:rotate-180 duration-500 font-bold uppercase italic leading-none">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-slate-800 font-black italic leading-none">
                <StatCard label="완성차 재고" value={stats.totalProduced} unit="Units" icon={Truck} color="blue" trend="+12%" />
                <StatCard label="불량 격리수" value={stats.totalDefects} unit="Cases" icon={XCircle} color="red" trend="Alert" />
                <StatCard label="부품 총 재고" value={stats.totalInbound} unit="Parts" icon={Package} color="amber" trend="Optimal" />
                <StatCard label="공정 수율" value={stats.yieldRate} unit="%" icon={ShieldCheck} color="emerald" trend="Safe" />
            </div>
        </div>
    );
};

// --- 📦 3. Stock Component (차종/모델 강조 UI) ---

const Stock = ({ tab, setTab, inventoryList = [], finishedList = [], defectList = [], searchTerm, setSearchTerm, loading, fetchAllStocks, onShowNotice }) => {
    const [inboundForm, setInboundForm] = useState({ partId: '', qty: 1 });

    const availableParts = useMemo(() => {
        const uniqueIds = Array.from(new Set((inventoryList || []).map(item => item.PartId || item.partId))).filter(Boolean);
        return uniqueIds.map(id => ({ PartId: id, PartName: id }));
    }, [inventoryList]);

    useEffect(() => { if (availableParts.length > 0 && !inboundForm.partId) setInboundForm(prev => ({ ...prev, partId: availableParts[0].PartId })); }, [availableParts]);

    const config = useMemo(() => {
        switch (tab) {
            case 'FINISHED':
                return {
                    list: finishedList,
                    idLabel: 'PRODUCT IDENTITY',
                    subLabel: 'TRACKING NO',
                    idKey: (item) => item.ModelId || item.modelId || 'N/A',
                    subKey: (item) => item.LotId || item.lotId || 'N/A',
                    color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Truck,
                    showDate: true
                };
            case 'DEFECT':
                return {
                    list: defectList,
                    idLabel: 'FAILURE IDENTITY',
                    subLabel: 'TRACKING NO',
                    idKey: (item) => item.ModelId || item.modelId || '불량차종',
                    subKey: (item) => item.DefectId || item.defectId || 'N/A',
                    color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertOctagon,
                    showDate: true
                };
            default: // inventory (💡 부품 재고 슬림화 )
                return {
                    list: inventoryList,
                    idLabel: 'COMPONENT ID',
                    subLabel: 'BOM REQUIREMENTS',
                    idKey: (item) => item.PartId || item.partId,
                    subKey: (item) => item.Models || item.models || '연결정보없음',
                    color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: Package,
                    showDate: false
                };
        }
    }, [tab, inventoryList, finishedList, defectList]);

    const filteredList = (config.list || []).filter(item => {
        const s = searchTerm.toLowerCase();
        return String(config.idKey(item)).toLowerCase().includes(s) || String(config.subKey(item)).toLowerCase().includes(s);
    });

    const handleInboundSubmit = async () => {
        if (!inboundForm.partId) return onShowNotice("부품을 선택하세요!", "error");
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/receive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ PartId: inboundForm.partId, Qty: Number(inboundForm.qty) }) });
            if (res.ok) { onShowNotice("✅ 입고 완료!"); fetchAllStocks(); }
        } catch (e) { onShowNotice("통신 에러", "error"); }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in pb-10 text-left">
            <div className="flex-1 flex flex-col p-8 overflow-hidden text-slate-800">
                {/* 📍 상단 메뉴 및 검색 필터 */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 gap-1">
                        {[{ id: 'inventory', label: 'BOM Inventory', icon: Package }, { id: 'FINISHED', label: 'Finished Stock', icon: Truck }, { id: 'DEFECT', label: 'Defect Logs', icon: AlertOctagon }].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${tab === t.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><t.icon size={12} /> {t.label}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-100 py-3 pl-10 pr-6 rounded-2xl text-[11px] font-semibold outline-none w-64 shadow-sm focus:ring-2 ring-blue-500/10 transition-all" />
                    </div>
                </div>

                {/* 📍 인벤토리 퀵 입고 폼 (더 콤팩트하게 수정 ) */}
                {tab === 'inventory' && (
                    <div className="mb-8 bg-[#1e293b] rounded-[2rem] p-6 flex items-center justify-between shadow-xl text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Plus size={20} /></div>
                            <div>
                                <h4 className="text-sm font-black italic uppercase tracking-tighter">Direct Inbound</h4>
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Entry system</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select value={inboundForm.partId} onChange={(e) => setInboundForm({ ...inboundForm, partId: e.target.value })} className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/40 transition-all min-w-[200px] cursor-pointer"> {availableParts.map(p => (<option key={p.PartId} value={p.PartId} className="text-slate-900">{p.PartName}</option>))} </select>
                            <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                                <button onClick={() => setInboundForm({ ...inboundForm, qty: Math.max(1, inboundForm.qty - 1) })} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"><Minus size={14} /></button>
                                <input type="number" value={inboundForm.qty} readOnly className="w-10 bg-transparent text-white text-center font-black text-sm outline-none" />
                                <button onClick={() => setInboundForm({ ...inboundForm, qty: inboundForm.qty + 1 })} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"><Plus size={14} /></button>
                            </div>
                            <button onClick={handleInboundSubmit} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Stock In</button>
                        </div>
                    </div>
                )}

                {/* 📍 메인 리스트 테이블 (글자 크기 조절 및 시간 가독성 ) */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 sticky top-0 border-b border-slate-100 z-10 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            <tr><th className="px-8 py-6 w-20 text-center">No.</th><th className="px-8 py-6 text-left">Management Entity</th><th className="px-8 py-6 text-center">Status</th>{config.showDate && <th className="px-8 py-6 text-center">Record Time</th>}<th className="px-8 py-6 w-20"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-800">
                            {filteredList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-all group">
                                    <td className="px-8 py-6 text-[11px] text-slate-300 font-mono text-center italic">{idx + 1}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6 text-left leading-tight">
                                            <div className={`w-12 h-12 rounded-[1.2rem] ${config.bgColor} ${config.color} flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-105`}><config.icon size={22} /></div>
                                            <div className="flex flex-col text-left">
                                                <span className={`text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-0.5`}>{(item.PartId || item.partId || item.LotId || item.lotId || item.DefectId || item.defectId)}</span>
                                               
                                                <span className={`text-2xl font-black italic tracking-tighter ${config.color} uppercase`}>
                                                    {tab === 'inventory' ? (item.Models || item.models || 'N/A') : (item.ModelId || item.modelId)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black italic tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">x{item.StockQty ?? item.Qty ?? item.stockQty ?? item.qty ?? 0}</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Qty</span>
                                        </div>
                                    </td>
                                    {config.showDate && (
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex flex-col items-center bg-slate-50/50 py-2 px-4 rounded-xl border border-slate-100">
                                                <span className="text-slate-800 font-bold text-xs">{new Date(item.RegDate || item.regDate || item.InDate || item.inDate).toLocaleDateString()}</span>
                                              
                                                <span className="text-[13px] text-blue-600 font-black tracking-tight mt-0.5 font-mono">
                                                    {new Date(item.RegDate || item.regDate || item.InDate || item.inDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-8 py-6 text-center"><button className="w-10 h-10 rounded-full border border-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowUpRight size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- 💎 4. Main App Component ---

export default function App() {
    const [activeMenu, setActiveMenu] = useState(0);
    const [isPdaOpen, setIsPdaOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [currentUser, setCurrentUser] = useState(null);
    const [isSignup, setIsSignup] = useState(false);
    const [authForm, setAuthForm] = useState({ userId: '', password: '', userName: '' });

    const [inventoryList, setInventoryList] = useState([]);
    const [finishedList, setFinishedList] = useState([]);
    const [defectList, setDefectList] = useState([]);
    const [pdaJobs, setPdaJobs] = useState([]);

    const [tab, setTab] = useState('inventory');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputQty, setInputQty] = useState(20);
    const [selectedModel, setSelectedModel] = useState('AVN-01');

    const showNotice = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);



    };

    // 💡 세션 복구 로직 (새로고침 방지 핵심)
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else { await signInAnonymously(auth); }
            } catch (err) { console.error("Firebase Auth Init Error:", err); }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                try {
                    // Firestore에서 세션 정보(프로필) 가져오기 (Rule 1 준수)
                    const sessionRef = doc(db, 'artifacts', appId, 'users', fbUser.uid, 'session', 'profile');
                    const sessionDoc = await getDoc(sessionRef);
                    if (sessionDoc.exists()) {
                        setCurrentUser(sessionDoc.data());
                    }
                } catch (err) { console.error("Session Fetch Error:", err); }
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchAllStocks = useCallback(async () => {
        setLoading(true);
        try {
            const [resInv, resFin, resDef, resPda] = await Promise.all([
                fetch(`${API_BASE_URL}/inventory`),
                fetch(`${API_BASE_URL}/finished-list`),
                fetch(`${API_BASE_URL}/defect-list`),
                fetch(`${API_BASE_URL}/pda-list`)
            ]);
            if (resInv.ok) setInventoryList(await resInv.json());
            if (resFin.ok) setFinishedList(await resFin.json());
            if (resDef.ok) setDefectList(await resDef.json());
            if (resPda.ok) setPdaJobs(await resPda.json());
        } catch (error) { console.error("Fetch Error:", error); } finally { setLoading(false); }
    }, []);


    
    useEffect(() => { if (currentUser) fetchAllStocks(); }, [currentUser, fetchAllStocks]);

    const handleAuthAction = async () => {



        const endpoint = isSignup ? 'signup' : 'login';
        try {




            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    UserId: authForm.userId,
                    Password: authForm.password,
                    UserName: isSignup ? authForm.userName : ""



                })
            });
            const data = await res.json();
            if (res.ok) {       

                if (isSignup) {
                    showNotice("✅ 회원가입 성공! 로그인 하세요.");
                    setIsSignup(false);  
                } else {
                    // 💡 로그인 성공 시 Firestore에 세션 저장 (새로고침 대비)
                    if (auth.currentUser) {
                        const sessionRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'session', 'profile');
                        await setDoc(sessionRef, data);
                    }
                    setCurrentUser(data);
                    showNotice(`👋 ${(data.userName || data.UserName)}님 환영합니다!`);
                }
                setAuthForm({ userId: '', password: '', userName: '' });
            } else {
                showNotice(`❌ ${data.message || '인증 실패'}`, "error");
            }
        } catch (e) { showNotice("서버 통신 실패", "error"); }
    };

    const handleLogout = async () => {
        if (auth.currentUser) {
            try {
                const sessionRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'session', 'profile');
                await deleteDoc(sessionRef);
            } catch (err) { console.error(err); }
        }
        await signOut(auth);
        setCurrentUser(null);
    };

    const handleWithdraw = async () => {
        if (!window.confirm("정말로 탈퇴하시겠습니까? 계정과 모든 작성 글이 영구 삭제됩니다!")) return;

        const password = window.prompt("비밀번호를 입력해주세요.");


        try {
            const res = await fetch(`${API_BASE_URL}/UserDelete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    UserId: currentUser.UserId || currentUser.userId,
                    Password: password
                })
            });
            if (res.ok) {

                handleLogout();
                showNotice("🗑️ 회원 탈퇴 및 데이터 삭제 완료.");
            }
        } catch (e) { showNotice("탈퇴 처리 실패", "error"); }
    };

    const handleRegisterOrder = async () => {
        const payload = { OrderId: `SO-${Date.now().toString().slice(-6)}`, Customer: '기아 자동차', ModelId: selectedModel, Qty: Number(inputQty) };
        try {
            const res = await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { showNotice(`✅ 수주 완료!`); fetchAllStocks(); }
        } catch (e) { showNotice("통신 오류", "error"); }
    };

    const handleCompleteProduction = async (jobId, result) => {
        try {
            const res = await fetch(`${API_BASE_URL}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ JobId: jobId, Result: result }) });
            if (res.ok) { showNotice("✅ 작업 완료!"); await fetchAllStocks(); }
            else { showNotice(`❌ 재고 부족`, "error"); }
        } catch (e) { showNotice("에러 발생", "error"); }
    };

    if (!currentUser) {
        return (
            <div className="flex h-screen bg-[#0a1128] items-center justify-center p-6 selection:bg-blue-500 font-sans text-left">
                {message.text && (
                    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] px-10 py-6 rounded-[2.5rem] shadow-2xl animate-bounce font-black text-sm uppercase border-4 ${message.type === 'error' ? 'bg-red-600 text-white border-red-300' : 'bg-slate-900 text-white border-slate-700'}`}>
                        {message.text}
                    </div>
                )}
                <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-[0_0_100px_rgba(37,99,235,0.2)] p-16 relative overflow-hidden animate-in zoom-in-95 duration-500 text-left text-slate-800">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full text-left" />
                    <div className="flex flex-col items-center mb-12 text-left">
                        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-6 ring-8 ring-blue-50 text-left font-black"><Zap size={32} fill="currentColor" /></div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase text-center leading-none text-left text-slate-900 font-black">NexMES<br /><span className="text-blue-600 text-left font-black">Access Gate</span></h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-4 text-center text-slate-400 font-bold uppercase">Smart Factory Solutions PRO</p>
                    </div>
                    <div className="space-y-4 text-left">
                        {isSignup && (
                            <div className="relative text-left">
                                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-left text-slate-300 font-black" />
                                <input type="text" placeholder="성함 (Name)" value={authForm.userName} onChange={e => setAuthForm({ ...authForm, userName: e.target.value })} className="w-full bg-slate-50 border border-slate-100 py-5 pl-14 pr-8 rounded-3xl font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all text-slate-800 text-left text-slate-800 font-black font-black uppercase" />
                            </div>
                        )}
                        <div className="relative text-left">
                            <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-left text-slate-300 font-black" />
                            <input type="text" placeholder="아이디 (ID)" value={authForm.userId} onChange={e => setAuthForm({ ...authForm, userId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 py-5 pl-14 pr-8 rounded-3xl font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all text-slate-800 text-left text-slate-800 font-black font-black uppercase" />
                        </div>
                        <div className="relative text-left text-slate-300">
                            <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-left text-slate-300 font-black" />
                            <input type="password" placeholder="비밀번호 (Password)" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full bg-slate-50 border border-slate-100 py-5 pl-14 pr-8 rounded-3xl font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all text-slate-800 text-left text-slate-800 font-black font-black uppercase" />
                        </div>
                        <button onClick={handleAuthAction} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs shadow-xl active:scale-95 hover:bg-blue-600 transition-all mt-6 flex items-center justify-center gap-3 text-center text-white font-black font-black uppercase">
                            {isSignup ? <UserPlus size={18} /> : <LogIn size={18} />}
                            {isSignup ? "Create Operator Account" : "Access System"}
                        </button>
                    </div>
                    <div className="mt-10 pt-10 border-t border-slate-50 flex justify-center text-left">
                        <button onClick={() => setIsSignup(!isSignup)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors text-center text-slate-400 font-bold uppercase">
                            {isSignup ? "Already Registered? Login" : "New Operator? Join System"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden select-none text-slate-900 text-left text-left text-left text-left text-left">
            {message.text && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] px-10 py-6 rounded-[2.5rem] shadow-2xl animate-bounce font-black text-sm uppercase border-4 ${message.type === 'error' ? 'bg-red-600 text-white border-red-300' : 'bg-slate-900 text-white border-slate-700'}`}>
                    <div className="flex items-center gap-4 text-left text-white">{message.type === 'error' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}{message.text}</div>
                </div>
            )}

            <aside className="w-64 bg-[#0a1128] flex flex-col shadow-2xl z-30 shrink-0 text-white text-left text-white text-left text-left">
                <div className="p-8 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-blue-600/20 text-left text-left text-left text-left text-white font-black"><Zap size={22} fill="currentColor" /></div>
                    <div className="font-black text-xl text-white tracking-tighter uppercase text-left text-white font-black text-white">NexMES <span className="text-blue-500 font-black text-blue-500 font-black">PRO</span></div>
                </div>

                <nav className="flex-1 mt-4 text-left text-white">
                    {[
                        { id: 0, label: "대시보드", icon: LayoutDashboard },
                        { id: 3, label: "이슈/건의", icon: MessageSquare },
                        { id: 2, label: "수주관리", icon: ShoppingCart },
                        { id: 5, label: "창고관리", icon: Warehouse },
                    ].map((menu) => (
                        <div key={menu.id} onClick={() => setActiveMenu(menu.id)} className={`flex items-center gap-4 px-8 py-4 cursor-pointer transition-all ${activeMenu === menu.id ? 'bg-blue-600 text-white shadow-xl translate-x-2 rounded-l-full' : 'text-slate-400 hover:text-slate-200'}`}>
                            <menu.icon size={18} /><span className="text-[11px] font-bold tracking-tight uppercase font-black text-left">{menu.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/5 bg-[#0d1633] text-left text-white font-black text-white font-black">
                    <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 text-left text-white font-black text-white font-black">
                        <div className="flex items-center gap-3 mb-4 text-left">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-white uppercase text-left text-white font-black text-white font-black">{(currentUser.UserName || currentUser.userName || 'U')[0]}</div>
                            <div className="text-left text-white overflow-hidden text-left text-white font-black text-white font-black">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-left text-slate-500 font-bold uppercase">Operator</p>
                                <p className="text-xs font-black italic text-white truncate w-24 text-left text-white font-black italic">{(currentUser.UserName || currentUser.userName)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 text-left">
                            <button onClick={handleLogout} className="flex-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 py-3 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all border border-white/5 font-black text-white font-black uppercase"><LogOut size={12} /> Logout</button>
                            <button onClick={handleWithdraw} className="p-3 bg-white/5 hover:bg-red-600 hover:text-white rounded-2xl text-red-500 transition-all border border-white/5 text-left text-red-500 font-black"><UserMinus size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="p-6 text-left">
                    <button onClick={() => setIsPdaOpen(!isPdaOpen)} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 active:scale-95 transition-all shadow-lg border border-slate-700 text-left text-slate-300 font-black font-black uppercase"><Smartphone size={14} /> PDA {isPdaOpen ? '닫기' : '활성화'}</button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f1f5f9] text-left text-slate-800 font-black italic uppercase leading-none">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 z-10 shadow-sm shrink-0 text-left text-slate-800 font-black italic uppercase leading-none">
                    <h2 className="text-lg font-black text-slate-800 tracking-tighter italic uppercase text-left text-slate-800 font-black italic uppercase leading-none">{activeMenu === 5 ? "Warehouse Management" : "Intelligence Center"}</h2>
                </header>

                <div className="flex-1 overflow-y-auto text-slate-800 font-black text-left">
                    {activeMenu === 0 && <Dash inventoryList={inventoryList} finishedList={finishedList} defectList={defectList} loading={loading} onRefresh={fetchAllStocks} />}
                    {activeMenu === 3 && <Issue onShowNotice={showNotice} currentUser={currentUser} />}
                    {activeMenu === 5 && <Stock tab={tab} setTab={setTab} inventoryList={inventoryList} finishedList={finishedList} defectList={defectList} searchTerm={searchTerm} setSearchTerm={setSearchTerm} loading={loading} fetchAllStocks={fetchAllStocks} onShowNotice={showNotice} />}
                    {activeMenu === 2 && (
                        <div className="p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in">
                            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl ring-8 ring-blue-50 font-black italic font-black text-white font-black font-black text-white font-black"><PlusCircle size={32} /></div>
                                    <h3 className="text-3xl font-black text-slate-900 italic uppercase leading-none tracking-tighter text-left text-slate-900 font-black font-black text-slate-900 font-black font-black text-slate-900 font-black">NEW<br />WORK ORDER</h3>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex-1 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 flex items-center shadow-inner">
                                        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-transparent text-sm font-black outline-none appearance-none cursor-pointer pr-4 w-full"><option value="AVN-01">아반떼 CN7</option><option value="G80-01">제네시스 G80</option><option value="ION-06">아이오닉 6</option></select>
                                        <ChevronDown size={16} className="text-slate-400" />
                                    </div>
                                    <input type="number" value={inputQty} onChange={(e) => setInputQty(parseInt(e.target.value) || 0)} className="bg-slate-50 px-6 py-4 w-32 rounded-3xl border border-slate-100 text-sm font-black text-center outline-none" />
                                    <button onClick={handleRegisterOrder} className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><Plus size={32} strokeWidth={3} /></button>
                                </div>
                            </div>
                            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead className="text-[11px] font-bold text-slate-400 uppercase border-b pb-8"><tr><th className="pb-8 pl-4">지시 ID</th><th className="pb-8">수주 NO</th><th className="pb-8">모델</th><th className="pb-8 text-right pr-4">수량</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50 font-bold">
                                        {pdaJobs.map(job => (<tr key={job.jobId || job.JobID} className="hover:bg-slate-50/50 transition-colors"><td className="py-8 pl-4 font-mono text-[11px] text-slate-400 uppercase">{job.jobId || job.JobID}</td><td className="py-8 text-blue-600 uppercase italic font-black">{job.soId || job.SoId}</td><td className="py-8 text-slate-700 uppercase tracking-tight font-black">{job.modelId || job.ModelId}</td><td className="py-8 text-right pr-4 text-purple-600 text-2xl italic font-black">x{job.batchQty || job.BatchQty}</td></tr>))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <aside className={`bg-[#111c3a] border-l border-white/5 transition-all duration-500 ease-in-out relative flex flex-col shadow-2xl z-20 ${isPdaOpen ? 'w-[420px]' : 'w-0 overflow-hidden opacity-0'}`}>
                <div className="p-8 h-full flex flex-col overflow-hidden text-white font-black italic uppercase leading-none">
                    <header className="flex justify-between items-center mb-8 text-blue-400"><div className="flex items-center gap-3"><Smartphone size={20} /><h4 className="text-[11px] font-black uppercase tracking-widest italic">PDA Terminal</h4></div><button onClick={() => setIsPdaOpen(false)} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button></header>
                    <div className="flex-1 overflow-y-auto space-y-5 scrollbar-hide pr-1">
                        {pdaJobs.map(job => (
                            <div key={job.jobId || job.JobID} className="bg-white/5 border border-white/10 p-7 rounded-[2.5rem] hover:bg-white/10 transition-all group relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
                                <div className="flex justify-between items-start mb-5 relative"><div className="bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black italic text-white shadow-lg uppercase tracking-tighter">수주: {job.soId || job.SoId}</div><span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{job.jobId || job.JobID}</span></div>
                                <div className="text-2xl font-black text-white mb-1 uppercase italic tracking-tight">{job.modelId || job.ModelId}</div>
                                <div className="text-4xl font-black italic text-blue-400 mb-8">x{job.batchQty || job.BatchQty} <span className="text-[10px] not-italic opacity-40 uppercase font-bold tracking-widest">PCS</span></div>
                                <div className="grid grid-cols-2 gap-4 relative">
                                    <button onClick={() => handleCompleteProduction(job.jobId || job.JobID, 'PASS')} className="bg-green-600 py-4 rounded-2xl text-[10px] font-black text-white uppercase active:scale-95 transition-all shadow-lg hover:bg-green-500 font-black text-white font-black uppercase">생산 완료</button>
                                    <button onClick={() => handleCompleteProduction(job.jobId || job.JobID, 'FAIL')} className="bg-red-600 py-4 rounded-2xl text-[10px] font-black text-white uppercase active:scale-95 transition-all shadow-lg shadow-red-900/20 hover:bg-red-50 font-black text-white font-black uppercase">불량 등록</button>
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
import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Megaphone, AlertOctagon, MessageSquare,
    Clock, User, ArrowUpRight, X, Send, Filter, CheckCircle2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5188/api/mes';

/**
 * [🚨 Issue Component] 
 * 대시보드와 동일한 럭셔리 UI를 가진 게시판/이슈 공유 화면
 */
export default function Issue() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // 작성 폼 상태
    const [newPost, setNewPost] = useState({
        type: 'NOTICE',
        title: '',
        content: '',
        author: '관리자'
    });

    // 1. 데이터 로드 (SELECT)
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/board`);
            if (res.ok) {

                
                const data = await res.json();
                setPosts(data);
            }
        } catch (e) {
            console.error("게시판 데이터 로드 실패");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // 2. 데이터 등록 (POST)
    const handleCreate = async () => {
        if (!newPost.title || !newPost.content) return;
        try {
            const res = await fetch(`${API_BASE_URL}/board`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPost, priority: 'NORMAL' })
            });
            if (res.ok) {
                setShowModal(false);
                setNewPost({ type: 'NOTICE', title: '', content: '', author: '관리자' });
                fetchPosts();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredPosts = posts.filter(p => {
        const matchesFilter = filter === 'ALL' || p.type === filter;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 text-left">
            {/* 상단 섹션: 대시보드와 통일된 헤더 느낌 ㅋ */}
            <div className="flex items-end justify-between">
                <div className="text-left">
                    <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-none text-left">
                        Communication<br />Center
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] mt-4 flex items-center gap-2 text-left">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        REALTIME FIELD COMMUNICATION
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                            type="text"
                            placeholder="제목 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-100 py-4 pl-14 pr-8 rounded-[2rem] text-xs font-bold outline-none w-80 shadow-sm focus:ring-4 ring-blue-50 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-slate-900 text-white px-10 py-4 rounded-[2rem] text-xs font-black uppercase shadow-xl hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} strokeWidth={3} /> Write Post
                    </button>
                </div>
            </div>

            {/* 필터 탭: 캡처본의 버튼 스타일 적용  */}
            <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-slate-100 w-fit gap-1">
                {['ALL', 'NOTICE', 'ISSUE', 'SOP'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${filter === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {t === 'ALL' ? '전체' : t === 'NOTICE' ? '공지사항' : t === 'ISSUE' ? '이슈건의' : '지침서'}
                    </button>
                ))}
            </div>

            {/* 메인 리스트: 캡처본의 rounded-[4rem] 스타일 적용  */}
            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-50 overflow-hidden min-h-[600px]">
                <div className="divide-y divide-slate-50">
                    {filteredPosts.map((post) => (
                        <div key={post.boardID} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-10">
                                {/* 카테고리 아이콘  */}
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${post.type === 'NOTICE' ? 'bg-blue-50 text-blue-600' :
                                        post.type === 'ISSUE' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {post.type === 'NOTICE' ? <Megaphone size={28} /> : post.type === 'ISSUE' ? <AlertOctagon size={28} /> : <FileText size={28} />}
                                </div>

                                <div className="text-left">
                                    <div className="flex items-center gap-3 mb-2 text-left">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-left">{post.type}</span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">| {post.author}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors text-left tracking-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-2 line-clamp-1 max-w-2xl font-medium text-left italic">
                                        {post.content}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-3">
                                <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px] font-bold">
                                    <Clock size={14} />
                                    {new Date(post.regDate).toLocaleDateString()}
                                </div>
                                <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <ArrowUpRight size={22} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredPosts.length === 0 && (
                        <div className="py-40 text-center opacity-20 flex flex-col items-center">
                            <MessageSquare size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-[0.4em] text-sm">No Conversations Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 글쓰기 모달 💡 */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl relative animate-in zoom-in-95 duration-300 text-left">
                        <div className="flex justify-between items-start mb-10 text-left">
                            <div className="text-left">
                                <h3 className="text-3xl font-black italic text-slate-900 uppercase leading-none text-left">New<br />Post</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-left">현장 공지 및 건의사항 등록</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><X /></button>
                        </div>

                        <div className="space-y-8 text-left">
                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 text-left block">Category</label>
                                <select
                                    value={newPost.type}
                                    onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                    className="w-full bg-slate-50 border-none p-5 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all text-left"
                                >
                                    <option value="NOTICE">NOTICE (공지사항)</option>
                                    <option value="ISSUE">ISSUE (이슈/건의)</option>
                                    <option value="SOP">SOP (작업지침)</option>
                                </select>
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 text-left block">Subject</label>
                                <input
                                    type="text"
                                    placeholder="제목을 입력하세요..."
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full bg-slate-50 border-none p-5 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all text-left"
                                />
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 text-left block">Description</label>
                                <textarea
                                    placeholder="상세 내용을 입력하세요..."
                                    value={newPost.content}
                                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                    className="w-full bg-slate-50 border-none p-5 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-4 ring-blue-50 transition-all h-40 resize-none text-left"
                                />
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-2xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-left"
                            >
                                <Send size={18} /> Submit Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const FileText = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>;
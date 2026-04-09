import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
    LayoutDashboard, Database, ShoppingCart, Smartphone, Activity, Zap, Plus, Package,
    CheckCircle2, XCircle, X, Search, ChevronDown, RefreshCw, Warehouse, AlertTriangle,
    Truck, FileSpreadsheet, Box, Filter, Clock, ArrowDownCircle, Layers, Info, PlusCircle, Tag,
    TrendingUp, BarChart3, PieChart, ArrowUpRight, ShieldCheck, MessageSquare, Megaphone,
    AlertOctagon, Send, Trash2, ArrowLeft, User, MessageCircle, LogIn, UserPlus, LogOut, Lock, UserMinus,
    Calendar, Hash, Minus, ChevronLeft, ChevronRight, HardDrive, ClipboardList, Settings, ThumbsUp, MessageSquareText, MoreHorizontal,
    ListFilter, History, Save, FileEdit, FileText, Eye, MessageSquarePlus, Share2, Edit3, PenLine
} from 'lucide-react';

// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const API_BASE_URL = 'http://localhost:5188/api/mes';

// --- 🔥 Firebase 설정 ---
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

// --- 헬퍼 컴포넌트 ---

// 공통 페이징 컴포넌트
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-1 mt-6 py-4">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
                <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => onPageChange(i + 1)}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-slate-800 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

// 통계 카드 컴포넌트


function StatCard({ label, value, unit, icon: Icon, colorClass }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5 text-left">
            <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10 shrink-0`}>
                <Icon className={colorClass.replace('bg-', 'text-')} size={28} />
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
                    <span className="text-sm text-slate-400 font-semibold">{unit}</span>
                </div>
            </div>
        </div>
    );
}
 //📢 1. Issue Component ---
const Issue = ({ onShowNotice, currentUser }) => {
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isWriting, setIsWriting] = useState(false);
    const [loading, setLoading] = useState(false);

    // 게시글 목록 페이징
    const [postPage, setPostPage] = useState(1);
    const postsPerPage = 15;

    // 새 게시글 작성 상태
    const [newPost, setNewPost] = useState({ Title: '', Content: '', Type: 'ISSUE' });

    // 수정 상태
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState('');
    const [editPostContent, setEditPostContent] = useState('');

    // 댓글 상태
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [commentPage, setCommentPage] = useState(1);
    const commentsPerPage = 10;
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // 사용자 정보 추출 (대소문자 방어 코드)
    const myId = currentUser?.UserId || currentUser?.userId || "";
    const myName = currentUser?.UserName || currentUser?.userName || "";
    const isAdmin = useMemo(() => myId.toLowerCase() === 'admin', [myId]);

    // 게시판 로드
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/board?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    // 댓글 로드
    const fetchComments = useCallback(async (pNo) => {
        if (!pNo) return;
        try {
            const res = await fetch(`${API_BASE_URL}/board/${pNo}/comments`);
            if (res.ok) setComments(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    useEffect(() => {
        const pId = selectedPost?.PostNo ?? selectedPost?.postNo;
        if (pId) { fetchComments(pId); setCommentPage(1); setIsEditingPost(false); }
    }, [selectedPost, fetchComments]);

    // 🔥 정렬 로직: 공지사항(NOTICE)을 최상단으로, 나머지는 최신순
    const sortedPosts = useMemo(() => {
        return [...posts].sort((a, b) => {
            const aType = (a.Type || a.type || "").toUpperCase();
            const bType = (b.Type || b.type || "").toUpperCase();
            if (aType === 'NOTICE' && bType !== 'NOTICE') return -1;
            if (aType !== 'NOTICE' && bType === 'NOTICE') return 1;
            return new Date(b.RegDate || b.regDate) - new Date(a.RegDate || a.regDate);
        });
    }, [posts]);

    // --- 📢 글(Post) 관련 핸들러 ---
    const handleCreatePost = async () => {
        if (!newPost.Title.trim() || !newPost.Content.trim()) {
            onShowNotice("제목과 내용을 입력해주세요.", "error");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/board`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 🔥 UserName 포함
                body: JSON.stringify({
                    ...newPost,
                    UserId: myId,
                    UserName: myName
                })
            });
            if (res.ok) {
                onShowNotice("글이 등록되었습니다.");
                setIsWriting(false);
                setNewPost({ Title: '', Content: '', Type: 'ISSUE' });
                fetchPosts();
            }
        } catch (e) { onShowNotice("등록 실패", "error"); }
    };

    const handleDeletePost = async () => {
        const pId = selectedPost?.PostNo ?? selectedPost?.postNo;
        if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/board/${pId}?userId=${myId}`, { method: 'DELETE' });
            if (res.ok) { setSelectedPost(null); fetchPosts(); onShowNotice("삭제되었습니다."); }
        } catch (e) { onShowNotice("삭제 실패", "error"); }
    };

    const handleUpdatePost = async () => {
        const pId = selectedPost?.PostNo ?? selectedPost?.postNo;
        try {
            const res = await fetch(`${API_BASE_URL}/board/${pId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // 🔥 UserName 포함
                body: JSON.stringify({
                    UserId: myId,
                    UserName: myName,
                    Title: editPostTitle,
                    Content: editPostContent
                })
            });
            if (res.ok) {
                setIsEditingPost(false);
                setSelectedPost({ ...selectedPost, Title: editPostTitle, Content: editPostContent });
                fetchPosts();
                onShowNotice("수정되었습니다.");
            }
        } catch (e) { onShowNotice("수정 실패", "error"); }
    };

    // --- 💬 댓글 관련 핸들러 ---
    const handleAddComment = async (targetPostNo) => {
        if (!commentInput.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/board/${targetPostNo}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 🔥 UserName 포함
                body: JSON.stringify({
                    PostNo: targetPostNo,
                    UserId: myId,
                    UserName: myName,
                    Content: commentInput.trim()
                })
            });
            if (res.ok) { setCommentInput(''); fetchComments(targetPostNo); }
        } catch (e) { }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/board/comments/${commentId}?userId=${myId}`, { method: 'DELETE' });
            if (res.ok) fetchComments(selectedPost?.PostNo ?? selectedPost?.postNo);
        } catch (e) { }
    };

    const handleUpdateComment = async (commentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/board/${commentId}/comments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // 🔥 UserName 포함
                body: JSON.stringify({
                    UserId: myId,
                   
                    Content: editContent.trim()
                })
            });
            if (res.ok) { setEditingCommentId(null); fetchComments(selectedPost?.PostNo ?? selectedPost?.postNo); }
        } catch (e) { }
    };

    // --- 페이징 계산 ---
    const currentPosts = useMemo(() => {
        return sortedPosts.slice((postPage - 1) * postsPerPage, postPage * postsPerPage);
    }, [sortedPosts, postPage]);

    const pagedComments = useMemo(() => {
        return comments.slice((commentPage - 1) * commentsPerPage, commentPage * commentsPerPage);
    }, [comments, commentPage]);

    // --- UI 렌더링 ---

    // 1. 글쓰기 화면
    if (isWriting) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen font-sans text-left">
                <div className="flex items-center gap-2 mb-8 border-b pb-4">
                    <PenLine size={20} className="text-indigo-600" />
                    <h2 className="text-xl font-bold">새 게시글 작성</h2>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-2">말머리</label>
                        <select
                            className="w-40 p-2 border rounded-md outline-none focus:border-indigo-500"
                            value={newPost.Type}
                            onChange={(e) => setNewPost({ ...newPost, Type: e.target.value })}
                        >
                            <option value="ISSUE">일반 이슈</option>
                            {isAdmin && <option value="NOTICE">📢 공지사항 (관리자 전용)</option>}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-2">제목</label>
                        <input
                            className="w-full p-3 border rounded-md outline-none focus:border-indigo-500 text-lg font-medium"
                            placeholder="제목을 입력하세요"
                            value={newPost.Title}
                            onChange={(e) => setNewPost({ ...newPost, Title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-2">내용</label>
                        <textarea
                            className="w-full h-80 p-4 border rounded-md outline-none focus:border-indigo-500 resize-none leading-relaxed"
                            placeholder="내용을 상세히 적어주세요..."
                            value={newPost.Content}
                            onChange={(e) => setNewPost({ ...newPost, Content: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t mt-10">
                        <button onClick={() => setIsWriting(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-md transition-colors">취소</button>
                        <button onClick={handleCreatePost} className="px-10 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 shadow-md">등록하기</button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. 글 상세 보기 화면
    if (selectedPost) {
        const postOwnerId = selectedPost.UserId || selectedPost.userId;
        const isPostAuthor = postOwnerId === myId || isAdmin;

        return (
            <div className="max-w-5xl mx-auto bg-white min-h-screen text-left font-sans border-x border-slate-100 animate-in fade-in duration-300">
                <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft size={14} /> 목록으로
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {isEditingPost ? (
                        <div className="space-y-4">
                            <input className="w-full text-xl font-bold p-3 border rounded-md outline-none focus:border-indigo-500" value={editPostTitle} onChange={e => setEditPostTitle(e.target.value)} />
                            <textarea className="w-full min-h-[400px] p-5 text-sm border rounded-md outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none" value={editPostContent} onChange={e => setEditPostContent(e.target.value)} />
                            <div className="flex justify-end gap-2"><button onClick={() => setIsEditingPost(false)} className="px-5 py-2 text-xs font-bold">취소</button><button onClick={handleUpdatePost} className="px-6 py-2 bg-slate-800 text-white rounded">수정완료</button></div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <div className="border-b border-slate-200 pb-3 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    {(selectedPost.Type || selectedPost.type) === 'NOTICE' && <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded border border-red-100 uppercase">Notice</span>}
                                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">{selectedPost.Title || selectedPost.title}</h1>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                    <span className="text-slate-700 font-bold pr-3 border-r border-slate-200">{selectedPost.UserName || selectedPost.userName}</span>
                                    <span className="px-3 border-r border-slate-200">{new Date(selectedPost.RegDate || selectedPost.regDate).toLocaleString()}</span>
                                    <span className="px-3">조회 {(selectedPost.Views || 0) + 1}</span>
                                    {isPostAuthor && (
                                        <div className="ml-auto flex gap-3"><button onClick={() => { setIsEditingPost(true); setEditPostTitle(selectedPost.Title); setEditPostContent(selectedPost.Content); }} className="hover:text-indigo-600 font-bold">수정</button><button onClick={handleDeletePost} className="hover:text-red-500 font-bold">삭제</button></div>
                                    )}
                                </div>
                            </div>
                            <div className="py-6 text-slate-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap min-h-[300px]">{selectedPost.Content || selectedPost.content}</div>
                            <div className="py-10 flex justify-center border-b border-slate-100 mb-8">
                                <button className="flex flex-col items-center justify-center w-16 h-16 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all group active:scale-95">
                                    <ThumbsUp size={20} className="mb-1 text-slate-300 group-hover:text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">{(selectedPost.Likes || 0)}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm"><span>댓글</span><span className="text-indigo-600">{comments.length}</span></div>
                        <div className="space-y-0 border-t border-slate-100 mb-8">
                            {pagedComments.map((comm) => {
                                const isCommEditing = editingCommentId === (comm.CommentId || comm.commentId);
                                const isCommAuthor = (comm.UserId || comm.userId) === myId || isAdmin;
                                return (
                                    <div key={comm.CommentId || comm.commentId} className="py-4 border-b border-slate-50 group text-left">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-700">{comm.UserName || comm.userName}</span><span className="text-[10px] text-slate-300">{new Date(comm.RegDate || comm.regDate).toLocaleString()}</span></div>
                                            {isCommAuthor && !isCommEditing && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all text-[10px] font-bold text-slate-400"><button onClick={() => { setEditingCommentId(comm.CommentId || comm.commentId); setEditContent(comm.Content || comm.content); }} className="hover:text-indigo-600">수정</button><button onClick={() => handleDeleteComment(comm.CommentId || comm.commentId)} className="hover:text-red-500">삭제</button></div>
                                            )}
                                        </div>
                                        {isCommEditing ? (
                                            <div className="mt-2 space-y-2"><textarea className="w-full border p-2 text-xs rounded h-16 resize-none bg-slate-50" value={editContent} onChange={e => setEditContent(e.target.value)} /><div className="flex justify-end gap-2"><button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-[10px] font-bold border rounded">취소</button><button onClick={() => handleUpdateComment(comm.CommentId || comm.commentId)} className="px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded">저장</button></div></div>
                                        ) : (
                                            <p className="text-xs text-slate-600 leading-normal">{comm.Content || comm.content}</p>
                                        )}
                                    </div>
                                );
                            })}
                            <Pagination currentPage={commentPage} totalPages={Math.ceil(comments.length / commentsPerPage)} onPageChange={setCommentPage} />
                        </div>
                        {!isEditingPost && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-left shadow-inner">
                                <textarea className="w-full text-xs p-3 border border-slate-200 rounded-sm h-20 outline-none focus:border-indigo-400 resize-none bg-white shadow-sm" value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="댓글을 남겨보세요." />
                                <div className="flex justify-end mt-2"><button onClick={() => handleAddComment(selectedPost.PostNo ?? selectedPost.postNo)} className="px-6 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 active:scale-95 transition-all">등록</button></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 3. 목록 화면
    return (
        <div className="p-6 max-w-6xl mx-auto font-sans text-left bg-white shadow-inner min-h-screen">
            <div className="flex justify-between items-end mb-6 border-b-2 border-indigo-600 pb-3">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <ClipboardList size={22} />게시판
                </h2>
                <div className="flex items-center gap-3">
                    <button onClick={fetchPosts} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setIsWriting(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-md hover:bg-indigo-700 shadow-md active:scale-95 transition-all">
                        <PenLine size={14} /> 글쓰기
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-300 shadow-sm overflow-hidden bg-white min-h-[400px]">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                        <tr>
                            <th className="py-3 px-4 text-center w-20">번호</th>
                            <th className="py-3 px-4 text-left">제목</th>
                            <th className="py-3 px-4 text-center w-32">글쓴이</th>
                            <th className="py-3 px-4 text-center w-40">날짜</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentPosts.map(p => {
                            const type = (p.Type || p.type || "").toUpperCase();
                            return (
                                <tr key={p.PostNo || p.postNo} onClick={() => setSelectedPost(p)} className={`hover:bg-indigo-50/30 cursor-pointer transition-colors group ${type === 'NOTICE' ? 'bg-amber-50/40' : ''}`}>
                                    <td className="py-3 text-center text-slate-400 font-mono text-xs">
                                        {type === 'NOTICE' ? <Megaphone size={14} className="mx-auto text-amber-500" /> : (p.PostNo || p.postNo)}
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-700 group-hover:text-indigo-600">
                                        {type === 'NOTICE' && <span className="text-amber-600 font-black mr-2 text-[11px]">[공지]</span>}
                                        {p.Title || p.title}
                                        <span className="ml-1.5 text-[11px] text-red-500 font-bold opacity-70">[{p.CommentCount || p.commentCount}]</span>
                                    </td>
                                    <td className="py-3 text-center text-slate-500">{p.UserName || p.userName}</td>
                                    <td className="py-3 text-center text-slate-400 font-mono text-[11px]">{new Date(p.RegDate || p.regDate).toLocaleDateString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {posts.length === 0 && !loading && <div className="py-32 text-center text-slate-300 italic text-lg border-b">등록된 게시글이 없습니다.</div>}
            </div>
            <Pagination currentPage={postPage} totalPages={Math.ceil(posts.length / postsPerPage)} onPageChange={setPostPage} />
        </div>
    );
};



// --- 📊 2. Dash Component (분석 중심 대시보드) ---
const Dash = ({ inventoryList, finishedList, defectList, onRefresh, loading }) => {
    const stats = useMemo(() => {
        const totalProduced = finishedList.length;
        const totalDefects = defectList.length;
        const totalInbound = inventoryList.reduce((acc, cur) => acc + (cur.StockQty || cur.stockQty || 0), 0);
        const yieldRate = (totalProduced + totalDefects) > 0
            ? ((totalProduced / (totalProduced + totalDefects)) * 100).toFixed(1)
            : "100.0";

        const dailyStats = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const qty = finishedList.filter(item => (item.InDate || item.inDate || "").startsWith(dateStr)).length;
            return { date: dateStr.slice(5), qty };
        }).reverse();

        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        const yearStr = new Date().getFullYear().toString();
        const monthlyStats = months.map(m => {
            const prefix = `${yearStr}-${m}`;
            const qty = finishedList.filter(item => (item.InDate || item.inDate || "").startsWith(prefix)).length;
            return { month: `${m}월`, qty };
        });

        return { totalProduced, totalDefects, totalInbound, yieldRate, dailyStats, monthlyStats };
    }, [inventoryList, finishedList, defectList]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutDashboard size={24} className="text-indigo-600" /> 통합 생산 관제 대시보드
                    </h2>
                    <p className="text-sm text-slate-500">실시간 공정 지표 및 생산 분석 현황을 확인합니다.</p>
                </div>
                <button onClick={onRefresh} className={`p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-indigo-600 transition-all ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="총 완성차 출하" value={stats.totalProduced} unit="Unit" icon={Truck} colorClass="bg-indigo-600" />
                <StatCard label="공정 불량 발생" value={stats.totalDefects} unit="Case" icon={AlertOctagon} colorClass="bg-red-600" />
                <StatCard label="자재 보유 현황" value={stats.totalInbound} unit="Pcs" icon={Package} colorClass="bg-amber-600" />
                <StatCard label="최종 공정 수율" value={stats.yieldRate} unit="%" icon={TrendingUp} colorClass="bg-emerald-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-8">
                        <BarChart3 size={16} className="text-indigo-500" /> 최근 7일 생산 트렌드 (Daily)
                    </h3>
                    <div className="h-48 flex items-end gap-4 px-2">
                        {stats.dailyStats.map((d, i) => {
                            const max = Math.max(...stats.dailyStats.map(x => x.qty)) || 1;
                            const h = (d.qty / max) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="relative w-full bg-slate-50 rounded-t-lg h-40 flex flex-col justify-end overflow-hidden">
                                        <div style={{ height: `${h}%` }} className="bg-indigo-500 group-hover:bg-indigo-600 transition-all duration-500 rounded-t-sm w-full" />
                                        {d.qty > 0 && <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{d.qty}</span>}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400">{d.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-8">
                        <PieChart size={16} className="text-indigo-500" /> 연간 월별 실적 분석 (Monthly)
                    </h3>
                    <div className="h-48 flex items-end gap-2 px-2">
                        {stats.monthlyStats.map((d, i) => {
                            const max = Math.max(...stats.monthlyStats.map(x => x.qty)) || 1;
                            const h = (d.qty / max) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="relative w-full bg-slate-50 rounded-t-lg h-40 flex flex-col justify-end overflow-hidden">
                                        <div style={{ height: `${h}%` }} className="bg-slate-300 group-hover:bg-indigo-500 transition-all duration-300 rounded-t-sm w-full" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 truncate w-full text-center">{d.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-6">
                    <AlertTriangle size={18} className="text-amber-500" /> 자재 수급 주의 품목 (Low Stock Warning)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-left">
                    {inventoryList.filter(p => (p.StockQty || p.stockQty || 0) < 100).map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-red-50/50 rounded-lg border border-red-100">
                            <div>
                                <p className="text-[10px] font-bold text-red-400 uppercase leading-none mb-1">Part ID</p>
                                <span className="text-xs font-black text-slate-700">{p.PartId || p.partId}</span>
                            </div>
                            <span className="text-sm font-black text-red-600">{p.StockQty || p.stockQty}</span>
                        </div>
                    ))}
                    {inventoryList.filter(p => (p.StockQty || p.stockQty || 0) < 100).length === 0 && (
                        <div className="col-span-full py-4 text-center text-slate-400 text-sm font-medium italic">안전 재고 수준을 유지하고 있습니다.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 📦 3. Stock Component (실시간 재고 현황 - 데이터 출력 강화) ---
const Stock = ({ tab, setTab, inventoryList, finishedList, defectList, searchTerm, setSearchTerm, fetchAllStocks, onShowNotice }) => {
    const [inboundForm, setInboundForm] = useState({ partId: '', qty: 10 });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 12;

    const availableParts = useMemo(() => Array.from(new Set(inventoryList.map(item => item.PartId || item.partId))).filter(Boolean), [inventoryList]);
    useEffect(() => { if (availableParts.length > 0 && !inboundForm.partId) setInboundForm(p => ({ ...p, partId: availableParts[0] })); }, [availableParts]);

    const handleInbound = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/inventory/receive`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ PartId: inboundForm.partId, Qty: inboundForm.qty })
            });
            if (res.ok) { onShowNotice("입고가 완료되었습니다."); fetchAllStocks(); }
        } catch (e) { onShowNotice("입고 실패", "error"); }
    };

    const fullList = useMemo(() => {
        const list = tab === 'FINISHED' ? finishedList : tab === 'DEFECT' ? defectList : inventoryList;
        return list.filter(item => {
            const s = searchTerm.toLowerCase();
            const id = (item.PartId || item.ModelId || item.LotId || item.DefectId || item.partId || item.modelId || "").toLowerCase();
            return id.includes(s);
        });
    }, [tab, inventoryList, finishedList, defectList, searchTerm]);

    useEffect(() => { setCurrentPage(1); }, [tab, searchTerm]);

    const paginatedList = fullList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(fullList.length / rowsPerPage);

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500 text-left">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200 shadow-inner">
                    {[{ id: 'inventory', label: 'BOM 부품 재고' }, { id: 'FINISHED', label: '완성차 출고 현황' }, { id: 'DEFECT', label: '품질 불량 이력' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2 rounded-md text-[13px] font-bold transition-all ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{t.label}</button>
                    ))}
                </div>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="식별 코드(ID) 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-80 shadow-sm transition-all font-medium" />
                </div>
            </div>

            {tab === 'inventory' && (
                <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md"><Plus size={24} /></div>
                        <div><h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">현장 자재 즉시 입고</h4><p className="text-xs text-slate-500 font-medium">BOM 구성 부품의 수량을 즉시 반영합니다.</p></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Part ID</label><select value={inboundForm.partId} onChange={(e) => setInboundForm({ ...inboundForm, partId: e.target.value })} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold outline-none shadow-sm cursor-pointer">{availableParts.map(id => <option key={id} value={id}>{id}</option>)}</select></div>
                        <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">Qty</label><input type="number" value={inboundForm.qty} onChange={e => setInboundForm({ ...inboundForm, qty: Number(e.target.value) })} className="w-24 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-center outline-none shadow-sm" /></div>
                        <button onClick={handleInbound} className="self-end bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md active:scale-95 transition-all">입고 실행</button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-left">
                        <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">식별자 (Identity ID)</th>
                            <th className="px-6 py-4">연결 공정/모델 (Model Name)</th>
                            <th className="px-6 py-4 text-center">수량 (Quantity)</th>
                            <th className="px-6 py-4 text-center">기록 시간 (Record Time)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-left">
                        {paginatedList.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-700">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-indigo-700">{item.PartId || item.LotId || item.DefectId || item.partId || item.lotId || item.defectId}</span>
                                        <span className="text-[10px] text-slate-400 font-mono tracking-tight">System Ref: #{(currentPage - 1) * rowsPerPage + i + 1}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-left">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${tab === 'DEFECT' ? 'bg-red-400' : 'bg-indigo-400'}`} />
                                        <span className="text-slate-600 font-bold">{item.ModelId || item.Models || item.modelId || item.models || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-md text-sm font-black italic tracking-tighter shadow-sm ${tab === 'DEFECT' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-indigo-50 text-indigo-900 border border-indigo-100'}`}>
                                        x {item.StockQty ?? item.Qty ?? item.stockQty ?? item.qty ?? (tab === 'FINISHED' || tab === 'DEFECT' ? 1 : 0)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-slate-400 font-mono">
                                    {item.RegDate || item.InDate || item.regDate || item.inDate
                                        ? new Date(item.RegDate || item.InDate || item.regDate || item.inDate).toLocaleString()
                                        : '시간 정보 없음'}
                                </td>
                            </tr>
                        ))}
                        {paginatedList.length === 0 && (
                            <tr><td colSpan="4" className="py-20 text-center text-slate-300 font-medium italic">해당 조건의 데이터가 존재하지 않습니다.</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/30">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

// --- 💎 4. Main App Component ---
export default function App() {


    const getInitialMenu = () => {
        const hash = window.location.hash.replace('#', '');
        const menuBase = hash.split('/')[0];
        return menuBase ? parseInt(menuBase) : 0;
    };
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
    const [inputQty, setInputQty] = useState(10);
    const [selectedModel, setSelectedModel] = useState('AVN-01');

    const showNotice = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };



    // 💡 Hash 업데이트 (메뉴가 실제로 바뀔 때만 베이스 해시를 변경하여 서브 경로 보존)
    useEffect(() => {
        const currentHash = window.location.hash.replace('#', '');
        const currentMenuInHash = currentHash.split('/')[0];

        if (currentMenuInHash !== activeMenu.toString()) {
            window.location.hash = activeMenu.toString();
        }
    }, [activeMenu]);

    // 💡 브라우저 뒤로가기/해시변경 감지
    useEffect(() => {
        const handleHashChange = () => {
            const newMenu = getInitialMenu();
            if (newMenu !== activeMenu) setActiveMenu(newMenu);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [activeMenu]);



    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else { await signInAnonymously(auth); }
            } catch (err) { console.error(err); }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const sessionRef = doc(db, 'artifacts', appId, 'users', fbUser.uid, 'session', 'profile');
                const sessionDoc = await getDoc(sessionRef);
                if (sessionDoc.exists()) setCurrentUser(sessionDoc.data());
            } else { setCurrentUser(null); }
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
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (currentUser) fetchAllStocks(); }, [currentUser, fetchAllStocks]);

    const handleAuth = async () => {
        const endpoint = isSignup ? 'signup' : 'login';
        try {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ UserId: authForm.userId, Password: authForm.password, UserName: isSignup ? authForm.userName : "" })
            });
            const data = await res.json();
            if (res.ok) {
                if (isSignup) { setIsSignup(false); showNotice("회원가입 완료. 로그인 해주세요."); }
                else {
                    if (auth.currentUser) {
                        const sessionRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'session', 'profile');
                        await setDoc(sessionRef, data);
                    }
                    setCurrentUser(data);
                    showNotice(`${data.UserName || data.userName}님 접속 성공`);
                }
                setAuthForm({ userId: '', password: '', userName: '' });
            } else { showNotice(data.message || '인증 실패', "error"); }
        } catch (e) { showNotice("서버 통신 실패", "error"); }
    };

    const handleLogout = async () => {
        if (auth.currentUser) await deleteDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'session', 'profile'));
        await signOut(auth);
        setCurrentUser(null);
    };

    const handleWithdraw = async () => {
        if (!window.confirm("정말로 탈퇴하시겠습니까?")) return;
        const password = window.prompt("본인 확인을 위해 비밀번호를 입력해주세요.");
        try {
            const res = await fetch(`${API_BASE_URL}/UserDelete`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ UserId: currentUser.UserId || currentUser.userId, Password: password })
            });
            if (res.ok) { handleLogout(); showNotice("탈퇴 완료되었습니다."); }
        } catch (e) { showNotice("탈퇴 실패", "error"); }
    };

    const handleOrder = async () => {
        const payload = { OrderId: `SO-${Date.now().toString().slice(-6)}`, Customer: '기아자동차', ModelId: selectedModel, Qty: Number(inputQty) };
        try {
            const res = await fetch(`${API_BASE_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { showNotice("수주 등록 완료"); fetchAllStocks(); }
        } catch (e) { showNotice("등록 에러", "error"); }
    };

    const handlePdaAction = async (jobId, result) => {
        try {
            const res = await fetch(`${API_BASE_URL}/complete`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify

                    ({ JobId: jobId, Result: result })
            });
            if (res.ok) { showNotice("작업 처리 완료"); await fetchAllStocks(); }
            else { showNotice("재고 부족", "error"); }
        } catch (e) { showNotice("에러 발생", "error"); }
    };

    if (!currentUser) {
        return (
            <div className="flex h-screen bg-slate-100 items-center justify-center p-6 text-left">
                {message.text && (
                    <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 font-semibold text-sm ${message.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white animate-in slide-in-from-top'}`}>
                        {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {message.text}
                    </div>
                )}
                <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-10 border border-slate-200 animate-in zoom-in-95 duration-500 text-left">
                    <div className="flex flex-col items-center mb-8"><div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-4 shadow-md"><Database size={28} /></div><h2 className="text-2xl font-bold text-slate-800">NexMES Access</h2><p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest text-center">Office Manufacturing Control</p></div>
                    <div className="space-y-4">{isSignup && (<div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">사용자 이름</label><input type="text" placeholder="Full Name" value={authForm.userName} onChange={e => setAuthForm({ ...authForm, userName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 ring-indigo-500 outline-none" /></div>)}<div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">아이디</label><input type="text" placeholder="ID" value={authForm.userId} onChange={e => setAuthForm({ ...authForm, userId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 ring-indigo-500 outline-none" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">비밀번호</label><input type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium focus:ring-2 ring-indigo-500 outline-none" /></div><button onClick={handleAuth} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-all mt-4">{isSignup ? "Create System Account" : "Access Console"}</button></div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center"><button onClick={() => setIsSignup(!isSignup)} className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">{isSignup ? "기존 계정으로 로그인" : "새 시스템 계정 만들기"}</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-left">
            {message.text && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 font-semibold text-sm ${message.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white animate-in slide-in-from-top'}`}>{message.text}</div>
            )}
            <aside className="w-60 bg-slate-900 flex flex-col shrink-0 text-white z-20">
                <div className="p-6 flex items-center gap-3 border-b border-white/5 bg-slate-900/50"><Database size={20} className="text-indigo-400" /><h1 className="font-bold text-lg tracking-tight">NexMES <span className="text-indigo-400 font-medium">CORE</span></h1></div>
                <nav className="flex-1 mt-6 px-4 space-y-1">
                    {[{ id: 0, label: "종합 대시보드", icon: LayoutDashboard }, { id: 3, label: "게시판  ", icon: ClipboardList }, { id: 2, label: "수주/작업 관리", icon: ShoppingCart }, { id: 5, label: "실시간 재고 현황", icon: HardDrive }].map((menu) => (
                        <button key={menu.id} onClick={() => setActiveMenu(menu.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeMenu === menu.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><menu.icon size={16} /> {menu.label}</button>
                    ))}
                </nav>
                <div className="p-4 space-y-2 mt-auto"><button onClick={() => setIsPdaOpen(!isPdaOpen)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm"><Smartphone size={14} /> PDA Console {isPdaOpen ? 'Off' : 'On'}</button></div>
                <div className="p-6 bg-slate-950/40 border-t border-white/5 flex items-center justify-between"><div className="flex flex-col truncate text-left"><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1 text-left">Operator</span><span className="text-xs font-bold text-slate-200 truncate text-left">{currentUser.UserName || currentUser.userName}</span></div><div className="flex gap-1 shrink-0"><button onClick={handleLogout} title="로그아웃" className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all"><LogOut size={16} /></button><button onClick={handleWithdraw} title="탈퇴" className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-md transition-all"><UserMinus size={16} /></button></div></div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0 shadow-sm z-10 text-left"><div className="flex items-center gap-3"><div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" /><h2 className="text-sm font-bold text-slate-600 uppercase tracking-[0.2em] italic text-left">System Terminal / {activeMenu === 0 ? 'Dashboard' : activeMenu === 3 ? 'Communication' : activeMenu === 5 ? 'Inventory' : 'WorkOrders'}</h2></div></header>
                <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
                    {activeMenu === 0 && <Dash inventoryList={inventoryList} finishedList={finishedList} defectList={defectList} loading={loading} onRefresh={fetchAllStocks} />}
                    {activeMenu === 3 && <Issue onShowNotice={showNotice} currentUser={currentUser} />}
                    {activeMenu === 5 && <Stock tab={tab} setTab={setTab} inventoryList={inventoryList} finishedList={finishedList} defectList={defectList} searchTerm={searchTerm} setSearchTerm={setSearchTerm} fetchAllStocks={fetchAllStocks} onShowNotice={showNotice} />}
                    {activeMenu === 2 && (
                        <div className="p-8 space-y-6 animate-in fade-in max-w-6xl mx-auto">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8"><div className="flex items-center gap-5 text-left"><div className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0"><PlusCircle size={32} /></div><div className="text-left"><h3 className="text-xl font-bold text-slate-800 text-left">생산 수주 및 작업 지시</h3><p className="text-sm text-slate-400 font-medium text-left">수주 내용을 바탕으로 현장 PDA에 즉시 작업 지시를 하달합니다.</p></div></div><div className="flex items-center gap-3 w-full lg:w-auto text-left"><div className="flex flex-col gap-1 flex-1 lg:flex-none text-left"><label className="text-[10px] font-bold text-indigo-600 uppercase ml-1 text-left">Car Model</label><select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm outline-none"><option value="AVN-01">아반떼 CN7</option><option value="G80-01">제네시스 G80</option><option value="ION-06">아이오닉 6</option></select></div><div className="flex flex-col gap-1 w-24 text-left"><label className="text-[10px] font-bold text-indigo-600 uppercase ml-1 text-left">Batch Qty</label><input type="number" value={inputQty} onChange={e => setInputQty(Number(e.target.value))} className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold text-center shadow-sm outline-none" /></div><button onClick={handleOrder} className="self-end bg-indigo-600 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95">수주
                            </button></div></div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left"><div className="p-5 border-b border-slate-100 bg-slate-50/50 font-bold text-[11px] text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2"><ListFilter size={14} /> 현장 작업 지시 대기 현황 (PDA Queue)</div><table className="w-full text-left border-collapse"><thead className="text-[11px] text-slate-400 border-b border-slate-100 uppercase tracking-wider text-left"><tr><th className="px-8 py-5">Job ID</th><th className="px-8 py-5">Order No</th><th className="px-8 py-5">Production Model</th><th className="px-8 py-5 text-center">Batch Quantity</th></tr></thead><tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700 text-left">{pdaJobs.map(job => (<tr key={job.jobId || job.JobID} className="hover:bg-slate-50/30 transition-colors text-left"><td className="px-8 py-5 text-xs font-mono text-slate-400 text-left">{job.jobId || job.JobID}</td><td className="px-8 py-5 text-indigo-600 font-bold text-left">{job.soId || job.SoId}</td><td className="px-8 py-5 font-bold text-slate-800 text-left">{job.modelId || job.ModelId}</td><td className="px-8 py-5 text-center text-left"><span className="bg-slate-100 px-3 py-1 rounded text-base font-black italic tracking-tighter">x {job.batchQty || job.BatchQty}</span></td></tr>))}{pdaJobs.length === 0 && (<tr><td colSpan="4" className="py-20 text-center text-slate-300 font-medium italic uppercase tracking-widest text-center">No Active Work Orders</td></tr>)}</tbody></table></div>
                        </div>
                    )}
                </div>
            </main>

            <aside className={`bg-slate-800 border-l border-white/5 transition-all duration-500 relative flex flex-col z-30 shadow-2xl ${isPdaOpen ? 'w-[380px]' : 'w-0 overflow-hidden'}`}>
                <div className="p-7 h-full flex flex-col overflow-hidden text-white text-left text-left"><div className="flex justify-between items-center mb-8"><div className="flex items-center gap-3 text-indigo-400 font-bold text-xs tracking-widest"><Smartphone size={18} /> PDA TERMINAL</div><button onClick={() => setIsPdaOpen(false)} className="text-white/20 hover:text-white p-1 hover:bg-white/5 rounded-md transition-all text-left"><X size={24} /></button></div><div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-hide text-left">{pdaJobs.map(job => (<div key={job.jobId || job.JobID} className="bg-slate-700/40 border border-white/10 p-6 rounded-xl hover:bg-slate-700/60 transition-all group relative overflow-hidden shadow-inner text-left"><div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full text-left" /><div className="flex justify-between text-[11px] font-bold text-slate-400 mb-3 leading-none relative text-left"><span className="bg-indigo-600 text-white px-2 py-1 rounded text-[9px] uppercase">Ref: {job.soId || job.SoId}</span><span className="font-mono">{job.jobId || job.JobID}</span></div><div className="text-xl font-bold mb-1.5 text-white tracking-tight text-left">{job.modelId || job.ModelId}</div><div className="text-3xl font-black text-indigo-400 mb-8 italic tracking-tighter text-left">x {job.batchQty || job.BatchQty} <span className="text-[10px] not-italic text-slate-500 uppercase font-bold tracking-widest ml-1 text-left">Pcs</span></div><div className="grid grid-cols-2 gap-3 relative text-left"><button onClick={() => handlePdaAction(job.jobId || job.JobID, 'PASS')} className="bg-emerald-600/90 py-2.5 rounded-lg text-xs font-bold text-white hover:bg-emerald-500 transition-all active:scale-95 shadow-md text-left">생산 완료</button><button onClick={() => handlePdaAction(job.jobId || job.JobID, 'FAIL')} className="bg-red-600/90 py-2.5 rounded-lg text-xs font-bold text-white hover:bg-red-500 transition-all active:scale-95 shadow-md text-left">불량 등록</button></div></div>))}</div></div>
            </aside>
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
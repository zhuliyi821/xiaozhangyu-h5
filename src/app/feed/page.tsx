"use client";

/**
 * 💬 社区动态页
 *
 * 用户可发布动态、点赞、评论
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { Heart, MessageCircle, Send, Loader2, ImagePlus, X } from "lucide-react";

interface FeedItem {
  id: number;
  uid: number;
  nickname: string;
  avatar: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  is_liked: number;
  created_at: string;
  time_ago: string;
}

interface CommentItem {
  id: number;
  uid: number;
  nickname: string;
  content: string;
  created_at: string;
  time_ago: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set());
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn");

  const loadFeeds = useCallback(() => {
    setLoading(true);
    const uidParam = user ? `&uid=${user.uid}` : "";
    fetch(`${API_BASE}/api/feed?action=list${uidParam}`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setFeeds(j.data.list || []); })
      .catch(() => console.warn("请求 失败"))
      .finally(() => setLoading(false));
  }, [API_BASE, user]);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  const handlePost = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/api/feed?action=create`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, content: postContent.trim() }),
      });
      const j = await res.json();
      if (j.code === 0) { setPostContent(""); loadFeeds(); }
    } catch {}
    setPosting(false);
  };

  const handleLike = async (feedId: number) => {
    if (!user) { setShowLogin(true); return; }
    try {
      await fetch(`${API_BASE}/api/feed?action=like`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_id: feedId, uid: user.uid }),
      });
      loadFeeds();
    } catch {}
  };

  const toggleComments = async (feedId: number) => {
    const newSet = new Set(expandedComments);
    if (newSet.has(feedId)) {
      newSet.delete(feedId);
      setExpandedComments(newSet);
      return;
    }
    newSet.add(feedId);
    setExpandedComments(newSet);

    if (!comments[feedId]) {
      setCommentLoading(prev => new Set(prev).add(feedId));
      try {
        const res = await fetch(`${API_BASE}/api/feed?action=comments&feed_id=${feedId}`);
        const j = await res.json();
        if (j.code === 0) setComments(prev => ({ ...prev, [feedId]: j.data || [] }));
      } catch {}
      setCommentLoading(prev => { const s = new Set(prev); s.delete(feedId); return s; });
    }
  };

  const handleComment = async (feedId: number) => {
    if (!user) { setShowLogin(true); return; }
    const text = commentInputs[feedId]?.trim();
    if (!text) return;
    try {
      await fetch(`${API_BASE}/api/feed?action=comment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feed_id: feedId, uid: user.uid, content: text }),
      });
      setCommentInputs(prev => ({ ...prev, [feedId]: "" }));
      // Refresh comments + feed list
      const res = await fetch(`${API_BASE}/api/feed?action=comments&feed_id=${feedId}`);
      const j = await res.json();
      if (j.code === 0) setComments(prev => ({ ...prev, [feedId]: j.data || [] }));
      loadFeeds();
    } catch {}
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-brand-teal/10">
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-base font-semibold">💬 社区动态</h1>
          <span className="text-[10px] text-text-tertiary">{feeds.length}条动态</span>
        </div>
      </div>

      {/* Post Input */}
      <div className="mx-4 mt-3 bg-surface rounded-[8px] p-3 border border-brand-teal/10">
        <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
          placeholder={user ? "分享你的预测心得..." : "登录后可以发动态"}
          rows={2} maxLength={2000}
          className="w-full bg-bg rounded-[8px] px-3 py-2 text-xs resize-none outline-none focus:ring-2 focus:ring-brand-teal/30" />
        <div className="flex justify-end mt-2">
          <button onClick={handlePost} disabled={posting || !postContent.trim() || !user}
            className="px-4 py-1.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[11px] font-medium rounded-[10px] disabled:opacity-40 active:scale-95 transition-transform flex items-center gap-1">
            {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            发布
          </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="mx-4 mt-3 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-surface rounded-[8px] animate-pulse" />)}
        </div>
      ) : feeds.length === 0 ? (
        <div className="mx-4 mt-8 p-8 text-center bg-surface rounded-[8px]">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-sm text-text-secondary mb-1">还没有动态</p>
          <p className="text-[11px] text-text-tertiary">第一个发布预测心得吧</p>
        </div>
      ) : (
        <div className="mx-4 mt-3 space-y-3">
          {feeds.map(feed => (
            <div key={feed.id} className="bg-surface rounded-[8px] p-4 border border-brand-teal/10">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center text-sm text-white font-bold shrink-0">
                  {feed.nickname?.charAt(0) || "🐙"}
                </div>
                <div>
                  <div className="text-[12px] font-semibold">{feed.nickname}</div>
                  <div className="text-[9px] text-text-tertiary">{feed.time_ago}</div>
                </div>
              </div>

              {/* Content */}
              <p className="text-[12px] leading-relaxed mb-3 whitespace-pre-wrap">{feed.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
                <button onClick={() => handleLike(feed.id)} className="flex items-center gap-1 active:scale-90 transition-transform">
                  <Heart className={`w-3.5 h-3.5 ${feed.is_liked ? "fill-red-500 text-red-500" : ""}`} />
                  {feed.likes > 0 && feed.likes}
                </button>
                <button onClick={() => toggleComments(feed.id)} className="flex items-center gap-1 active:scale-90 transition-transform">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {feed.comments > 0 && feed.comments}
                </button>
              </div>

              {/* Comments */}
              {expandedComments.has(feed.id) && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {commentLoading.has(feed.id) ? (
                    <div className="h-8 bg-gray-50 rounded-[8px] animate-pulse" />
                  ) : (
                    (comments[feed.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2 text-[11px]">
                        <span className="font-semibold shrink-0">{c.nickname}:</span>
                        <span className="text-text-secondary">{c.content}</span>
                        <span className="text-[9px] text-text-tertiary ml-auto shrink-0">{c.time_ago}</span>
                      </div>
                    ))
                  )}
                  {user && (
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="写评论..." value={commentInputs[feed.id] || ""}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [feed.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleComment(feed.id)}
                        className="flex-1 bg-bg rounded-[10px] px-2.5 py-1.5 text-[11px] outline-none" />
                      <button onClick={() => handleComment(feed.id)}
                        className="px-2.5 py-1.5 bg-brand-teal text-white rounded-[10px] text-[10px] font-medium">
                        发送
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

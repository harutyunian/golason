'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl, getWsBaseUrl } from '@/utils/api';
import { MessageSquare, CornerDownRight, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import styles from '../news.module.css';

interface CommentUser {
  id: number;
  name: string | null;
}

interface Comment {
  id: number;
  content: string;
  articleId: number;
  parentId: number | null;
  createdAt: string;
  user: CommentUser;
  replies?: Comment[];
}

interface NewsCommentsProps {
  articleId: number;
}

export default function NewsComments({ articleId }: NewsCommentsProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState<{ [commentId: number]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const commentsRef = useRef<Comment[]>(comments);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  // Fetch comment tree on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/football/news/${articleId}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    fetchComments();
  }, [articleId]);

  // Connect to live WebSocket room for comments
  useEffect(() => {
    const wsUrl = getWsBaseUrl();
    const socketInstance: Socket = io(wsUrl, {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log(`[WS] Subscribed to real-time comments for News Article: ${articleId}`);
      socketInstance.emit('subscribeNews', { articleId });
    });

    socketInstance.on('newComment', (newComment: Comment) => {
      console.log('[WS] Received real-time comment:', newComment);
      
      setComments((prevComments) => {
        // If it's a top-level comment
        if (newComment.parentId === null) {
          // Check if already in state to avoid duplication
          if (prevComments.some((c) => c.id === newComment.id)) return prevComments;
          return [newComment, ...prevComments];
        }

        // If it's a reply comment, append to the parent's replies list recursively
        return prevComments.map((parent) => {
          if (parent.id === newComment.parentId) {
            const replies = parent.replies || [];
            if (replies.some((r) => r.id === newComment.id)) return parent;
            return {
              ...parent,
              replies: [...replies, newComment],
            };
          }
          return parent;
        });
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('[WS] Unsubscribed from real-time news comments.');
    });

    return () => {
      socketInstance.emit('unsubscribeNews', { articleId });
      socketInstance.disconnect();
    };
  }, [articleId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setError(null);
    setSuccess(null);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/football/news/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newCommentText }),
      });

      if (res.ok) {
        setNewCommentText('');
        setSuccess('Comment published successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to submit comment.');
      }
    } catch (err) {
      setError('Network connection error. Failed to post comment.');
    }
  };

  const handlePostReply = async (parentId: number) => {
    const text = replyText[parentId];
    if (!text || !text.trim()) return;

    setError(null);
    setSuccess(null);

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/football/news/${articleId}/comments/${parentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        setReplyText((prev) => ({ ...prev, [parentId]: '' }));
        setActiveReplyId(null);
        setSuccess('Reply published successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to submit reply.');
      }
    } catch (err) {
      setError('Network connection error. Failed to post reply.');
    }
  };

  // Helper to check if the user has already replied to this parent thread
  const hasUserReplied = (parentComment: Comment): boolean => {
    if (!user) return false;
    const replies = parentComment.replies || [];
    return replies.some((r) => r.user.id === user.id);
  };

  return (
    <section className={styles.commentsSection} aria-label="Community Discussions">
      <h2 className={styles.sectionHeading}>
        <MessageSquare size={18} className={styles.headingIcon} />
        Community Discussions
      </h2>

      {/* Notifications */}
      {success && (
        <div className={styles.alertSuccess}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Post Top-level Comment */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className={styles.commentForm}>
          <textarea
            placeholder="Type your comment... Support community respect rules."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className={styles.commentInput}
            rows={3}
            maxLength={1000}
          />
          <div className={styles.formFooter}>
            <span className={styles.characterCount}>
              {1000 - newCommentText.length} Characters left
            </span>
            <button type="submit" className={styles.submitBtn}>
              Submit Comment
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.guestPrompt}>
          <LogIn size={20} className={styles.guestIcon} />
          <div className={styles.guestPromptMeta}>
            <h3>Want to join the discussion?</h3>
            <p>Log in or Create an Account to share your thoughts and reply to this article.</p>
          </div>
          <div className={styles.guestActions}>
            <Link href="/login" className={styles.loginBtn}>
              Log In
            </Link>
            <Link href="/register" className={styles.registerBtn}>
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.emptyComments}>No comments posted yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.commentNode}>
              {/* Parent Comment */}
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <strong className={styles.authorName}>{comment.user.name || 'Anonymous User'}</strong>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={styles.commentText}>{comment.content}</p>

                {/* Reply triggers */}
                {isAuthenticated && (
                  <div className={styles.commentActions}>
                    {hasUserReplied(comment) ? (
                      <span className={styles.repliedNotice} title="Each user is limited to exactly one reply per thread.">
                        You have already replied to this thread
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                        className={styles.replyTrigger}
                      >
                        Reply
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {activeReplyId === comment.id && (
                <div className={styles.replyBox}>
                  <CornerDownRight size={16} className={styles.replyIcon} />
                  <div className={styles.replyForm}>
                    <textarea
                      placeholder="Write your reply... (Limit: one reply per thread)"
                      value={replyText[comment.id] || ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                      className={styles.commentInput}
                      rows={2}
                      maxLength={500}
                    />
                    <div className={styles.replyActions}>
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        className={styles.submitBtnCompact}
                      >
                        Submit Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replies Thread list */}
              {comment.replies && comment.replies.length > 0 && (
                <div className={styles.repliesList}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className={styles.replyNode}>
                      <CornerDownRight size={14} className={styles.threadedLine} />
                      <div className={styles.replyBody}>
                        <div className={styles.commentMeta}>
                          <strong className={styles.authorName}>{reply.user.name || 'Anonymous User'}</strong>
                          <span className={styles.commentDate}>
                            {new Date(reply.createdAt).toLocaleDateString()} at{' '}
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={styles.commentText}>{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

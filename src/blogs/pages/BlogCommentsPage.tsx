import { useMutation, useQuery } from "@apollo/client";
import { getBlogPostPreviewUrl } from "@dashboard/config";
import { useNotifier } from "@dashboard/hooks/useNotifier";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  Eye,
  MessageSquare,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";

import {
  BLOG_COMMENT_BULK_DELETE,
  BLOG_COMMENT_BULK_UPDATE_STATUS,
  BLOG_COMMENT_DELETE,
  BLOG_COMMENT_STATUS_UPDATE,
  GET_BLOG_COMMENTS,
} from "../queries";
import type { BlogComment, BlogCommentStatus } from "../types";
import { blogAuthorsPath, blogCategoriesPath, blogListPath } from "../urls";

export const BlogCommentsPage: React.FC = () => {
  const history = useHistory();
  const notify = useNotifier();

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | BlogCommentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionId, setActionId] = useState<string | null>(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);

  // Modal for delete confirmation
  const [commentToDelete, setCommentToDelete] = useState<BlogComment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Modal for full comment detail preview
  const [previewComment, setPreviewComment] = useState<BlogComment | null>(null);

  // Apollo GraphQL queries & mutations
  const {
    data: commentsData,
    loading: queryLoading,
    refetch,
  } = useQuery(GET_BLOG_COMMENTS, {
    variables: { first: 100 },
    fetchPolicy: "network-only",
  });

  const [updateStatusMutation] = useMutation(BLOG_COMMENT_STATUS_UPDATE);
  const [bulkUpdateStatusMutation] = useMutation(BLOG_COMMENT_BULK_UPDATE_STATUS);
  const [deleteCommentMutation] = useMutation(BLOG_COMMENT_DELETE);
  const [bulkDeleteMutation] = useMutation(BLOG_COMMENT_BULK_DELETE);

  const loading = queryLoading && comments.length === 0;

  // Sync comments from Apollo query into local state
  useEffect(() => {
    if (commentsData?.blogComments?.edges) {
      const mapped: BlogComment[] = commentsData.blogComments.edges.map((edge: any) => ({
        id: edge.node.id,
        postId: edge.node.postId,
        slug: edge.node.postSlug,
        postSlug: edge.node.postSlug,
        blogTitle: edge.node.postTitle,
        postTitle: edge.node.postTitle,
        authorName: edge.node.authorName,
        authorEmail: edge.node.authorEmail || "",
        content: edge.node.content,
        status: edge.node.status,
        isPinned: edge.node.isPinned,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
      }));

      setComments(mapped);
    }
  }, [commentsData]);

  const fetchComments = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      try {
        const res = await refetch();

        if (isManualRefresh && res.data?.blogComments) {
          notify({
            status: "success",
            text: `Refreshed comments: ${res.data.blogComments.totalCount ?? res.data.blogComments.edges.length} loaded.`,
          });
        }
      } catch {
        if (isManualRefresh) {
          notify({
            status: "error",
            text: "Failed to refresh comments from API.",
          });
        }
      } finally {
        if (isManualRefresh) {
          setRefreshing(false);
        }
      }
    },
    [refetch, notify],
  );

  const handleUpdateStatus = async (id: string, status: BlogCommentStatus) => {
    setActionId(id);

    try {
      const res = await updateStatusMutation({
        variables: { id, status },
      });
      const errors = res.data?.blogCommentStatusUpdate?.errors;

      if (errors && errors.length > 0) {
        notify({
          status: "error",
          text: errors[0].message || "Failed to update comment status.",
        });
      } else {
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c)),
        );
        notify({
          status: status === "APPROVED" ? "success" : "warning",
          text: status === "APPROVED" ? "Comment approved & published live!" : "Comment rejected.",
        });
      }
    } catch (err: any) {
      notify({
        status: "error",
        text: err?.message || "Failed to update comment status.",
      });
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);

    const targetId = commentToDelete.id;

    try {
      const res = await deleteCommentMutation({
        variables: { id: targetId },
      });
      const errors = res.data?.blogCommentDelete?.errors;

      if (errors && errors.length > 0) {
        notify({
          status: "error",
          text: errors[0].message || "Failed to delete comment.",
        });
      } else {
        setComments(prev => prev.filter(c => c.id !== targetId));
        setSelectedIds(prev => prev.filter(id => id !== targetId));
        notify({
          status: "success",
          text: "Comment permanently deleted.",
        });
      }
    } catch (err: any) {
      notify({
        status: "error",
        text: err?.message || "Failed to delete comment.",
      });
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    setBulkActionLoading(true);

    try {
      const res = await bulkUpdateStatusMutation({
        variables: { ids: selectedIds, status: "APPROVED" },
      });
      const errors = res.data?.blogCommentBulkUpdateStatus?.errors;

      if (errors && errors.length > 0) {
        notify({
          status: "error",
          text: errors[0].message || "Failed to approve comments.",
        });
      } else {
        setComments(prev =>
          prev.map(c => (selectedIds.includes(c.id) ? { ...c, status: "APPROVED" } : c)),
        );
        notify({
          status: "success",
          text: `${selectedIds.length} comments approved!`,
        });
        setSelectedIds([]);
      }
    } catch (err: any) {
      notify({
        status: "error",
        text: err?.message || "Failed to bulk approve comments.",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Permanently delete ${selectedIds.length} selected comments?`)) {
      return;
    }

    setBulkActionLoading(true);

    try {
      const res = await bulkDeleteMutation({
        variables: { ids: selectedIds },
      });
      const errors = res.data?.blogCommentBulkDelete?.errors;

      if (errors && errors.length > 0) {
        notify({
          status: "error",
          text: errors[0].message || "Failed to delete comments.",
        });
      } else {
        setComments(prev => prev.filter(c => !selectedIds.includes(c.id)));
        notify({
          status: "success",
          text: `${selectedIds.length} comments deleted!`,
        });
        setSelectedIds([]);
      }
    } catch (err: any) {
      notify({
        status: "error",
        text: err?.message || "Failed to bulk delete comments.",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComments.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.authorName.toLowerCase().includes(q) ||
        c.authorEmail.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.blogTitle && c.blogTitle.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [comments, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: comments.length,
      pending: comments.filter(c => c.status === "PENDING").length,
      approved: comments.filter(c => c.status === "APPROVED").length,
      rejected: comments.filter(c => c.status === "REJECTED").length,
    };
  }, [comments]);

  const getStatusBadge = (status: BlogCommentStatus) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "#dcfce7",
          color: "#15803d",
          border: "#bbf7d0",
          label: "Live",
          dotColor: "#22c55e",
        };
      case "PENDING":
        return {
          bg: "#fef3c7",
          color: "#b45309",
          border: "#fde68a",
          label: "Pending",
          dotColor: "#f59e0b",
        };
      case "REJECTED":
        return {
          bg: "#fee2e2",
          color: "#b91c1c",
          border: "#fecaca",
          label: "Rejected",
          dotColor: "#ef4444",
        };
      default:
        return {
          bg: "#f3f4f6",
          color: "#4b5563",
          border: "#e5e7eb",
          label: status,
          dotColor: "#9ca3af",
        };
    }
  };

  return (
    <div style={{ padding: "20px 24px", maxWidth: "1500px", margin: "0 auto" }}>
      {/* Sleek Top Navigation Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => history.push(blogListPath)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              color: "#475569",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 10px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <ArrowLeft size={13} />
            Articles
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Blog Comments
            </h1>
            {counts.pending > 0 && (
              <span
                style={{
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid #fde68a",
                }}
              >
                {counts.pending} Needs Review
              </span>
            )}
          </div>
        </div>

        {/* Compact Right Navigation / Actions */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => history.push(blogCategoriesPath)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 11px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <Tag size={12} />
            Categories
          </button>

          <button
            onClick={() => history.push(blogAuthorsPath)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 11px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <Users size={12} />
            Authors
          </button>

          <button
            onClick={() => fetchComments(true)}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 11px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={12}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            Sync
          </button>
        </div>
      </div>

      {/* High-Density Stats Strip & Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginBottom: "12px",
          flexWrap: "wrap",
          gap: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("ALL")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: statusFilter === "ALL" ? "1px solid #3b82f6" : "1px solid transparent",
              backgroundColor: statusFilter === "ALL" ? "#eff6ff" : "transparent",
              color: statusFilter === "ALL" ? "#1d4ed8" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            All
            <span
              style={{
                fontSize: "10.5px",
                padding: "1px 6px",
                borderRadius: "10px",
                backgroundColor: statusFilter === "ALL" ? "#dbeafe" : "#f1f5f9",
                color: statusFilter === "ALL" ? "#1e40af" : "#64748b",
              }}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: statusFilter === "PENDING" ? "1px solid #f59e0b" : "1px solid transparent",
              backgroundColor: statusFilter === "PENDING" ? "#fffbeb" : "transparent",
              color: statusFilter === "PENDING" ? "#b45309" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Pending
            <span
              style={{
                fontSize: "10.5px",
                padding: "1px 6px",
                borderRadius: "10px",
                backgroundColor: "#fef3c7",
                color: "#92400e",
                fontWeight: 700,
              }}
            >
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("APPROVED")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: statusFilter === "APPROVED" ? "1px solid #10b981" : "1px solid transparent",
              backgroundColor: statusFilter === "APPROVED" ? "#f0fdf4" : "transparent",
              color: statusFilter === "APPROVED" ? "#15803d" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Live / Approved
            <span
              style={{
                fontSize: "10.5px",
                padding: "1px 6px",
                borderRadius: "10px",
                backgroundColor: statusFilter === "APPROVED" ? "#dcfce7" : "#f1f5f9",
                color: statusFilter === "APPROVED" ? "#166534" : "#64748b",
              }}
            >
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("REJECTED")}
            style={{
              padding: "5px 11px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: statusFilter === "REJECTED" ? "1px solid #ef4444" : "1px solid transparent",
              backgroundColor: statusFilter === "REJECTED" ? "#fef2f2" : "transparent",
              color: statusFilter === "REJECTED" ? "#b91c1c" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Rejected
            <span
              style={{
                fontSize: "10.5px",
                padding: "1px 6px",
                borderRadius: "10px",
                backgroundColor: statusFilter === "REJECTED" ? "#fee2e2" : "#f1f5f9",
                color: statusFilter === "REJECTED" ? "#991b1b" : "#64748b",
              }}
            >
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Right Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search
            size={13}
            style={{ position: "absolute", left: "9px", top: "8px", color: "#94a3b8" }}
          />
          <input
            type="text"
            placeholder="Search student, comment, blog..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "5px 28px 5px 28px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              outline: "none",
              backgroundColor: "#f8fafc",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "7px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#94a3b8",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "6px",
            marginBottom: "12px",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 600 }}>{selectedIds.length} comments selected</span>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "11px",
                textDecoration: "underline",
              }}
            >
              Deselect
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleBulkApprove}
              disabled={bulkActionLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "4px",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CheckCheck size={13} />
              Approve All
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "4px",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* High-Density Modern Table / Moderation List */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "980px" }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 170px 1fr 160px 95px 115px 175px",
                alignItems: "center",
                padding: "10px 16px",
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={
                    filteredComments.length > 0 && selectedIds.length === filteredComments.length
                  }
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer", margin: 0 }}
                />
              </div>
              <div>Student / Author</div>
              <div>Comment &amp; Question</div>
              <div>Article / Guide</div>
              <div>Status</div>
              <div>Date</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {/* Content Rows */}
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw
                  size={20}
                  style={{
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 8px",
                    display: "block",
                  }}
                />
                <span style={{ fontSize: "13px" }}>Loading comments...</span>
              </div>
            ) : filteredComments.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                <MessageSquare
                  size={32}
                  style={{ color: "#cbd5e1", margin: "0 auto 8px", display: "block" }}
                />
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                  No comments found
                </div>
                <div style={{ fontSize: "12px", marginTop: "2px" }}>
                  {statusFilter !== "ALL"
                    ? `No comments in '${statusFilter}' status.`
                    : "No student queries submitted yet."}
                </div>
              </div>
            ) : (
              <div>
                {filteredComments.map((comment, index) => {
                  const badge = getStatusBadge(comment.status);
                  const isSelected = selectedIds.includes(comment.id);

                  return (
                    <div
                      key={comment.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px 170px 1fr 160px 95px 115px 175px",
                        alignItems: "center",
                        padding: "10px 16px",
                        borderBottom:
                          index === filteredComments.length - 1 ? "none" : "1px solid #f1f5f9",
                        backgroundColor: isSelected
                          ? "#f0fdf4"
                          : comment.status === "PENDING"
                            ? "#fffdf7"
                            : "#ffffff",
                        transition: "background-color 0.1s ease",
                        fontSize: "12.5px",
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            comment.status === "PENDING" ? "#fff9e6" : "#f8fafc";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            comment.status === "PENDING" ? "#fffdf7" : "#ffffff";
                        }
                      }}
                    >
                      {/* Col 1: Select Checkbox */}
                      <div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(comment.id)}
                          style={{ cursor: "pointer", margin: 0 }}
                        />
                      </div>

                      {/* Col 2: Author Avatar & Name */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                          minWidth: 0,
                          paddingRight: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                            flexShrink: 0,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "U"}
                        </div>

                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#0f172a",
                              fontSize: "12.5px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={comment.authorName}
                          >
                            {comment.authorName}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={comment.authorEmail}
                          >
                            {comment.authorEmail}
                          </div>
                        </div>
                      </div>

                      {/* Col 3: Comment Snippet (Click to expand) */}
                      <div
                        style={{
                          paddingRight: "16px",
                          minWidth: 0,
                          cursor: "pointer",
                        }}
                        onClick={() => setPreviewComment(comment)}
                        title="Click to view full comment"
                      >
                        <div
                          style={{
                            color: "#334155",
                            fontSize: "12.5px",
                            lineHeight: "1.45",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            wordBreak: "break-word",
                          }}
                        >
                          &ldquo;{comment.content}&rdquo;
                        </div>
                      </div>

                      {/* Col 4: Linked Blog Article */}
                      <div style={{ minWidth: 0, paddingRight: "10px" }}>
                        <a
                          href={getBlogPostPreviewUrl(comment.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            color: "#2563eb",
                            textDecoration: "none",
                            backgroundColor: "#eff6ff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            maxWidth: "100%",
                          }}
                          title={comment.blogTitle || comment.slug}
                        >
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "125px",
                            }}
                          >
                            {comment.blogTitle || comment.slug}
                          </span>
                          <ExternalLink size={10} style={{ flexShrink: 0 }} />
                        </a>
                      </div>

                      {/* Col 5: Status Badge */}
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              backgroundColor: badge.dotColor,
                            }}
                          />
                          {badge.label}
                        </span>
                      </div>

                      {/* Col 6: Date */}
                      <div
                        style={{
                          fontSize: "11.5px",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {/* Col 7: Quick Action Buttons (Zero Overlap) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "5px",
                          flexShrink: 0,
                        }}
                      >
                        {/* View Modal */}
                        <button
                          onClick={() => setPreviewComment(comment)}
                          style={{
                            width: "28px",
                            height: "26px",
                            padding: 0,
                            borderRadius: "5px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#ffffff",
                            color: "#64748b",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Approve Button */}
                        {comment.status !== "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "APPROVED")}
                            disabled={actionId === comment.id}
                            style={{
                              height: "26px",
                              padding: "0 8px",
                              borderRadius: "5px",
                              backgroundColor: "#16a34a",
                              color: "#ffffff",
                              border: "none",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                            title="Approve & Publish Live"
                          >
                            <Check size={12} />
                            Approve
                          </button>
                        )}

                        {/* Reject Button */}
                        {comment.status !== "REJECTED" && (
                          <button
                            onClick={() => handleUpdateStatus(comment.id, "REJECTED")}
                            disabled={actionId === comment.id}
                            style={{
                              width: "28px",
                              height: "26px",
                              padding: 0,
                              borderRadius: "5px",
                              backgroundColor: "#ffffff",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                            title="Reject / Spam"
                          >
                            <XCircle size={13} />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setCommentToDelete(comment)}
                          disabled={actionId === comment.id}
                          style={{
                            width: "28px",
                            height: "26px",
                            padding: 0,
                            borderRadius: "5px",
                            backgroundColor: "#ffffff",
                            color: "#94a3b8",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          title="Permanently Delete"
                          onMouseEnter={e => {
                            e.currentTarget.style.color = "#dc2626";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = "#94a3b8";
                            e.currentTarget.style.borderColor = "#e2e8f0";
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Comment Quick-View Modal */}
      {previewComment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => setPreviewComment(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px 24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "14px",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  {previewComment.authorName}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {previewComment.authorEmail}
                </div>
              </div>

              <button
                onClick={() => setPreviewComment(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Article */}
            <div style={{ marginBottom: "12px", fontSize: "12px" }}>
              <span style={{ color: "#64748b", marginRight: "6px" }}>Article:</span>
              <a
                href={getBlogPostPreviewUrl(previewComment.slug)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#2563eb",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {previewComment.blogTitle || previewComment.slug}
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Comment Message */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "14px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                lineHeight: "1.6",
                color: "#1e293b",
                whiteSpace: "pre-line",
                marginBottom: "16px",
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {previewComment.content}
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Submitted:{" "}
                {new Date(previewComment.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {previewComment.status !== "APPROVED" && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(previewComment.id, "APPROVED");
                      setPreviewComment(null);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "5px",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Check size={13} />
                    Approve
                  </button>
                )}

                {previewComment.status !== "REJECTED" && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(previewComment.id, "REJECTED");
                      setPreviewComment(null);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      backgroundColor: "#ffffff",
                      color: "#b91c1c",
                      border: "1px solid #fecaca",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                )}

                <button
                  onClick={() => {
                    const c = previewComment;

                    setPreviewComment(null);
                    setCommentToDelete(c);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 10px",
                    borderRadius: "5px",
                    backgroundColor: "#ffffff",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {commentToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onClick={() => {
            if (!isDeleting) setCommentToDelete(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "20px 24px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  Delete Comment?
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  This will permanently delete this comment.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#334155",
              }}
            >
              <div style={{ fontWeight: 600 }}>{commentToDelete.authorName}</div>
              <div style={{ color: "#64748b", fontSize: "11.5px" }}>
                &ldquo;{commentToDelete.content}&rdquo;
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCommentToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "6px 14px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCommentsPage;

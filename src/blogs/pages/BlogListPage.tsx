import { useMutation, useQuery } from "@apollo/client";
import { getBlogPostPreviewUrl } from "@dashboard/config";
import { Text } from "@saleor/macaw-ui-next";
import {
  Archive,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { useHistory } from "react-router";

import {
  ARCHIVE_BLOG_POST,
  DELETE_BLOG_POST,
  DUPLICATE_BLOG_POST,
  GET_BLOG_CATEGORIES,
  GET_BLOG_POSTS,
  PUBLISH_BLOG_POST,
} from "../queries";
import type { BlogCategory, BlogPost } from "../types";
import { blogAuthorsPath, blogCategoriesPath, blogCreatePath, blogEditPath } from "../urls";

export const BlogListPage: React.FC = () => {
  const history = useHistory();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Pagination state
  const pageSize = 15;
  const [afterCursor, _setAfterCursor] = useState<string | null>(null);

  // Queries
  const {
    data: postsData,
    loading: postsLoading,
    refetch: refetchPosts,
  } = useQuery(GET_BLOG_POSTS, {
    variables: {
      filter: {
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        categorySlug: categoryFilter !== "ALL" ? categoryFilter : undefined,
      },
      first: pageSize,
      after: afterCursor,
    },
    fetchPolicy: "network-only",
  });

  const { data: categoriesData } = useQuery(GET_BLOG_CATEGORIES, {
    variables: { first: 50 },
  });

  // Mutations
  const [deletePost, { loading: deleting }] = useMutation(DELETE_BLOG_POST);
  const [duplicatePost, { loading: duplicating }] = useMutation(DUPLICATE_BLOG_POST);
  const [publishPost] = useMutation(PUBLISH_BLOG_POST);
  const [archivePost] = useMutation(ARCHIVE_BLOG_POST);

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const posts: BlogPost[] = useMemo(() => {
    return postsData?.blogPosts?.edges?.map((e: { node: BlogPost }) => e.node) || [];
  }, [postsData]);

  const totalCount: number = postsData?.blogPosts?.totalCount || 0;

  const categories: BlogCategory[] = useMemo(() => {
    return categoriesData?.blogCategories?.edges?.map((e: { node: BlogCategory }) => e.node) || [];
  }, [categoriesData]);

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      await deletePost({ variables: { id: postToDelete.id } });
      setPostToDelete(null);
      refetchPosts();
    } catch (err) {
      console.error("Error deleting blog post:", err);
    }
  };

  const handleDuplicate = async (post: BlogPost) => {
    try {
      const res = await duplicatePost({ variables: { id: post.id } });

      if (res.data?.blogPostDuplicate?.post?.id) {
        refetchPosts();
      }
    } catch (err) {
      console.error("Error duplicating post:", err);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.status === "PUBLISHED") {
        await archivePost({ variables: { id: post.id } });
      } else {
        await publishPost({ variables: { id: post.id } });
      }

      refetchPosts();
    } catch (err) {
      console.error("Error updating publication status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return {
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          label: "Published",
        };
      case "SCHEDULED":
        return {
          bg: "#fef9c3",
          color: "#854d0e",
          border: "#fef08a",
          label: "Scheduled",
        };
      case "IN_REVIEW":
        return {
          bg: "#f3e8ff",
          color: "#6b21a8",
          border: "#e9d5ff",
          label: "In Review",
        };
      case "ARCHIVED":
        return {
          bg: "#fee2e2",
          color: "#991b1b",
          border: "#fecaca",
          label: "Archived",
        };
      default:
        return {
          bg: "#f3f4f6",
          color: "#374151",
          border: "#e5e7eb",
          label: "Draft",
        };
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Text size={7} fontWeight="bold">
              Blog Articles
            </Text>
            <span
              style={{
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                padding: "2px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {totalCount} Total
            </span>
          </div>
          <Text size={3} color="default2" style={{ marginTop: "4px" }}>
            Create and manage educational articles, NEET/JEE book guides, and study strategies for
            EasyToPick.
          </Text>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => history.push(blogCategoriesPath)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <Tag size={15} />
            Categories & Tags
          </button>
          <button
            onClick={() => history.push(blogAuthorsPath)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <Users size={15} />
            Authors
          </button>
          <button
            onClick={() => history.push(blogCreatePath)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2563eb",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Plus size={16} />
            New Article
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
            backgroundColor: "#ffffff",
            color: "#374151",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
            backgroundColor: "#ffffff",
            color: "#374151",
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setCategoryFilter("ALL");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#f3f4f6",
              fontSize: "12px",
              color: "#4b5563",
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Table Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {postsLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
            <FileText size={32} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
            <Text size={3}>Loading articles...</Text>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
            <BookOpen size={40} style={{ margin: "0 auto 16px auto", color: "#9ca3af" }} />
            <Text size={4} fontWeight="bold" style={{ display: "block", marginBottom: "8px" }}>
              No blog articles found
            </Text>
            <Text
              size={2}
              color="default2"
              style={{ maxWidth: "400px", margin: "0 auto 20px auto", display: "block" }}
            >
              {searchQuery || statusFilter !== "ALL"
                ? "Try clearing your search query or filters to see available articles."
                : "Get started by creating your first educational article for EasyToPick."}
            </Text>
            <button
              onClick={() => history.push(blogCreatePath)}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#2563eb",
                fontSize: "13px",
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <Plus size={15} style={{ verticalAlign: "middle", marginRight: "4px" }} />
              Create First Article
            </button>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#4b5563",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600, width: "50px" }}>Image</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Title & Slug</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Author</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Read Time</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Published Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => {
                const badge = getStatusBadge(post.status);

                return (
                  <tr
                    key={post.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#9ca3af",
                            }}
                          >
                            <FileText size={18} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Title & Slug */}
                    <td style={{ padding: "12px 16px", maxWidth: "340px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          onClick={() => history.push(blogEditPath(post.id))}
                          style={{
                            fontWeight: 600,
                            color: "#1f2937",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          {post.title}
                        </span>
                        {post.isFeatured && (
                          <span
                            title="Featured Post"
                            style={{
                              backgroundColor: "#fef3c7",
                              color: "#b45309",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <Sparkles size={10} /> Featured
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          display: "block",
                          marginTop: "2px",
                        }}
                      >
                        /blogs/{post.slug}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 16px" }}>
                      {post.primaryCategory ? (
                        <span
                          style={{
                            backgroundColor: "#f0fdf4",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {post.primaryCategory.name}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      )}
                    </td>

                    {/* Author */}
                    <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                      {post.author?.displayName || "EasyToPick"}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Read Time */}
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={13} />
                        {post.readingTimeMinutes || 5} min
                      </div>
                    </td>

                    {/* Published Date */}
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "12px" }}>
                      {post.publishedAt ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>Not published</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          title="Edit Article"
                          onClick={() => history.push(blogEditPath(post.id))}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            color: "#374151",
                          }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          title="Preview on Storefront"
                          onClick={() => window.open(getBlogPostPreviewUrl(post.slug), "_blank")}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            color: "#374151",
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          title="Duplicate Article"
                          onClick={() => handleDuplicate(post)}
                          disabled={duplicating}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            color: "#374151",
                          }}
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          title={post.status === "PUBLISHED" ? "Archive" : "Publish"}
                          onClick={() => handleTogglePublish(post)}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            color: post.status === "PUBLISHED" ? "#b45309" : "#166534",
                          }}
                        >
                          {post.status === "PUBLISHED" ? (
                            <Archive size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                        </button>

                        <button
                          title="Delete Article"
                          onClick={() => setPostToDelete(post)}
                          style={{
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fff5f5",
                            cursor: "pointer",
                            color: "#dc2626",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <Text size={5} fontWeight="bold" style={{ display: "block", marginBottom: "8px" }}>
              Delete Article?
            </Text>
            <Text size={3} color="default2" style={{ display: "block", marginBottom: "20px" }}>
              Are you sure you want to delete <strong>&quot;{postToDelete.title}&quot;</strong>?
              This action cannot be undone.
            </Text>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setPostToDelete(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

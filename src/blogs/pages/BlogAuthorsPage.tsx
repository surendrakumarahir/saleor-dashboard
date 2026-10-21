import { useMutation, useQuery } from "@apollo/client";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Globe,
  Linkedin,
  Mail,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Twitter,
  User,
  Users,
  X,
  Youtube,
} from "lucide-react";
import * as React from "react";
import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import {
  CREATE_BLOG_AUTHOR,
  DELETE_BLOG_AUTHOR,
  GET_BLOG_AUTHORS,
  UPDATE_BLOG_AUTHOR,
} from "../queries";
import type { BlogAuthor } from "../types";
import { blogCategoriesPath, blogListPath } from "../urls";

export const BlogAuthorsPage: React.FC = () => {
  const history = useHistory();

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const {
    data: authorsData,
    loading: authorsLoading,
    refetch: refetchAuthors,
  } = useQuery(GET_BLOG_AUTHORS, {
    variables: { first: 100 },
    fetchPolicy: "network-only",
  });

  // Mutations
  const [createAuthor, { loading: creatingAuthor }] = useMutation(CREATE_BLOG_AUTHOR);
  const [updateAuthor, { loading: updatingAuthor }] = useMutation(UPDATE_BLOG_AUTHOR);
  const [deleteAuthor, { loading: deletingAuthor }] = useMutation(DELETE_BLOG_AUTHOR);

  // Modal State
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [authorForm, setAuthorForm] = useState({
    displayName: "",
    slug: "",
    designation: "",
    bio: "",
    avatar: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    website: "",
  });
  const [authorFormErrors, setAuthorFormErrors] = useState<Record<string, string>>({});
  const [authorToDelete, setAuthorToDelete] = useState<BlogAuthor | null>(null);

  // Author list
  const authors: BlogAuthor[] = useMemo(() => {
    return authorsData?.blogAuthors?.edges?.map((e: { node: BlogAuthor }) => e.node) || [];
  }, [authorsData]);

  // Filtered authors
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) return authors;
    const q = searchQuery.toLowerCase();
    return authors.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.designation?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q)
    );
  }, [authors, searchQuery]);

  // Helper: slugify
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handlers
  const openCreateAuthor = () => {
    setEditingAuthor(null);
    setAuthorForm({
      displayName: "",
      slug: "",
      designation: "",
      bio: "",
      avatar: "",
      twitter: "",
      linkedin: "",
      youtube: "",
      website: "",
    });
    setAuthorFormErrors({});
    setAuthorModalOpen(true);
  };

  const openEditAuthor = (author: BlogAuthor) => {
    setEditingAuthor(author);
    const links = (author.socialLinks as Record<string, string>) || {};
    setAuthorForm({
      displayName: author.displayName,
      slug: author.slug,
      designation: author.designation || "",
      bio: author.bio || "",
      avatar: author.avatar || "",
      twitter: links.twitter || "",
      linkedin: links.linkedin || "",
      youtube: links.youtube || "",
      website: links.website || "",
    });
    setAuthorFormErrors({});
    setAuthorModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAuthorForm((prev) => ({
      ...prev,
      displayName: val,
      slug: !editingAuthor ? slugify(val) : prev.slug,
    }));
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorFormErrors({});

    if (!authorForm.displayName.trim()) {
      setAuthorFormErrors({ displayName: "Author display name is required." });
      return;
    }

    const slug = authorForm.slug.trim() || slugify(authorForm.displayName);
    const socialLinks: Record<string, string> = {};
    if (authorForm.twitter.trim()) socialLinks.twitter = authorForm.twitter.trim();
    if (authorForm.linkedin.trim()) socialLinks.linkedin = authorForm.linkedin.trim();
    if (authorForm.youtube.trim()) socialLinks.youtube = authorForm.youtube.trim();
    if (authorForm.website.trim()) socialLinks.website = authorForm.website.trim();

    try {
      if (editingAuthor) {
        const res = await updateAuthor({
          variables: {
            id: editingAuthor.id,
            displayName: authorForm.displayName.trim(),
            slug,
            designation: authorForm.designation.trim() || null,
            bio: authorForm.bio.trim() || null,
            avatar: authorForm.avatar.trim() || null,
            socialLinks,
          },
        });

        const errors = res.data?.blogAuthorUpdate?.errors || [];
        if (errors.length > 0) {
          const errObj: Record<string, string> = {};
          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setAuthorFormErrors(errObj);
          return;
        }
      } else {
        const res = await createAuthor({
          variables: {
            displayName: authorForm.displayName.trim(),
            slug,
            designation: authorForm.designation.trim() || null,
            bio: authorForm.bio.trim() || null,
            avatar: authorForm.avatar.trim() || null,
            socialLinks,
          },
        });

        const errors = res.data?.blogAuthorCreate?.errors || [];
        if (errors.length > 0) {
          const errObj: Record<string, string> = {};
          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setAuthorFormErrors(errObj);
          return;
        }
      }

      setAuthorModalOpen(false);
      refetchAuthors();
    } catch (err: any) {
      setAuthorFormErrors({ general: err.message || "An unexpected error occurred." });
    }
  };

  const handleDeleteAuthor = async () => {
    if (!authorToDelete) return;
    try {
      await deleteAuthor({ variables: { id: authorToDelete.id } });
      setAuthorToDelete(null);
      refetchAuthors();
    } catch (err) {
      console.error("Error deleting author:", err);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 16px" }}>
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
          <button
            onClick={() => history.push(blogListPath)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "#6b7280",
              fontSize: "13px",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            <ArrowLeft size={14} /> Back to Articles
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Blog Authors
            </h1>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#e0e7ff",
                color: "#3730a3",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              {authors.length} Contributors
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            Manage educator, faculty, and academic expert profiles credited across EasyToPick articles.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => history.push(blogCategoriesPath)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Categories & Tags
          </button>
          <button
            onClick={openCreateAuthor}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Plus size={16} /> New Author
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            color="#9ca3af"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search authors by name, designation, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Authors Grid */}
      {authorsLoading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
          Loading authors...
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "48px",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <Users size={40} color="#d1d5db" style={{ margin: "0 auto 12px auto" }} />
          <p style={{ fontWeight: 600, fontSize: "15px", color: "#374151", margin: 0 }}>
            No authors found
          </p>
          <p style={{ fontSize: "13px", margin: "4px 0 16px 0" }}>
            {searchQuery ? "Try refining your search term." : "Create your first author to attribute articles."}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateAuthor}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add Author
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredAuthors.map((author) => {
            const links = (author.socialLinks as Record<string, string>) || {};
            return (
              <div
                key={author.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "12px" }}>
                    {author.avatar ? (
                      <img
                        src={author.avatar}
                        alt={author.displayName}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "2px solid #e5e7eb",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: 700,
                          flexShrink: 0,
                          border: "2px solid #dbeafe",
                        }}
                      >
                        {author.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#111827",
                          lineHeight: "1.3",
                        }}
                      >
                        {author.displayName}
                      </h3>
                      {author.designation && (
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#2563eb",
                            marginTop: "2px",
                          }}
                        >
                          {author.designation}
                        </div>
                      )}
                      <div style={{ marginTop: "4px" }}>
                        <code
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            backgroundColor: "#f3f4f6",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          @{author.slug}
                        </code>
                      </div>
                    </div>
                  </div>

                  {author.bio && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        lineHeight: "1.5",
                        margin: "0 0 14px 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {author.bio}
                    </p>
                  )}

                  {/* Social links row */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
                    {links.twitter && (
                      <a
                        href={links.twitter}
                        target="_blank"
                        rel="noreferrer"
                        title="Twitter / X"
                        style={{
                          display: "inline-flex",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#f3f4f6",
                          color: "#1da1f2",
                        }}
                      >
                        <Twitter size={14} />
                      </a>
                    )}
                    {links.linkedin && (
                      <a
                        href={links.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        title="LinkedIn"
                        style={{
                          display: "inline-flex",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#f3f4f6",
                          color: "#0a66c2",
                        }}
                      >
                        <Linkedin size={14} />
                      </a>
                    )}
                    {links.youtube && (
                      <a
                        href={links.youtube}
                        target="_blank"
                        rel="noreferrer"
                        title="YouTube"
                        style={{
                          display: "inline-flex",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#f3f4f6",
                          color: "#ef4444",
                        }}
                      >
                        <Youtube size={14} />
                      </a>
                    )}
                    {links.website && (
                      <a
                        href={links.website}
                        target="_blank"
                        rel="noreferrer"
                        title="Website"
                        style={{
                          display: "inline-flex",
                          padding: "6px",
                          borderRadius: "6px",
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                        }}
                      >
                        <Globe size={14} />
                      </a>
                    )}
                    {!links.twitter && !links.linkedin && !links.youtube && !links.website && (
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>No social links connected</span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                    borderTop: "1px solid #f3f4f6",
                    paddingTop: "12px",
                  }}
                >
                  <button
                    onClick={() => openEditAuthor(author)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                      color: "#374151",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setAuthorToDelete(author)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #fee2e2",
                      backgroundColor: "#fff5f5",
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Author Modal */}
      {authorModalOpen && (
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
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#111827" }}>
                {editingAuthor ? "Edit Author Profile" : "New Author Profile"}
              </h2>
              <button
                onClick={() => setAuthorModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {authorFormErrors.general && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {authorFormErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveAuthor}>
              {/* Display Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={authorForm.displayName}
                  onChange={handleNameChange}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: authorFormErrors.displayName ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {authorFormErrors.displayName && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>{authorFormErrors.displayName}</span>
                )}
              </div>

              {/* Slug */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                  URL Slug
                </label>
                <input
                  type="text"
                  value={authorForm.slug}
                  onChange={(e) => setAuthorForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="dr-rajesh-sharma"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: authorFormErrors.slug ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {authorFormErrors.slug && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>{authorFormErrors.slug}</span>
                )}
              </div>

              {/* Designation */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={authorForm.designation}
                  onChange={(e) => setAuthorForm((prev) => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g. Senior NEET Biology Faculty"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Avatar URL */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={authorForm.avatar}
                  onChange={(e) => setAuthorForm((prev) => ({ ...prev, avatar: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Bio */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
                  Author Bio
                </label>
                <textarea
                  rows={3}
                  value={authorForm.bio}
                  onChange={(e) => setAuthorForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Academic credentials, teaching experience, mentorship background..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Social Links Section */}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "14px",
                  marginBottom: "20px",
                }}
              >
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>
                  Social & Web Links
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={authorForm.linkedin}
                      onChange={(e) => setAuthorForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      Twitter / X URL
                    </label>
                    <input
                      type="url"
                      value={authorForm.twitter}
                      onChange={(e) => setAuthorForm((prev) => ({ ...prev, twitter: e.target.value }))}
                      placeholder="https://x.com/..."
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      YouTube Channel
                    </label>
                    <input
                      type="url"
                      value={authorForm.youtube}
                      onChange={(e) => setAuthorForm((prev) => ({ ...prev, youtube: e.target.value }))}
                      placeholder="https://youtube.com/@..."
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      Personal Website
                    </label>
                    <input
                      type="url"
                      value={authorForm.website}
                      onChange={(e) => setAuthorForm((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://easytopick.in/faculty/..."
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setAuthorModalOpen(false)}
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
                  type="submit"
                  disabled={creatingAuthor || updatingAuthor}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {creatingAuthor || updatingAuthor ? "Saving..." : editingAuthor ? "Update Author" : "Create Author"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Author Modal */}
      {authorToDelete && (
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
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111827" }}>
              Delete Author?
            </h3>
            <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              Are you sure you want to delete author <strong>&quot;{authorToDelete.displayName}&quot;</strong>? Their published articles will remain intact but without an author attribution.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setAuthorToDelete(null)}
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
                onClick={handleDeleteAuthor}
                disabled={deletingAuthor}
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
                {deletingAuthor ? "Deleting..." : "Delete Author"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BlogAuthorsPage;

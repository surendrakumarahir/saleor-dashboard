import { useMutation, useQuery } from "@apollo/client";
import { ArrowLeft, Edit, FolderTree, Hash, Plus, Search, Tag, Trash2, X } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { useHistory } from "react-router";

import {
  CREATE_BLOG_CATEGORY,
  CREATE_BLOG_TAG,
  DELETE_BLOG_CATEGORY,
  DELETE_BLOG_TAG,
  GET_BLOG_CATEGORIES,
  GET_BLOG_TAGS,
  UPDATE_BLOG_CATEGORY,
  UPDATE_BLOG_TAG,
} from "../queries";
import type { BlogCategory, BlogTag } from "../types";
import { blogAuthorsPath, blogListPath } from "../urls";

const COLOR_PRESETS = [
  "#2563eb", // Blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#dc2626", // Red
  "#0891b2", // Cyan
  "#4b5563", // Gray
];

export const BlogCategoriesPage: React.FC = () => {
  const history = useHistory();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"categories" | "tags">("categories");

  // Filter Search
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const {
    data: categoriesData,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery(GET_BLOG_CATEGORIES, {
    variables: { first: 100 },
    fetchPolicy: "network-only",
  });

  const {
    data: tagsData,
    loading: tagsLoading,
    refetch: refetchTags,
  } = useQuery(GET_BLOG_TAGS, {
    variables: { first: 100 },
    fetchPolicy: "network-only",
  });

  // Mutations
  const [createCategory, { loading: creatingCategory }] = useMutation(CREATE_BLOG_CATEGORY);
  const [updateCategory, { loading: updatingCategory }] = useMutation(UPDATE_BLOG_CATEGORY);
  const [deleteCategory, { loading: deletingCategory }] = useMutation(DELETE_BLOG_CATEGORY);

  const [createTag, { loading: creatingTag }] = useMutation(CREATE_BLOG_TAG);
  const [updateTag, { loading: updatingTag }] = useMutation(UPDATE_BLOG_TAG);
  const [deleteTag, { loading: deletingTag }] = useMutation(DELETE_BLOG_TAG);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    badgeColor: "#2563eb",
    seoTitle: "",
    seoDescription: "",
    isActive: true,
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);

  // Tag Modal State
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [tagFormErrors, setTagFormErrors] = useState<Record<string, string>>({});
  const [tagToDelete, setTagToDelete] = useState<BlogTag | null>(null);

  // Data
  const categories: BlogCategory[] = useMemo(() => {
    return categoriesData?.blogCategories?.edges?.map((e: { node: BlogCategory }) => e.node) || [];
  }, [categoriesData]);

  const tags: BlogTag[] = useMemo(() => {
    return tagsData?.blogTags?.edges?.map((e: { node: BlogTag }) => e.node) || [];
  }, [tagsData]);

  // Filtered lists
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const q = searchQuery.toLowerCase();

    return categories.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;

    const q = searchQuery.toLowerCase();

    return tags.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q),
    );
  }, [tags, searchQuery]);

  // Helpers
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Category Modal Handlers
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      parentId: "",
      badgeColor: "#2563eb",
      seoTitle: "",
      seoDescription: "",
      isActive: true,
    });
    setCategoryFormErrors({});
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parentId: cat.parentId || "",
      badgeColor: cat.badgeColor || "#2563eb",
      seoTitle: cat.seoTitle || "",
      seoDescription: cat.seoDescription || "",
      isActive: cat.isActive !== false,
    });
    setCategoryFormErrors({});
    setCategoryModalOpen(true);
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    setCategoryForm(prev => ({
      ...prev,
      name: val,
      slug: !editingCategory ? slugify(val) : prev.slug,
    }));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormErrors({});

    if (!categoryForm.name.trim()) {
      setCategoryFormErrors({ name: "Category name is required." });

      return;
    }

    const slug = categoryForm.slug.trim() || slugify(categoryForm.name);

    try {
      if (editingCategory) {
        // Prevent setting parent to itself
        if (categoryForm.parentId && categoryForm.parentId === editingCategory.id) {
          setCategoryFormErrors({ parentId: "A category cannot be its own parent." });

          return;
        }

        const res = await updateCategory({
          variables: {
            id: editingCategory.id,
            name: categoryForm.name.trim(),
            slug,
            description: categoryForm.description.trim() || null,
            parentId: categoryForm.parentId || null,
            badgeColor: categoryForm.badgeColor || null,
            seoTitle: categoryForm.seoTitle.trim() || null,
            seoDescription: categoryForm.seoDescription.trim() || null,
            isActive: categoryForm.isActive,
          },
        });

        const errors = res.data?.blogCategoryUpdate?.errors || [];

        if (errors.length > 0) {
          const errObj: Record<string, string> = {};

          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setCategoryFormErrors(errObj);

          return;
        }
      } else {
        const res = await createCategory({
          variables: {
            name: categoryForm.name.trim(),
            slug,
            description: categoryForm.description.trim() || null,
            parentId: categoryForm.parentId || null,
            badgeColor: categoryForm.badgeColor || null,
            seoTitle: categoryForm.seoTitle.trim() || null,
            seoDescription: categoryForm.seoDescription.trim() || null,
            isActive: categoryForm.isActive,
          },
        });

        const errors = res.data?.blogCategoryCreate?.errors || [];

        if (errors.length > 0) {
          const errObj: Record<string, string> = {};

          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setCategoryFormErrors(errObj);

          return;
        }
      }

      setCategoryModalOpen(false);
      refetchCategories();
    } catch (err: any) {
      setCategoryFormErrors({ general: err.message || "An unexpected error occurred." });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory({ variables: { id: categoryToDelete.id } });
      setCategoryToDelete(null);
      refetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // Tag Modal Handlers
  const openCreateTag = () => {
    setEditingTag(null);
    setTagForm({ name: "", slug: "", description: "" });
    setTagFormErrors({});
    setTagModalOpen(true);
  };

  const openEditTag = (t: BlogTag) => {
    setEditingTag(t);
    setTagForm({
      name: t.name,
      slug: t.slug,
      description: t.description || "",
    });
    setTagFormErrors({});
    setTagModalOpen(true);
  };

  const handleTagNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    setTagForm(prev => ({
      ...prev,
      name: val,
      slug: !editingTag ? slugify(val) : prev.slug,
    }));
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagFormErrors({});

    if (!tagForm.name.trim()) {
      setTagFormErrors({ name: "Tag name is required." });

      return;
    }

    const slug = tagForm.slug.trim() || slugify(tagForm.name);

    try {
      if (editingTag) {
        const res = await updateTag({
          variables: {
            id: editingTag.id,
            name: tagForm.name.trim(),
            slug,
            description: tagForm.description.trim() || null,
          },
        });

        const errors = res.data?.blogTagUpdate?.errors || [];

        if (errors.length > 0) {
          const errObj: Record<string, string> = {};

          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setTagFormErrors(errObj);

          return;
        }
      } else {
        const res = await createTag({
          variables: {
            name: tagForm.name.trim(),
            slug,
            description: tagForm.description.trim() || null,
          },
        });

        const errors = res.data?.blogTagCreate?.errors || [];

        if (errors.length > 0) {
          const errObj: Record<string, string> = {};

          errors.forEach((err: { field: string; message: string }) => {
            errObj[err.field || "general"] = err.message;
          });
          setTagFormErrors(errObj);

          return;
        }
      }

      setTagModalOpen(false);
      refetchTags();
    } catch (err: any) {
      setTagFormErrors({ general: err.message || "An unexpected error occurred." });
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await deleteTag({ variables: { id: tagToDelete.id } });
      setTagToDelete(null);
      refetchTags();
    } catch (err) {
      console.error("Error deleting tag:", err);
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
              Categories & Tags
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
              Taxonomies
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            Manage hierarchical categories for academic streams and searchable tags for EasyToPick
            articles.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => history.push(blogAuthorsPath)}
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
            Manage Authors
          </button>

          {activeTab === "categories" ? (
            <button
              onClick={openCreateCategory}
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
              <Plus size={16} /> New Category
            </button>
          ) : (
            <button
              onClick={openCreateTag}
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
              <Plus size={16} /> New Tag
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "20px",
          gap: "24px",
        }}
      >
        <button
          onClick={() => setActiveTab("categories")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 4px",
            background: "transparent",
            border: "none",
            borderBottom:
              activeTab === "categories" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "categories" ? "#2563eb" : "#6b7280",
            fontWeight: activeTab === "categories" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "-1px",
          }}
        >
          <FolderTree size={16} />
          Categories
          <span
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "10px",
              backgroundColor: activeTab === "categories" ? "#dbeafe" : "#f3f4f6",
              color: activeTab === "categories" ? "#1e40af" : "#6b7280",
            }}
          >
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tags")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 4px",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "tags" ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === "tags" ? "#2563eb" : "#6b7280",
            fontWeight: activeTab === "tags" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "-1px",
          }}
        >
          <Hash size={16} />
          Tags
          <span
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              borderRadius: "10px",
              backgroundColor: activeTab === "tags" ? "#dbeafe" : "#f3f4f6",
              color: activeTab === "tags" ? "#1e40af" : "#6b7280",
            }}
          >
            {tags.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            color="#9ca3af"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            type="text"
            placeholder={
              activeTab === "categories" ? "Search categories by name or slug..." : "Search tags..."
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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

      {/* Content Area */}
      {activeTab === "categories" ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {categoriesLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
              <FolderTree size={40} color="#d1d5db" style={{ margin: "0 auto 12px auto" }} />
              <p style={{ fontWeight: 600, fontSize: "15px", color: "#374151", margin: 0 }}>
                No categories found
              </p>
              <p style={{ fontSize: "13px", margin: "4px 0 16px 0" }}>
                {searchQuery
                  ? "Try refining your search term."
                  : "Create your first category to get started."}
              </p>
              {!searchQuery && (
                <button
                  onClick={openCreateCategory}
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
                  Create Category
                </button>
              )}
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
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Name & Color</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Parent Category</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>
                    Articles
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(cat => (
                  <tr
                    key={cat.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: cat.badgeColor || "#2563eb",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{cat.name}</div>
                          {cat.description && (
                            <div
                              style={{
                                color: "#6b7280",
                                fontSize: "12px",
                                maxWidth: "320px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <code
                        style={{
                          backgroundColor: "#f3f4f6",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#374151",
                        }}
                      >
                        /blogs/category/{cat.slug}
                      </code>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#4b5563" }}>
                      {cat.parent ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#f3f4f6",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        >
                          <FolderTree size={12} /> {cat.parent.name}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>Root</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {cat.isActive !== false ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: "#ecfdf5",
                            color: "#065f46",
                          }}
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: "#f3f4f6",
                            color: "#6b7280",
                          }}
                        >
                          Hidden
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: "#eff6ff",
                          color: "#1e40af",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {cat.postCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => openEditCategory(cat)}
                          title="Edit Category"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#ffffff",
                            color: "#374151",
                            cursor: "pointer",
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          title="Delete Category"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fff5f5",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Tags Table */
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {tagsLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
              Loading tags...
            </div>
          ) : filteredTags.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>
              <Tag size={40} color="#d1d5db" style={{ margin: "0 auto 12px auto" }} />
              <p style={{ fontWeight: 600, fontSize: "15px", color: "#374151", margin: 0 }}>
                No tags found
              </p>
              <p style={{ fontSize: "13px", margin: "4px 0 16px 0" }}>
                {searchQuery
                  ? "Try refining your search term."
                  : "Create your first tag to get started."}
              </p>
              {!searchQuery && (
                <button
                  onClick={openCreateTag}
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
                  Create Tag
                </button>
              )}
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
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Tag Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Slug</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600 }}>Description</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "center" }}>
                    Articles
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map(tag => (
                  <tr
                    key={tag.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        <Hash size={13} color="#6b7280" /> {tag.name}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <code
                        style={{
                          backgroundColor: "#f3f4f6",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          color: "#374151",
                        }}
                      >
                        /blogs/tag/{tag.slug}
                      </code>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                      {tag.description || <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: "#eff6ff",
                          color: "#1e40af",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {tag.postCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => openEditTag(tag)}
                          title="Edit Tag"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#ffffff",
                            color: "#374151",
                            cursor: "pointer",
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setTagToDelete(tag)}
                          title="Delete Tag"
                          style={{
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fff5f5",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Category Modal (Create / Edit) */}
      {categoryModalOpen && (
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
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={() => setCategoryModalOpen(false)}
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

            {categoryFormErrors.general && (
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
                {categoryFormErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveCategory}>
              {/* Category Name */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={handleCategoryNameChange}
                  placeholder="e.g. NEET Books & Exam Guides"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: categoryFormErrors.name ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {categoryFormErrors.name && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>
                    {categoryFormErrors.name}
                  </span>
                )}
              </div>

              {/* Slug */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  URL Slug
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="neet-books-exam-guides"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: categoryFormErrors.slug ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {categoryFormErrors.slug && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>
                    {categoryFormErrors.slug}
                  </span>
                )}
              </div>

              {/* Parent Category with Circular Reference Protection */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Parent Category (Optional)
                </label>
                <select
                  value={categoryForm.parentId}
                  onChange={e => setCategoryForm(prev => ({ ...prev, parentId: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: categoryFormErrors.parentId ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">None (Top-level category)</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                {categoryFormErrors.parentId && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>
                    {categoryFormErrors.parentId}
                  </span>
                )}
              </div>

              {/* Badge Color Selector */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Badge Accent Color
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
                >
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, badgeColor: color }))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        backgroundColor: color,
                        border:
                          categoryForm.badgeColor === color
                            ? "3px solid #111827"
                            : "1px solid rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                  <input
                    type="text"
                    value={categoryForm.badgeColor}
                    onChange={e =>
                      setCategoryForm(prev => ({ ...prev, badgeColor: e.target.value }))
                    }
                    style={{
                      width: "80px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={e =>
                    setCategoryForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Summary of this stream or academic section..."
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

              {/* Active Toggle */}
              <div
                style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={categoryForm.isActive}
                  onChange={e => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label
                  htmlFor="isActiveToggle"
                  style={{ fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}
                >
                  Active and visible on public storefront
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
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
                  disabled={creatingCategory || updatingCategory}
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
                  {creatingCategory || updatingCategory
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {categoryToDelete && (
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
            <h3
              style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111827" }}
            >
              Delete Category?
            </h3>
            <p
              style={{
                color: "#4b5563",
                fontSize: "14px",
                lineHeight: "1.5",
                margin: "0 0 20px 0",
              }}
            >
              Are you sure you want to delete category{" "}
              <strong>&quot;{categoryToDelete.name}&quot;</strong>? Articles assigned to this
              category will not be deleted, but will become uncategorized.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setCategoryToDelete(null)}
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
                onClick={handleDeleteCategory}
                disabled={deletingCategory}
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
                {deletingCategory ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal (Create / Edit) */}
      {tagModalOpen && (
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
              maxWidth: "480px",
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
                {editingTag ? "Edit Tag" : "New Tag"}
              </h2>
              <button
                onClick={() => setTagModalOpen(false)}
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

            {tagFormErrors.general && (
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
                {tagFormErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveTag}>
              {/* Tag Name */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Tag Name *
                </label>
                <input
                  type="text"
                  required
                  value={tagForm.name}
                  onChange={handleTagNameChange}
                  placeholder="e.g. Organic Chemistry"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: tagFormErrors.name ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {tagFormErrors.name && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>{tagFormErrors.name}</span>
                )}
              </div>

              {/* Tag Slug */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  URL Slug
                </label>
                <input
                  type="text"
                  value={tagForm.slug}
                  onChange={e => setTagForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="organic-chemistry"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: tagFormErrors.slug ? "1px solid #ef4444" : "1px solid #d1d5db",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
                {tagFormErrors.slug && (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>{tagFormErrors.slug}</span>
                )}
              </div>

              {/* Tag Description */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={tagForm.description}
                  onChange={e => setTagForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief context for this topic tag..."
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setTagModalOpen(false)}
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
                  disabled={creatingTag || updatingTag}
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
                  {creatingTag || updatingTag
                    ? "Saving..."
                    : editingTag
                      ? "Update Tag"
                      : "Create Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Tag Modal */}
      {tagToDelete && (
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
            <h3
              style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 12px 0", color: "#111827" }}
            >
              Delete Tag?
            </h3>
            <p
              style={{
                color: "#4b5563",
                fontSize: "14px",
                lineHeight: "1.5",
                margin: "0 0 20px 0",
              }}
            >
              Are you sure you want to delete tag <strong>&quot;#{tagToDelete.name}&quot;</strong>?
              It will be removed from all associated articles.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setTagToDelete(null)}
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
                onClick={handleDeleteTag}
                disabled={deletingTag}
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
                {deletingTag ? "Deleting..." : "Delete Tag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BlogCategoriesPage;

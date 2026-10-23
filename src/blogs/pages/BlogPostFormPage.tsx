import { useMutation, useQuery } from "@apollo/client";
import { getBlogPostPreviewUrl, getStorefrontUrl } from "@dashboard/config";
import { Text } from "@saleor/macaw-ui-next";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Eye,
  History,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router";

import {
  CREATE_BLOG_POST,
  GET_BLOG_AUTHORS,
  GET_BLOG_CATEGORIES,
  GET_BLOG_POST,
  GET_BLOG_REVISIONS,
  GET_BLOG_TAGS,
  RESTORE_BLOG_REVISION,
  SCHEDULE_BLOG_POST,
  UPDATE_BLOG_POST,
  UPLOAD_BLOG_MEDIA,
} from "../queries";
import type {
  BlogAuthor,
  BlogCategory,
  BlogPost,
  BlogPostRevision,
  BlogTag,
  RecommendedBook,
} from "../types";
import { blogListPath } from "../urls";

export const BlogPostFormPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id && id !== "new");

  const storefrontHost = useMemo(() => {
    try {
      return new URL(getStorefrontUrl()).host;
    } catch {
      return "easytopick.in";
    }
  }, []);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("DRAFT");
  const [authorId, setAuthorId] = useState<string>("");
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string>("");
  const [featuredImageCaption, setFeaturedImageCaption] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [allowComments, setAllowComments] = useState<boolean>(false);

  // SEO State
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [robotsFollow, setRobotsFollow] = useState(true);
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Recommended Books State
  const [recommendedBooks, setRecommendedBooks] = useState<RecommendedBook[]>([]);
  const [newBook, setNewBook] = useState<RecommendedBook>({
    title: "",
    subtitle: "",
    price: "",
    originalPrice: "",
    discountBadge: "",
    href: "",
    image: "",
    badge: "",
  });
  const [showAddBook, setShowAddBook] = useState(false);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // Revisions modal state
  const [revisionsModalOpen, setRevisionsModalOpen] = useState(false);

  // Notice & error state
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const {
    data: postData,
    loading: postLoading,
    refetch: refetchPost,
  } = useQuery(GET_BLOG_POST, {
    variables: { id: isEdit ? id : undefined },
    skip: !isEdit,
    fetchPolicy: "network-only",
  });

  const { data: categoriesData } = useQuery(GET_BLOG_CATEGORIES, {
    variables: { first: 50 },
  });

  const { data: authorsData } = useQuery(GET_BLOG_AUTHORS, {
    variables: { first: 50 },
  });

  const { data: tagsData } = useQuery(GET_BLOG_TAGS, {
    variables: { first: 100 },
  });

  const { data: revisionsData, refetch: refetchRevisions } = useQuery(GET_BLOG_REVISIONS, {
    variables: { postId: isEdit ? id : "" },
    skip: !isEdit,
  });

  // Mutations
  const [createPost, { loading: creating }] = useMutation(CREATE_BLOG_POST);
  const [updatePost, { loading: updating }] = useMutation(UPDATE_BLOG_POST);
  const [schedulePost, { loading: scheduling }] = useMutation(SCHEDULE_BLOG_POST);
  const [restoreRevision, { loading: restoring }] = useMutation(RESTORE_BLOG_REVISION);
  const [uploadMedia, { loading: uploadingImage }] = useMutation(UPLOAD_BLOG_MEDIA);

  // Populate data when editing
  useEffect(() => {
    if (postData?.blogPost) {
      const p: BlogPost = postData.blogPost;

      setTitle(p.title || "");
      setSlug(p.slug || "");
      setIsSlugManual(true);
      setExcerpt(p.excerpt || "");
      setContent(p.contentHtml || p.content || "");
      setStatus(p.status || "DRAFT");
      setAuthorId(p.author?.id || "");
      setPrimaryCategoryId(p.primaryCategory?.id || "");
      setFeaturedImage(p.featuredImage || "");
      setFeaturedImageAlt(p.featuredImageAlt || "");
      setFeaturedImageCaption(p.featuredImageCaption || "");
      setIsFeatured(Boolean(p.isFeatured));
      setAllowComments(Boolean(p.allowComments));
      setSeoTitle(p.seoTitle || "");
      setSeoDescription(p.seoDescription || "");
      setCanonicalUrl(p.canonicalUrl || "");
      setRobotsIndex(p.robotsIndex !== false);
      setRobotsFollow(p.robotsFollow !== false);
      setOgTitle(p.ogTitle || "");
      setOgDescription(p.ogDescription || "");
      setOgImage(p.ogImage || "");

      if (Array.isArray(p.tags)) {
        setSelectedTags(p.tags.map(t => t.name));
      }

      if (Array.isArray(p.recommendedBooks)) {
        setRecommendedBooks(p.recommendedBooks);
      }
    }
  }, [postData]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);

    if (!isSlugManual) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      setSlug(generated);
    }
  };

  // Word count and reading time
  const wordCount = useMemo(() => {
    const plain = content.replace(/<[^>]*>/g, " ").trim();

    return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  }, [content]);

  const readingTimeEstimate = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200)) || 3;
  }, [wordCount]);

  const categories: BlogCategory[] = useMemo(() => {
    return categoriesData?.blogCategories?.edges?.map((e: { node: BlogCategory }) => e.node) || [];
  }, [categoriesData]);

  const authors: BlogAuthor[] = useMemo(() => {
    return authorsData?.blogAuthors?.edges?.map((e: { node: BlogAuthor }) => e.node) || [];
  }, [authorsData]);

  const _availableTags: BlogTag[] = useMemo(() => {
    return tagsData?.blogTags?.edges?.map((e: { node: BlogTag }) => e.node) || [];
  }, [tagsData]);

  const revisions: BlogPostRevision[] = useMemo(() => {
    return revisionsData?.blogPostRevisions || [];
  }, [revisionsData]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const res = await uploadMedia({
        variables: { file, folder: "posts" },
      });
      const data = res.data?.uploadBlogMedia;

      if (data?.fileUrl) {
        setFeaturedImage(data.fileUrl);
        setSaveSuccessNotice("Image uploaded successfully!");
        setTimeout(() => setSaveSuccessNotice(null), 3000);
      } else if (data?.errors?.length > 0) {
        setErrorMessage(data.errors[0].message);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Handle Tag Addition
  const handleAddTag = () => {
    const trimmed = tagInput.trim();

    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName));
  };

  // Handle Recommended Books
  const handleAddBook = () => {
    if (!newBook.title.trim()) return;

    setRecommendedBooks([...recommendedBooks, { ...newBook }]);
    setNewBook({
      title: "",
      subtitle: "",
      price: "",
      originalPrice: "",
      discountBadge: "",
      href: "",
      image: "",
      badge: "",
    });
    setShowAddBook(false);
  };

  const handleRemoveBook = (index: number) => {
    setRecommendedBooks(recommendedBooks.filter((_, i) => i !== index));
  };

  // Save Post
  const handleSave = async (overrideStatus?: string) => {
    setErrorMessage(null);
    setSaveSuccessNotice(null);

    if (!title.trim()) {
      setErrorMessage("Please enter an article title.");

      return;
    }

    const postStatus = overrideStatus || status;

    const inputData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content,
      contentHtml: content,
      status: postStatus,
      authorId: authorId || undefined,
      primaryCategoryId: primaryCategoryId || undefined,
      featuredImage: featuredImage !== undefined ? featuredImage || "" : undefined,
      featuredImageAlt: featuredImageAlt || undefined,
      featuredImageCaption: featuredImageCaption || undefined,
      isFeatured: isFeatured,
      allowComments: allowComments,
      readingTimeMinutes: readingTimeEstimate,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      robotsIndex: robotsIndex,
      robotsFollow: robotsFollow,
      ogTitle: ogTitle.trim() || seoTitle.trim() || title.trim(),
      ogDescription: ogDescription.trim() || seoDescription.trim() || excerpt.trim(),
      ogImage: ogImage || featuredImage || undefined,
      recommendedBooks: recommendedBooks.length > 0 ? recommendedBooks : undefined,
    };

    try {
      if (isEdit && id) {
        const res = await updatePost({
          variables: { id, input: inputData },
        });
        const errors = res.data?.blogPostUpdate?.errors;

        if (errors && errors.length > 0) {
          setErrorMessage(errors[0].message);

          return;
        }

        const updatedPost = res.data?.blogPostUpdate?.post;

        if (updatedPost?.featuredImage !== undefined) {
          setFeaturedImage(updatedPost.featuredImage || "");
        }

        setStatus(postStatus);

        const notice =
          overrideStatus === "PUBLISHED"
            ? "Article published live to storefront!"
            : overrideStatus === "SCHEDULED"
              ? "Article scheduled successfully!"
              : "Article saved successfully!";

        setSaveSuccessNotice(notice);
        refetchPost();
        refetchRevisions();
        setTimeout(() => setSaveSuccessNotice(null), 3500);
      } else {
        const res = await createPost({
          variables: { input: inputData },
        });
        const errors = res.data?.blogPostCreate?.errors;

        if (errors && errors.length > 0) {
          setErrorMessage(errors[0].message);

          return;
        }

        const newId = res.data?.blogPostCreate?.post?.id;

        if (newId) {
          history.push(`/blogs/${newId}`);
        } else {
          history.push(blogListPath);
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save article.");
    }
  };

  const handlePublishNow = async () => {
    await handleSave("PUBLISHED");
  };

  const handleScheduleSubmit = async () => {
    if (!scheduledDate) return;

    setScheduleModalOpen(false);
    await handleSave("SCHEDULED");

    if (isEdit && id) {
      try {
        await schedulePost({
          variables: { id, scheduledAt: new Date(scheduledDate).toISOString() },
        });
        refetchPost();
      } catch (err: any) {
        setErrorMessage(err.message || "Schedule failed.");
      }
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!id) return;

    try {
      await restoreRevision({ variables: { id, revisionId: revId } });
      setRevisionsModalOpen(false);
      setSaveSuccessNotice("Revision restored successfully!");
      refetchPost();
      refetchRevisions();
      setTimeout(() => setSaveSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to restore revision.");
    }
  };

  if (isEdit && postLoading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
        <Text size={3}>Loading article details...</Text>
      </div>
    );
  }

  const isSaving = creating || updating || scheduling;

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => history.push(blogListPath)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#4b5563",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <Text size={6} fontWeight="bold">
              {isEdit ? "Edit Article" : "Create New Article"}
            </Text>
            {isEdit && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginLeft: "8px",
                }}
              >
                /blogs/{slug}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {isEdit && (
            <>
              <button
                type="button"
                onClick={() => setRevisionsModalOpen(true)}
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
                <History size={14} />
                Revisions ({revisions.length})
              </button>

              <button
                type="button"
                onClick={() => window.open(getBlogPostPreviewUrl(slug), "_blank")}
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
                <Eye size={14} />
                Preview
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <Save size={14} />
            Save Draft
          </button>

          <button
            type="button"
            onClick={handlePublishNow}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#16a34a",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            }}
          >
            <Send size={14} />
            {isEdit && status === "PUBLISHED" ? "Update Published" : "Publish Live"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessNotice && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "6px",
            color: "#065f46",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <CheckCircle size={16} />
          {saveSuccessNotice}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#991b1b",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {/* Two-Column Editor Layout: Main Content (8 cols) & Sidebar (4 cols) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Article Body & SEO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Card 1: Basic Information */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Text size={4} fontWeight="bold" style={{ display: "block", marginBottom: "16px" }}>
              General Information
            </Text>

            {/* Title */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Article Title <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Guide to NEET 2026: Recommended Books & Physics Strategy"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "15px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* Slug */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                <span>Article URL Slug</span>
                {isSlugManual && (
                  <span
                    onClick={() => {
                      setIsSlugManual(false);
                      handleTitleChange(title);
                    }}
                    style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }}
                  >
                    Reset from Title
                  </span>
                )}
              </label>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRight: "none",
                    borderRadius: "6px 0 0 6px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {storefrontHost}/blogs/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => {
                    setIsSlugManual(true);
                    setSlug(e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "0 6px 6px 0",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Article Excerpt / Summary
              </label>
              <textarea
                rows={3}
                placeholder="Short hook and introduction summarizing key takeaways for students..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Card 2: Article Content Editor */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <Text size={4} fontWeight="bold">
                Article Content
              </Text>
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#6b7280" }}>
                <span>
                  <strong>{wordCount}</strong> words
                </span>
                <span>•</span>
                <span>
                  ~<strong>{readingTimeEstimate}</strong> min read
                </span>
              </div>
            </div>

            {/* Quick HTML/Markdown Tag Bar */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                marginBottom: "10px",
                padding: "8px",
                backgroundColor: "#f9fafb",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              {[
                { label: "H2", tag: "<h2>Heading</h2>\n" },
                { label: "H3", tag: "<h3>Subheading</h3>\n" },
                { label: "Bold", tag: "<strong>Bold Text</strong>" },
                { label: "Italic", tag: "<em>Italic Text</em>" },
                {
                  label: "Bullet List",
                  tag: "<ul>\n  <li>Point 1</li>\n  <li>Point 2</li>\n</ul>\n",
                },
                { label: "Quote", tag: '<blockquote>"Kota faculty tip..."</blockquote>\n' },
                { label: "Paragraph", tag: "<p>Write detailed explanation here...</p>\n" },
              ].map(btn => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => setContent(prev => prev + btn.tag)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <textarea
              rows={18}
              placeholder="Write or paste rich HTML article content here. Headings (<h2>, <h3>), paragraphs (<p>), quotes (<blockquote>), and lists (<ul>, <li>) are cleanly rendered."
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                fontFamily: "monospace",
                lineHeight: "1.6",
                outline: "none",
              }}
            />
          </div>

          {/* Card 3: Recommended Books (E-commerce Integration) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
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
              <div>
                <Text size={4} fontWeight="bold">
                  Recommended Books & Learning Materials
                </Text>
                <Text size={2} color="default2" style={{ display: "block", marginTop: "2px" }}>
                  Link educational books directly to promote relevant textbook purchases inside the
                  article.
                </Text>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBook(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Book
              </button>
            </div>

            {/* Book List */}
            {recommendedBooks.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  color: "#6b7280",
                }}
              >
                <BookOpen size={24} style={{ margin: "0 auto 6px auto", opacity: 0.5 }} />
                <span style={{ fontSize: "12px" }}>
                  No recommended books added yet. Click &quot;+ Add Book&quot; above.
                </span>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {recommendedBooks.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: "#1f2937" }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>
                        {b.subtitle || b.href}
                      </span>
                      {b.price && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontWeight: 700,
                            color: "#16a34a",
                            fontSize: "12px",
                          }}
                        >
                          {b.price}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(idx)}
                      style={{
                        border: "none",
                        backgroundColor: "transparent",
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Book Form Modal/Inline */}
            {showAddBook && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  backgroundColor: "#f0fdf4",
                  borderRadius: "6px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <Text
                  size={3}
                  fontWeight="bold"
                  style={{ display: "block", marginBottom: "12px", color: "#166534" }}
                >
                  Add Book Recommendation
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Book Title *"
                    value={newBook.title}
                    onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Subtitle (e.g. Arihant Publications)"
                    value={newBook.subtitle}
                    onChange={e => setNewBook({ ...newBook, subtitle: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Selling Price (e.g. ₹1,240)"
                    value={newBook.price}
                    onChange={e => setNewBook({ ...newBook, price: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Storefront Link (e.g. /products/dc-pandey)"
                    value={newBook.href}
                    onChange={e => setNewBook({ ...newBook, href: e.target.value })}
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddBook(false)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#fff",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBook}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "#16a34a",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save Book
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Technical SEO & Search Preview */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Text size={4} fontWeight="bold" style={{ display: "block", marginBottom: "16px" }}>
              Technical Search Engine Optimization (SEO)
            </Text>

            {/* Live Google Snippet Preview */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Google Search Result Preview
              </span>
              <div
                style={{
                  fontSize: "12px",
                  color: "#202124",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{storefrontHost}</span>
                <span>›</span>
                <span style={{ color: "#5f6368" }}>blogs › {slug || "your-article-slug"}</span>
              </div>
              <div
                style={{
                  fontSize: "18px",
                  color: "#1a0dab",
                  fontWeight: 500,
                  marginTop: "2px",
                  cursor: "pointer",
                }}
              >
                {seoTitle || title || "Your Article Title Goes Here"}
              </div>
              <div
                style={{ fontSize: "13px", color: "#4d5156", marginTop: "3px", lineHeight: "1.4" }}
              >
                {seoDescription ||
                  excerpt ||
                  "This is how your article description will appear in Google and search engine index results..."}
              </div>
            </div>

            {/* SEO Title Input */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                <span>SEO Page Title</span>
                <span style={{ color: (seoTitle || title).length > 60 ? "#d97706" : "#6b7280" }}>
                  {(seoTitle || title).length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                placeholder={title || "SEO optimized title..."}
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* SEO Description Input */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                <span>SEO Meta Description</span>
                <span
                  style={{
                    color: (seoDescription || excerpt).length > 160 ? "#d97706" : "#6b7280",
                  }}
                >
                  {(seoDescription || excerpt).length} / 160 characters
                </span>
              </div>
              <textarea
                rows={3}
                placeholder={excerpt || "Compelling summary for Google search result clicks..."}
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* Canonical URL & Robots */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Canonical URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`${getStorefrontUrl()}/blogs/...`}
                  value={canonicalUrl}
                  onChange={e => setCanonicalUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", gap: "20px", alignItems: "center", paddingTop: "20px" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={robotsIndex}
                    onChange={e => setRobotsIndex(e.target.checked)}
                  />
                  <span>Index (Google Searchable)</span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={robotsFollow}
                    onChange={e => setRobotsFollow(e.target.checked)}
                  />
                  <span>Follow Links</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Publishing, Organization & Media (Sidebar) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Sidebar Card 1: Publication Status */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "20px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Text size={3} fontWeight="bold" style={{ display: "block", marginBottom: "12px" }}>
              Publication Status
            </Text>

            <div style={{ marginBottom: "16px" }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {status === "SCHEDULED" && (
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #fef08a",
                  backgroundColor: "#fefce8",
                  color: "#854d0e",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                <Calendar size={14} /> Schedule Date & Time
              </button>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
              />
              <span style={{ fontWeight: 600 }}>Feature on Homepage / Spotlight</span>
            </label>
          </div>

          {/* Sidebar Card 2: Organization (Author, Category, Tags) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "20px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Text size={3} fontWeight="bold" style={{ display: "block", marginBottom: "16px" }}>
              Organization
            </Text>

            {/* Author */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Author Profile
              </label>
              <select
                value={authorId}
                onChange={e => setAuthorId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">Select Author...</option>
                {authors.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.displayName} ({a.designation || "Author"})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Primary Category
              </label>
              <select
                value={primaryCategoryId}
                onChange={e => setPrimaryCategoryId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "13px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Article Tags
              </label>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. NEET 2026"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    fontSize: "12px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>

              {/* Tag Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    #{tag}
                    <X
                      size={11}
                      onClick={() => handleRemoveTag(tag)}
                      style={{ cursor: "pointer", color: "#6b7280" }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Card 3: Featured Cover Image */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "20px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Text size={3} fontWeight="bold" style={{ display: "block", marginBottom: "12px" }}>
              Featured Cover Image
            </Text>

            {/* Image Preview Box */}
            <div
              style={{
                width: "100%",
                height: "160px",
                borderRadius: "6px",
                border: "1px dashed #d1d5db",
                overflow: "hidden",
                backgroundColor: "#f9fafb",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                position: "relative",
              }}
            >
              {featuredImage ? (
                <>
                  <img
                    src={featuredImage}
                    alt={featuredImageAlt || "Cover Preview"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "#9ca3af" }}>
                  <ImageIcon size={32} style={{ margin: "0 auto 6px auto", opacity: 0.6 }} />
                  <span style={{ fontSize: "11px", display: "block" }}>No image selected</span>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              <UploadCloud size={14} />
              {uploadingImage ? "Uploading..." : "Upload New Image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: "none" }}
              />
            </label>

            {/* Image URL fallback */}
            <div style={{ marginBottom: "10px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Or Image URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={featuredImage}
                onChange={e => setFeaturedImage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Alt text */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                Image Alt Text
              </label>
              <input
                type="text"
                placeholder="Descriptive alt text for accessibility..."
                value={featuredImageAlt}
                onChange={e => setFeaturedImageAlt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Publication Modal */}
      {scheduleModalOpen && (
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
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <Text size={5} fontWeight="bold" style={{ display: "block", marginBottom: "8px" }}>
              Schedule Article Publication
            </Text>
            <Text size={2} color="default2" style={{ display: "block", marginBottom: "16px" }}>
              Choose the date and time when this article should automatically go live on the
              storefront.
            </Text>

            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
                marginBottom: "20px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                style={{
                  padding: "8px 14px",
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
                type="button"
                onClick={handleScheduleSubmit}
                disabled={!scheduledDate || scheduling}
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
                {scheduling ? "Scheduling..." : "Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisions History Modal */}
      {revisionsModalOpen && (
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
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
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
              <Text size={5} fontWeight="bold">
                Article Revision History
              </Text>
              <button
                type="button"
                onClick={() => setRevisionsModalOpen(false)}
                style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {revisions.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b7280" }}>No past revisions available yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {revisions.map(rev => (
                  <div
                    key={rev.id}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "13px" }}>
                          Revision #{rev.revisionNumber}
                        </span>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px" }}>
                        {rev.title} {rev.createdByName ? `• by ${rev.createdByName}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      disabled={restoring}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#2563eb",
                        cursor: "pointer",
                      }}
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

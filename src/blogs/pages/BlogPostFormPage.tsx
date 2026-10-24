import { useMutation, useQuery } from "@apollo/client";
import { getBlogPostPreviewUrl, getStorefrontUrl } from "@dashboard/config";
import { Text } from "@saleor/macaw-ui-next";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  HelpCircle,
  History,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
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
  SEARCH_PRODUCTS_FOR_BLOG,
  UPDATE_BLOG_POST,
  UPLOAD_BLOG_MEDIA,
} from "../queries";
import type {
  BlogAuthor,
  BlogCategory,
  BlogCollectionProduct,
  BlogPost,
  BlogPostFAQ,
  BlogPostRevision,
  BlogProductCollection,
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

  // Product Collections State (Dynamic Collections with Real Catalog Products)
  const [productCollections, setProductCollections] = useState<BlogProductCollection[]>([]);

  // Product Picker Modal State
  const [pickerCollectionId, setPickerCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Debounce search: only trigger catalog search when query is empty (initial) OR more than 2 characters
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length === 0) {
      setDebouncedSearchQuery("");

      return;
    }

    if (trimmed.length <= 2) {
      // Don't search if 1 or 2 characters are typed
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // FAQ State
  const [faqs, setFaqs] = useState<BlogPostFAQ[]>([]);

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

  const {
    data: searchResultsData,
    loading: searchingProducts,
    error: searchProductsError,
  } = useQuery(SEARCH_PRODUCTS_FOR_BLOG, {
    variables: {
      query: debouncedSearchQuery || undefined,
      channel: "india",
    },
    skip: !pickerCollectionId,
    fetchPolicy: "network-only",
  });

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

      if (Array.isArray(p.productCollections) && p.productCollections.length > 0) {
        setProductCollections(p.productCollections);
      } else if (Array.isArray(p.recommendedBooks) && p.recommendedBooks.length > 0) {
        setProductCollections([
          {
            id: "col-default",
            name: "Recommended Books & Learning Materials",
            slug: "/collections/recommended-books",
            products: p.recommendedBooks.map((b, idx) => ({
              id: `legacy-${idx}`,
              title: b.title,
              slug: b.href?.replace(/^.*\/products\//, "") || `product-${idx}`,
              price: b.price,
              originalPrice: b.originalPrice,
              thumbnail: b.image,
              subtitle: b.subtitle,
              href: b.href,
            })),
          },
        ]);
      }

      if (Array.isArray(p.faqs)) {
        setFaqs(
          p.faqs.map(f => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder,
          })),
        );
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

  // Handle Product Collections & Picker
  const handleAddCollection = () => {
    const newId = `col-${Date.now()}`;
    const colNumber = productCollections.length + 1;

    setProductCollections(prev => [
      ...prev,
      {
        id: newId,
        name:
          prev.length === 0
            ? "Recommended Books & Learning Materials"
            : prev.length === 1
              ? "Learning Materials"
              : `Collection ${colNumber}`,
        slug:
          prev.length === 0
            ? "/collections/recommended-books"
            : prev.length === 1
              ? "/collections/learning-materials"
              : `/collections/collection-${colNumber}`,
        products: [],
      },
    ]);
  };

  const handleUpdateCollection = (colId: string, field: "name" | "slug", val: string) => {
    setProductCollections(prev => prev.map(c => (c.id === colId ? { ...c, [field]: val } : c)));
  };

  const handleRemoveCollection = (colId: string) => {
    setProductCollections(prev => prev.filter(c => c.id !== colId));
  };

  const handleRemoveProductFromCollection = (collectionId: string, productId: string) => {
    setProductCollections(prev =>
      prev.map(c => {
        if (c.id !== collectionId) return c;

        return {
          ...c,
          products: c.products.filter(p => p.id !== productId),
        };
      }),
    );
  };

  const handleOpenProductPicker = (collectionId: string) => {
    setPickerCollectionId(collectionId);
    setSearchQuery("");
    setDebouncedSearchQuery("");

    const targetCol = productCollections.find(c => c.id === collectionId);

    setSelectedProductIds(new Set(targetCol?.products.map(p => p.id) || []));
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  };

  const handleConfirmAddProducts = () => {
    if (!pickerCollectionId) return;

    const currentResults = (searchResultsData?.products?.edges || []).map(
      (e: { node: any }) => e.node,
    );

    setProductCollections(prev =>
      prev.map(col => {
        if (col.id !== pickerCollectionId) return col;

        const existingMap = new Map<string, BlogCollectionProduct>(
          col.products.map(p => [p.id, p]),
        );
        const updatedList: BlogCollectionProduct[] = [];

        // Preserve already added products that remain selected
        col.products.forEach(p => {
          if (selectedProductIds.has(p.id)) {
            updatedList.push(p);
          }
        });

        // Add newly checked products from the search results
        currentResults.forEach((prod: any) => {
          if (selectedProductIds.has(prod.id) && !existingMap.has(prod.id)) {
            const priceGross = prod.pricing?.priceRange?.start?.gross;
            const formattedPrice = priceGross ? `₹${Math.round(priceGross.amount)}` : "";
            const newProduct: BlogCollectionProduct = {
              id: prod.id,
              title: prod.name,
              slug: prod.slug,
              price: formattedPrice,
              thumbnail: prod.thumbnail?.url || "",
              subtitle: prod.category?.name || "",
              href: `/products/${prod.slug}`,
            };

            updatedList.push(newProduct);
            existingMap.set(prod.id, newProduct);
          }
        });

        return { ...col, products: updatedList };
      }),
    );

    setPickerCollectionId(null);
  };

  // Handle FAQs
  const handleAddFaq = () => {
    setFaqs(prev => [...prev, { question: "", answer: "", sortOrder: prev.length }]);
  };

  const handleUpdateFaq = (index: number, field: "question" | "answer", value: string) => {
    setFaqs(prev => {
      const updated = [...prev];

      updated[index] = { ...updated[index], [field]: value };

      return updated;
    });
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    setFaqs(prev => {
      const updated = [...prev];
      const temp = updated[index];

      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;

      return updated.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
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

    const flattenedBooks: RecommendedBook[] = productCollections.flatMap(col =>
      col.products.map(p => ({
        title: p.title,
        subtitle: p.subtitle || col.name,
        price: p.price,
        originalPrice: p.originalPrice,
        href: p.href || `/products/${p.slug}`,
        image: p.thumbnail,
      })),
    );

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
      productCollections: productCollections.length > 0 ? productCollections : undefined,
      recommendedBooks: flattenedBooks.length > 0 ? flattenedBooks : undefined,
      faqs: faqs
        .filter(f => f.question.trim() || f.answer.trim())
        .map((f, idx) => ({
          id: f.id,
          question: f.question.trim(),
          answer: f.answer.trim(),
          sortOrder: idx,
        })),
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

          {/* Card 3: Dynamic Product Collections & Book Recommendations */}
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
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="#059669" />
                  <Text size={4} fontWeight="bold">
                    Product Collections & Recommendations
                  </Text>
                </div>
                <Text size={2} color="default2" style={{ display: "block", marginTop: "4px" }}>
                  Create multiple dynamic collections (e.g. &quot;Recommended Books&quot;,
                  &quot;Learning Materials&quot;). Each collection has its own title, slug URL, and
                  real products selected from your store catalog.
                </Text>
              </div>

              <button
                type="button"
                onClick={handleAddCollection}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "1px solid #059669",
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Collection
              </button>
            </div>

            {/* Empty State */}
            {productCollections.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px dashed #d1d5db",
                  color: "#6b7280",
                }}
              >
                <Package size={32} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                    margin: "0 0 4px 0",
                  }}
                >
                  No product collections added yet
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 16px 0" }}>
                  Add collections to showcase relevant textbooks, practice books, or study materials
                  inside this article.
                </p>
                <button
                  type="button"
                  onClick={handleAddCollection}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Add First Collection
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {productCollections.map((col, colIdx) => (
                  <div
                    key={col.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      backgroundColor: "#fafafa",
                      padding: "16px",
                    }}
                  >
                    {/* Collection Top Bar */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          Collection #{colIdx + 1}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          {col.products.length} {col.products.length === 1 ? "product" : "products"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenProductPicker(col.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #16a34a",
                            backgroundColor: "#f0fdf4",
                            color: "#166534",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Package size={13} /> Select Products
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollection(col.id)}
                          title="Delete Collection"
                          style={{
                            border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Collection Metadata Fields */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#4b5563",
                            marginBottom: "4px",
                          }}
                        >
                          Collection Title *
                        </label>
                        <input
                          type="text"
                          value={col.name}
                          onChange={e => handleUpdateCollection(col.id, "name", e.target.value)}
                          placeholder="e.g. Recommended Books & Learning Materials"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#4b5563",
                            marginBottom: "4px",
                          }}
                        >
                          Collection URL / Slug
                        </label>
                        <input
                          type="text"
                          value={col.slug || ""}
                          onChange={e => handleUpdateCollection(col.id, "slug", e.target.value)}
                          placeholder="e.g. /book/recommed or /collections/learning-materials"
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    </div>

                    {/* Products Grid */}
                    {col.products.length === 0 ? (
                      <div
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px dashed #e5e7eb",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        >
                          No products added to &quot;{col.name || "this collection"}&quot; yet.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenProductPicker(col.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "5px 12px",
                            borderRadius: "4px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#2563eb",
                            cursor: "pointer",
                          }}
                        >
                          <Search size={12} /> Search & Add Real Products
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {col.products.map(prod => (
                          <div
                            key={prod.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "6px",
                              border: "1px solid #e5e7eb",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            {/* Thumbnail */}
                            {prod.thumbnail ? (
                              <img
                                src={prod.thumbnail}
                                alt={prod.title}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  border: "1px solid #f3f4f6",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "4px",
                                  backgroundColor: "#f3f4f6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#9ca3af",
                                  flexShrink: 0,
                                }}
                              >
                                <BookOpen size={18} />
                              </div>
                            )}

                            {/* Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                title={prod.title}
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#1f2937",
                                  margin: 0,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {prod.title}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginTop: "2px",
                                }}
                              >
                                {prod.subtitle && (
                                  <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                    {prod.subtitle}
                                  </span>
                                )}
                                {prod.price && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#16a34a",
                                    }}
                                  >
                                    {prod.price}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {prod.slug && (
                                <a
                                  href={`/products/${prod.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View on Storefront"
                                  style={{
                                    color: "#6b7280",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "4px",
                                  }}
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveProductFromCollection(col.id, prod.id)}
                                title="Remove from Collection"
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "4px",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Frequently Asked Questions (FAQ) */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Text size={4} fontWeight="bold">
                    Frequently Asked Questions (FAQ)
                  </Text>
                  {faqs.length > 0 && (
                    <span
                      style={{
                        backgroundColor: "#ecfdf5",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        padding: "1px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {faqs.length} {faqs.length === 1 ? "Question" : "Questions"}
                    </span>
                  )}
                </div>
                <Text size={2} color="default2" style={{ display: "block", marginTop: "2px" }}>
                  Add question-and-answer pairs to help readers. FAQs automatically generate Google
                  FAQ rich result schema.
                </Text>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
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
                <Plus size={14} /> Add Question
              </button>
            </div>

            {/* Empty State */}
            {faqs.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px dashed #d1d5db",
                  color: "#6b7280",
                }}
              >
                <HelpCircle size={28} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  No FAQs added yet
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  Click &quot;+ Add Question&quot; above to add common student/reader questions and
                  boost search ranking.
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {faqs.map((faq, index) => (
                  <div
                    key={faq.id || index}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      backgroundColor: "#fbfcfd",
                      padding: "14px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 700,
                            fontSize: "11px",
                            padding: "2px 7px",
                            borderRadius: "4px",
                          }}
                        >
                          FAQ #{index + 1}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          title="Move up"
                          onClick={() => handleMoveFaq(index, "up")}
                          disabled={index === 0}
                          style={{
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#ffffff",
                            cursor: index === 0 ? "not-allowed" : "pointer",
                            opacity: index === 0 ? 0.4 : 1,
                            color: "#4b5563",
                            display: "flex",
                          }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          title="Move down"
                          onClick={() => handleMoveFaq(index, "down")}
                          disabled={index === faqs.length - 1}
                          style={{
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#ffffff",
                            cursor: index === faqs.length - 1 ? "not-allowed" : "pointer",
                            opacity: index === faqs.length - 1 ? 0.4 : 1,
                            color: "#4b5563",
                            display: "flex",
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete FAQ"
                          onClick={() => handleRemoveFaq(index)}
                          style={{
                            padding: "4px",
                            borderRadius: "4px",
                            border: "1px solid #fee2e2",
                            backgroundColor: "#fff",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "flex",
                            marginLeft: "4px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <input
                          type="text"
                          placeholder="e.g. Which edition of NCERT is best for NEET 2026?"
                          value={faq.question}
                          onChange={e => handleUpdateFaq(index, "question", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            outline: "none",
                            backgroundColor: "#ffffff",
                          }}
                        />
                      </div>
                      <div>
                        <textarea
                          rows={3}
                          placeholder="Provide a clear, detailed answer to this question..."
                          value={faq.answer}
                          onChange={e => handleUpdateFaq(index, "answer", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                            color: "#374151",
                            outline: "none",
                            resize: "vertical",
                            backgroundColor: "#ffffff",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Product Catalog Picker Modal */}
      {pickerCollectionId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
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
              maxWidth: "760px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px 16px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <Text size={5} fontWeight="bold" style={{ display: "block" }}>
                  Select Products from Store Catalog
                </Text>
                <Text size={2} color="default2" style={{ display: "block", marginTop: "2px" }}>
                  Adding to collection:{" "}
                  <strong>
                    {productCollections.find(c => c.id === pickerCollectionId)?.name ||
                      "Collection"}
                  </strong>
                </Text>
              </div>

              <button
                type="button"
                onClick={() => setPickerCollectionId(null)}
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div
              style={{
                padding: "12px 24px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: 1,
                }}
              >
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
                  placeholder="Search real products by title, subject, publisher, NEET, class..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 36px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#9ca3af",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchingProducts && (
                <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                  Searching...
                </span>
              )}
            </div>

            {searchQuery.trim().length > 0 && searchQuery.trim().length <= 2 && (
              <div
                style={{
                  padding: "8px 24px",
                  backgroundColor: "#eff6ff",
                  borderBottom: "1px solid #dbeafe",
                  color: "#1d4ed8",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>
                  Type more than 2 characters to search (e.g. &quot;NEET&quot;, &quot;Physics&quot;,
                  &quot;PW&quot;)...
                </span>
              </div>
            )}

            {/* Products List */}
            <div
              style={{
                flex: 1,
                minHeight: "380px",
                maxHeight: "55vh",
                overflowY: "auto",
                padding: "16px 24px",
                display: "grid",
                gap: "8px",
                alignContent: "start",
              }}
            >
              {searchingProducts ? (
                <div
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                    Searching products...
                  </p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                    Querying store catalog for &quot;{debouncedSearchQuery || searchQuery}&quot;...
                  </p>
                </div>
              ) : searchProductsError ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    backgroundColor: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                  }}
                >
                  <AlertCircle size={28} style={{ margin: "0 auto 6px auto" }} />
                  <p style={{ fontSize: "13px", fontWeight: 600 }}>Failed to load products</p>
                  <p style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "4px" }}>
                    {searchProductsError.message}
                  </p>
                </div>
              ) : searchResultsData?.products?.edges?.length === 0 ? (
                <div
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  <Package size={36} style={{ margin: "0 auto 8px auto", opacity: 0.4 }} />
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                    No products found
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    {debouncedSearchQuery
                      ? `No products matched "${debouncedSearchQuery}". Try another keyword like "Physics", "Chemistry", or "NEET".`
                      : "No products available in this catalog."}
                  </p>
                </div>
              ) : (
                searchResultsData?.products?.edges?.map((edge: { node: any }) => {
                  const prod = edge.node;
                  const isSelected = selectedProductIds.has(prod.id);
                  const priceGross = prod.pricing?.priceRange?.start?.gross;
                  const formattedPrice = priceGross ? `₹${Math.round(priceGross.amount)}` : "";

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleProductSelection(prod.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: isSelected ? "1.5px solid #16a34a" : "1px solid #e5e7eb",
                        backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: isSelected ? "1.5px solid #16a34a" : "1.5px solid #d1d5db",
                          backgroundColor: isSelected ? "#16a34a" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>

                      {/* Product Thumbnail */}
                      {prod.thumbnail?.url ? (
                        <img
                          src={prod.thumbnail.url}
                          alt={prod.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #f3f4f6",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "6px",
                            backgroundColor: "#f3f4f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            flexShrink: 0,
                          }}
                        >
                          <BookOpen size={20} />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#111827",
                            margin: "0 0 2px 0",
                            lineHeight: "1.3",
                          }}
                        >
                          {prod.name}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {prod.category?.name && (
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                backgroundColor: "#f3f4f6",
                                color: "#4b5563",
                              }}
                            >
                              {prod.category.name}
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>/{prod.slug}</span>
                        </div>
                      </div>

                      {/* Price */}
                      {formattedPrice && (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#16a34a",
                            }}
                          >
                            {formattedPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                {selectedProductIds.size} {selectedProductIds.size === 1 ? "product" : "products"}{" "}
                selected
              </span>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPickerCollectionId(null)}
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
                  type="button"
                  onClick={handleConfirmAddProducts}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Check size={16} /> Add to Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

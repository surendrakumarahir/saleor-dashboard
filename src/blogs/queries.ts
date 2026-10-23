import { gql } from "@apollo/client";

export const GET_BLOG_POSTS = gql`
  query GetBlogPosts(
    $filter: BlogPostFilterInput
    $sortBy: BlogPostSortingInput
    $first: Int
    $after: String
  ) {
    blogPosts(filter: $filter, sortBy: $sortBy, first: $first, after: $after) {
      edges {
        node {
          id
          title
          slug
          excerpt
          status
          isFeatured
          readingTimeMinutes
          publishedAt
          scheduledAt
          updatedAt
          featuredImage
          featuredImageAlt
          author {
            id
            displayName
          }
          primaryCategory {
            id
            name
            badgeColor
          }
          tags {
            id
            name
          }
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_BLOG_POST = gql`
  query GetBlogPost($id: ID, $slug: String) {
    blogPost(id: $id, slug: $slug) {
      id
      title
      slug
      excerpt
      content
      contentHtml
      status
      isFeatured
      readingTimeMinutes
      allowComments
      publishedAt
      scheduledAt
      seoTitle
      seoDescription
      canonicalUrl
      robotsIndex
      robotsFollow
      ogTitle
      ogDescription
      ogImage
      featuredImage
      featuredImageAlt
      featuredImageCaption
      recommendedBooks
      tableOfContents
      faqs {
        id
        question
        answer
        sortOrder
      }
      author {
        id
        displayName
      }
      primaryCategory {
        id
        name
      }
      categories {
        id
        name
      }
      tags {
        id
        name
      }
      revisionNumber
      createdAt
      updatedAt
      createdByName
      updatedByName
    }
  }
`;

export const CREATE_BLOG_POST = gql`
  mutation CreateBlogPost($input: BlogPostCreateInput!) {
    blogPostCreate(input: $input) {
      post {
        id
        title
        slug
        status
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_BLOG_POST = gql`
  mutation UpdateBlogPost($id: ID!, $input: BlogPostUpdateInput!) {
    blogPostUpdate(id: $id, input: $input) {
      post {
        id
        title
        slug
        status
        featuredImage
        featuredImageAlt
        featuredImageCaption
        ogImage
        publishedAt
        scheduledAt
        updatedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($id: ID!) {
    blogPostDelete(id: $id) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

export const PUBLISH_BLOG_POST = gql`
  mutation PublishBlogPost($id: ID!) {
    blogPostPublish(id: $id) {
      post {
        id
        status
        publishedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const SCHEDULE_BLOG_POST = gql`
  mutation ScheduleBlogPost($id: ID!, $scheduledAt: String!) {
    blogPostSchedule(id: $id, scheduledAt: $scheduledAt) {
      post {
        id
        status
        scheduledAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UNPUBLISH_BLOG_POST = gql`
  mutation UnpublishBlogPost($id: ID!) {
    blogPostUnpublish(id: $id) {
      post {
        id
        status
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const ARCHIVE_BLOG_POST = gql`
  mutation ArchiveBlogPost($id: ID!) {
    blogPostArchive(id: $id) {
      post {
        id
        status
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const DUPLICATE_BLOG_POST = gql`
  mutation DuplicateBlogPost($id: ID!) {
    blogPostDuplicate(id: $id) {
      post {
        id
        title
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const GET_BLOG_REVISIONS = gql`
  query GetBlogRevisions($postId: ID!) {
    blogPostRevisions(postId: $postId) {
      id
      revisionNumber
      title
      slug
      excerpt
      content
      contentHtml
      createdByName
      createdAt
    }
  }
`;

export const RESTORE_BLOG_REVISION = gql`
  mutation RestoreBlogRevision($id: ID!, $revisionId: ID!) {
    blogPostRestoreRevision(id: $id, revisionId: $revisionId) {
      post {
        id
        title
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UPLOAD_BLOG_MEDIA = gql`
  mutation UploadBlogMedia($file: Upload!, $folder: String) {
    uploadBlogMedia(file: $file, folder: $folder) {
      fileUrl
      storageKey
      errors {
        code
        message
        field
      }
    }
  }
`;

export const GET_BLOG_CATEGORIES = gql`
  query GetBlogCategories($first: Int, $filter: BlogCategoryFilterInput) {
    blogCategories(first: $first, filter: $filter) {
      edges {
        node {
          id
          name
          slug
          description
          badgeColor
          isActive
          postCount
          parentId
          parent {
            id
            name
          }
        }
      }
      totalCount
    }
  }
`;

export const CREATE_BLOG_CATEGORY = gql`
  mutation CreateBlogCategory(
    $name: String!
    $slug: String
    $description: String
    $parentId: ID
    $seoTitle: String
    $seoDescription: String
    $badgeColor: String
    $isActive: Boolean
  ) {
    blogCategoryCreate(
      name: $name
      slug: $slug
      description: $description
      parentId: $parentId
      seoTitle: $seoTitle
      seoDescription: $seoDescription
      badgeColor: $badgeColor
      isActive: $isActive
    ) {
      category {
        id
        name
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_BLOG_CATEGORY = gql`
  mutation UpdateBlogCategory(
    $id: ID!
    $name: String
    $slug: String
    $description: String
    $parentId: ID
    $seoTitle: String
    $seoDescription: String
    $badgeColor: String
    $isActive: Boolean
  ) {
    blogCategoryUpdate(
      id: $id
      name: $name
      slug: $slug
      description: $description
      parentId: $parentId
      seoTitle: $seoTitle
      seoDescription: $seoDescription
      badgeColor: $badgeColor
      isActive: $isActive
    ) {
      category {
        id
        name
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_BLOG_CATEGORY = gql`
  mutation DeleteBlogCategory($id: ID!) {
    blogCategoryDelete(id: $id) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

export const GET_BLOG_AUTHORS = gql`
  query GetBlogAuthors($first: Int) {
    blogAuthors(first: $first) {
      edges {
        node {
          id
          displayName
          slug
          bio
          avatar
          designation
          socialLinks
          createdAt
        }
      }
      totalCount
    }
  }
`;

export const CREATE_BLOG_AUTHOR = gql`
  mutation CreateBlogAuthor(
    $displayName: String!
    $slug: String
    $bio: String
    $avatar: String
    $designation: String
    $socialLinks: JSON
  ) {
    blogAuthorCreate(
      displayName: $displayName
      slug: $slug
      bio: $bio
      avatar: $avatar
      designation: $designation
      socialLinks: $socialLinks
    ) {
      author {
        id
        displayName
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_BLOG_AUTHOR = gql`
  mutation UpdateBlogAuthor(
    $id: ID!
    $displayName: String
    $slug: String
    $bio: String
    $avatar: String
    $designation: String
    $socialLinks: JSON
  ) {
    blogAuthorUpdate(
      id: $id
      displayName: $displayName
      slug: $slug
      bio: $bio
      avatar: $avatar
      designation: $designation
      socialLinks: $socialLinks
    ) {
      author {
        id
        displayName
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_BLOG_AUTHOR = gql`
  mutation DeleteBlogAuthor($id: ID!) {
    blogAuthorDelete(id: $id) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

export const GET_BLOG_TAGS = gql`
  query GetBlogTags($first: Int) {
    blogTags(first: $first) {
      edges {
        node {
          id
          name
          slug
          description
          postCount
        }
      }
      totalCount
    }
  }
`;

export const CREATE_BLOG_TAG = gql`
  mutation CreateBlogTag($name: String!, $slug: String, $description: String) {
    blogTagCreate(name: $name, slug: $slug, description: $description) {
      tag {
        id
        name
        slug
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_BLOG_TAG = gql`
  mutation UpdateBlogTag($id: ID!, $name: String, $slug: String, $description: String) {
    blogTagUpdate(id: $id, name: $name, slug: $slug, description: $description) {
      tag {
        id
        name
        slug
        description
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

export const DELETE_BLOG_TAG = gql`
  mutation DeleteBlogTag($id: ID!) {
    blogTagDelete(id: $id) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

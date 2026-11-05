import { gql } from "@apollo/client";

export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews(
    $filter: ProductReviewFilterInput
    $sortBy: ProductReviewSortingInput
    $first: Int
    $after: String
  ) {
    productReviews(filter: $filter, sortBy: $sortBy, first: $first, after: $after) {
      edges {
        node {
          id
          productId
          productName
          productThumbnail
          productSlug
          userName
          userEmail
          rating
          title
          content
          status
          isVerifiedBuyer
          images
          helpfulCount
          adminReply
          createdAt
          updatedAt
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

export const PRODUCT_REVIEW_STATUS_UPDATE = gql`
  mutation ProductReviewStatusUpdate($id: ID!, $status: ProductReviewStatusEnum!) {
    productReviewStatusUpdate(id: $id, status: $status) {
      review {
        id
        status
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

export const PRODUCT_REVIEW_BULK_UPDATE_STATUS = gql`
  mutation ProductReviewBulkUpdateStatus($ids: [ID!]!, $status: ProductReviewStatusEnum!) {
    productReviewBulkUpdateStatus(ids: $ids, status: $status) {
      count
      errors {
        code
        message
        field
      }
    }
  }
`;

export const PRODUCT_REVIEW_DELETE = gql`
  mutation ProductReviewDelete($id: ID!) {
    productReviewDelete(id: $id) {
      success
      errors {
        code
        message
        field
      }
    }
  }
`;

export const PRODUCT_REVIEW_BULK_DELETE = gql`
  mutation ProductReviewBulkDelete($ids: [ID!]!) {
    productReviewBulkDelete(ids: $ids) {
      count
      errors {
        code
        message
        field
      }
    }
  }
`;


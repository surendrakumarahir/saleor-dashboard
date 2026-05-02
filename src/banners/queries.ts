import gql from "graphql-tag";

export const BANNER_COLLECTION_FRAGMENT = gql`
  fragment BannerCollection on ImageCollectionType {
    id
    name
    description
    channelId
    isActive
    createdAt
    updatedAt
  }
`;

export const BANNER_FRAGMENT = gql`
  fragment Banner on BannerType {
    id
    title
    description
    image
    altText
    linkUrl
    linkText
    customField1
    customField2
    customField3
    position
    isActive
    startDate
    endDate
    createdAt
    updatedAt
  }
`;

export const GET_IMAGE_COLLECTIONS = gql`
  query GetImageCollections($first: Int!, $after: String, $filter: ImageCollectionFilterInput) {
    imageCollections(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          ...BannerCollection
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${BANNER_COLLECTION_FRAGMENT}
`;

export const GET_IMAGE_COLLECTION_DETAIL = gql`
  query GetImageCollectionDetail($id: ID!) {
    imageCollection(id: $id) {
      ...BannerCollection
    }
  }
  ${BANNER_COLLECTION_FRAGMENT}
`;

export const GET_BANNER_DETAIL = gql`
  query GetBannerDetail($id: ID!) {
    banner(id: $id) {
      ...Banner
    }
  }
  ${BANNER_FRAGMENT}
`;

export const GET_BANNERS = gql`
  query GetBanners($first: Int!, $filter: BannerFilterInput) {
    banners(first: $first, filter: $filter) {
      edges {
        node {
          ...Banner
        }
      }
    }
  }
  ${BANNER_FRAGMENT}
`;

export const GET_CHANNELS = gql`
  query GetChannels {
    channels {
      id
      name
      slug
      isActive
    }
  }
`;

export const CREATE_IMAGE_COLLECTION = gql`
  mutation CreateImageCollection(
    $name: String!
    $description: String
    $channelId: ID!
    $isActive: Boolean
  ) {
    createImageCollection(
      name: $name
      description: $description
      channelId: $channelId
      isActive: $isActive
    ) {
      imageCollection {
        ...BannerCollection
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${BANNER_COLLECTION_FRAGMENT}
`;

export const UPDATE_IMAGE_COLLECTION = gql`
  mutation UpdateImageCollection(
    $id: ID!
    $name: String
    $description: String
    $isActive: Boolean
  ) {
    updateImageCollection(id: $id, name: $name, description: $description, isActive: $isActive) {
      imageCollection {
        ...BannerCollection
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${BANNER_COLLECTION_FRAGMENT}
`;

export const DELETE_IMAGE_COLLECTION = gql`
  mutation DeleteImageCollection($id: ID!) {
    deleteImageCollection(id: $id) {
      success
      errors {
        code
        message
      }
    }
  }
`;
export const CREATE_BANNER = gql`
  mutation CreateBanner(
    $collectionId: ID!
    $title: String!
    $imageKey: String!
    $description: String
    $altText: String
    $linkUrl: String
    $linkText: String
    $customField1: String
    $customField2: String
    $customField3: String
    $position: Int
    $isActive: Boolean
    $startDate: DateTime
    $endDate: DateTime
  ) {
    createBanner(
      collectionId: $collectionId
      title: $title
      imageKey: $imageKey
      description: $description
      altText: $altText
      linkUrl: $linkUrl
      linkText: $linkText
      customField1: $customField1
      customField2: $customField2
      customField3: $customField3
      position: $position
      isActive: $isActive
      startDate: $startDate
      endDate: $endDate
    ) {
      banner {
        ...Banner
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${BANNER_FRAGMENT}
`;
export const UPDATE_BANNER = gql`
  mutation UpdateBanner(
    $id: ID!
    $title: String
    $imageKey: String
    $description: String
    $altText: String
    $linkUrl: String
    $linkText: String
    $customField1: String
    $customField2: String
    $customField3: String
    $position: Int
    $isActive: Boolean
    $startDate: DateTime
    $endDate: DateTime
  ) {
    updateBanner(
      id: $id
      title: $title
      imageKey: $imageKey
      description: $description
      altText: $altText
      linkUrl: $linkUrl
      linkText: $linkText
      customField1: $customField1
      customField2: $customField2
      customField3: $customField3
      position: $position
      isActive: $isActive
      startDate: $startDate
      endDate: $endDate
    ) {
      banner {
        ...Banner
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${BANNER_FRAGMENT}
`;

export const UPLOAD_BANNER_IMAGE = gql`
  mutation UploadBannerImage($file: Upload!, $folder: String) {
    uploadBannerImage(file: $file, folder: $folder) {
      fileKey
      uploadedFile {
        url
        contentType
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const DELETE_BANNER_IMAGE = gql`
  mutation DeleteBannerImage($fileKey: String!, $force: Boolean) {
    deleteBannerImage(fileKey: $fileKey, force: $force) {
      success
      errors {
        code
        field
        message
      }
    }
  }
`;

export const DELETE_BANNER = gql`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id) {
      success
      errors {
        code
        message
      }
    }
  }
`;

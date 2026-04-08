import { useMutation, useQuery } from "@apollo/client";
import BackButton from "@dashboard/components/BackButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { SaleorThrobber } from "@dashboard/components/Throbber";
import { makeStyles } from "@saleor/macaw-ui";
import { Box, Button, Divider, Text, vars } from "@saleor/macaw-ui-next";
import { Plus, X } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

import { BannerModal } from "../components/BannerModal";
import { BannerSortableList } from "../components/BannerSortableList";
import { ImageCollectionModal } from "../components/ImageCollectionModal";
import {
  DELETE_BANNER,
  DELETE_IMAGE_COLLECTION,
  GET_BANNERS,
  GET_CHANNELS,
  GET_IMAGE_COLLECTIONS,
} from "../queries";
import { type Banner, type Channel, type ImageCollection } from "../types";

const useBannerManagementModalStyles = makeStyles(
  theme => ({
    body: {
      display: "grid",
      gap: theme.spacing(3),
      overflowY: "auto",
      paddingBottom: theme.spacing(1),
    },
    toolbar: {
      alignItems: "center",
      display: "flex",
      gap: theme.spacing(2),
      justifyContent: "space-between",
      [theme.breakpoints.down("sm")]: {
        alignItems: "stretch",
        flexDirection: "column",
      },
    },
    collectionMeta: {
      display: "grid",
      gap: theme.spacing(0.5),
    },
    statusRow: {
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap",
      gap: theme.spacing(1),
    },
    statusBadge: {
      border: `1px solid ${vars.colors.border.default1}`,
      borderRadius: 999,
      padding: theme.spacing(0.25, 1),
    },
    statusBadgeActive: {
      background: vars.colors.background.success1,
      borderColor: vars.colors.border.success1,
    },
    statusBadgeInactive: {
      background: vars.colors.background.default2,
    },
    loadingState: {
      alignItems: "center",
      display: "flex",
      gap: theme.spacing(1),
      justifyContent: "center",
      padding: theme.spacing(4, 0),
    },
  }),
  { name: "BannerManagementModal" },
);

interface CollectionCardProps {
  collection: ImageCollection;
  onEdit: (collection: ImageCollection) => void;
  onDelete: (collectionId: string) => void;
  onManageBanners: (collection: ImageCollection) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onEdit,
  onDelete,
  onManageBanners,
}) => {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <Text size={5} fontWeight="bold">
              {collection.name}
            </Text>
            {collection.description && (
              <div style={{ marginTop: "4px", fontSize: "12px", color: "#6b7280" }}>
                {collection.description}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
            Channel: {collection.channel?.name || "Unknown"}
          </div>
          <div
            style={{
              paddingLeft: "8px",
              paddingRight: "8px",
              paddingTop: "4px",
              paddingBottom: "4px",
              borderRadius: "6px",
              backgroundColor: collection.isActive ? "#e6f7ed" : "#fef2f2",
              display: "inline-flex",
            }}
          >
            <Text
              size={2}
              fontWeight="bold"
              style={{ color: collection.isActive ? "#018a40" : "#dc2626" }}
            >
              {collection.isActive ? "Active" : "Inactive"}
            </Text>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
          Banner details load in the manager
        </div>
      </div>

      <div
        style={{
          padding: "12px",
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Button onClick={() => onManageBanners(collection)} variant="secondary" size="small">
          Manage Banners
        </Button>
        <Button onClick={() => onEdit(collection)} variant="secondary" size="small">
          Edit
        </Button>
        <Button onClick={() => onDelete(collection.id)} variant="secondary" size="small">
          Delete
        </Button>
      </div>
    </div>
  );
};

interface BannerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ImageCollection | null;
  onBannerSave: (banner: Banner) => void;
  onBannerDelete: (bannerId: string) => void;
}

const BannerManagementModal: React.FC<BannerManagementModalProps> = ({
  isOpen,
  onClose,
  collection,
  onBannerSave,
  onBannerDelete,
}) => {
  const classes = useBannerManagementModalStyles({});
  const [selectedBanner, setSelectedBanner] = useState<Banner | undefined>();
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const {
    data: bannersData,
    loading: bannersLoading,
    refetch: refetchBanners,
  } = useQuery(GET_BANNERS, {
    skip: !isOpen || !collection,
    variables: {
      first: 100,
      filter: collection ? { collectionId: collection.id } : undefined,
    },
  });

  if (!isOpen || !collection) return null;

  const banners: Banner[] =
    bannersData?.banners?.edges?.map((edge: { node: Banner }) => edge.node) ?? [];

  return (
    <>
      <DashboardModal open={isOpen} onChange={onClose}>
        <DashboardModal.Content size="lg" __gridTemplateRows="auto 1fr auto">
          <DashboardModal.Header>
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Text size={5} fontWeight="bold">
                Manage Banners
              </Text>
              <Button onClick={onClose} size="small" variant="tertiary" aria-label="Close">
                <X size={16} />
              </Button>
            </Box>
          </DashboardModal.Header>

          <Box className={classes.body}>
            <Box className={classes.toolbar}>
              <Box className={classes.collectionMeta}>
                <Text size={4} fontWeight="bold">
                  {collection.name}
                </Text>
                {collection.description && <Text color="default2">{collection.description}</Text>}
                <Box className={classes.statusRow}>
                  <Text size={2} color="default2">
                    Channel: {collection.channel?.name || "Unknown"}
                  </Text>
                  <Box
                    className={`${classes.statusBadge} ${
                      collection.isActive ? classes.statusBadgeActive : classes.statusBadgeInactive
                    }`}
                  >
                    <Text size={1} fontWeight="medium">
                      {collection.isActive ? "Active" : "Inactive"}
                    </Text>
                  </Box>
                </Box>
              </Box>

              <Button
                onClick={() => {
                  setSelectedBanner(undefined);
                  setIsBannerModalOpen(true);
                }}
              >
                <Plus size={16} />
                Add New Banner
              </Button>
            </Box>

            <Divider />

            <BannerSortableList
              banners={banners}
              onReorder={() => {}}
              onEdit={banner => {
                setSelectedBanner(banner);
                setIsBannerModalOpen(true);
              }}
              onDelete={onBannerDelete}
            />

            {bannersLoading && (
              <Box className={classes.loadingState}>
                <SaleorThrobber size={20} />
                <Text size={2} color="default2">
                  Loading banners...
                </Text>
              </Box>
            )}
          </Box>

          <DashboardModal.Actions>
            <BackButton onClick={onClose} />
            <Button
              onClick={() => {
                setSelectedBanner(undefined);
                setIsBannerModalOpen(true);
              }}
              variant="secondary"
            >
              <Plus size={16} />
              Add Banner
            </Button>
          </DashboardModal.Actions>
        </DashboardModal.Content>
      </DashboardModal>

      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={() => {
          setIsBannerModalOpen(false);
          setSelectedBanner(undefined);
        }}
        onSave={banner => {
          onBannerSave(banner);
          setSelectedBanner(undefined);
          setIsBannerModalOpen(false);
          void refetchBanners();
        }}
        banner={selectedBanner}
        collectionId={collection.id}
        defaultPosition={banners.length + 1}
      />
    </>
  );
};

export const ImageCollectionsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ImageCollection | undefined>();
  const [isBannerManagementOpen, setIsBannerManagementOpen] = useState(false);
  const [managingCollection, setManagingCollection] = useState<ImageCollection | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_IMAGE_COLLECTIONS, {
    variables: {
      first: 20,
      filter: {
        ...(searchTerm && { name: searchTerm }),
        ...(selectedChannelFilter && { channelId: selectedChannelFilter }),
        ...(activeStatusFilter !== "all" && { isActive: activeStatusFilter === "active" }),
      },
    },
  });
  const { data: channelsData } = useQuery(GET_CHANNELS);

  const [deleteCollection] = useMutation(DELETE_IMAGE_COLLECTION, {
    onCompleted: () => refetch(),
  });

  const [deleteBanner] = useMutation(DELETE_BANNER, {
    onCompleted: () => refetch(),
  });

  const channelsById = useMemo(() => {
    const channels: Channel[] = channelsData?.channels ?? [];

    return channels.reduce<Record<string, Channel>>((acc, channel) => {
      acc[channel.id] = channel;

      return acc;
    }, {});
  }, [channelsData]);

  const collections = useMemo<ImageCollection[]>(() => {
    const rawCollections: ImageCollection[] =
      data?.imageCollections?.edges?.map((edge: { node: ImageCollection }) => edge.node) ?? [];

    return rawCollections.map(collection => ({
      ...collection,
      channel: channelsById[collection.channelId],
    }));
  }, [data, channelsById]);

  const handleCreateNew = useCallback(() => {
    setSelectedCollection(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((collection: ImageCollection) => {
    setSelectedCollection(collection);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (collectionId: string) => {
      if (window.confirm("Are you sure you want to delete this collection?")) {
        deleteCollection({ variables: { id: collectionId } });
      }
    },
    [deleteCollection],
  );

  const handleSave = useCallback(
    (_collection: ImageCollection) => {
      setIsModalOpen(false);
      refetch();
    },
    [refetch],
  );

  const handleManageBanners = useCallback((collection: ImageCollection) => {
    setManagingCollection(collection);
    setIsBannerManagementOpen(true);
  }, []);

  const handleBannerDelete = useCallback(
    (bannerId: string) => {
      if (window.confirm("Are you sure you want to delete this banner?")) {
        deleteBanner({ variables: { id: bannerId } });
      }
    },
    [deleteBanner],
  );

  return (
    <div style={{ padding: "24px", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: 0, marginBottom: "4px" }}>
                Image Collections
              </h1>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Manage banner collections and media assets for your store
              </div>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus size={16} style={{ marginRight: "8px" }} />
              Create Collection
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "16px",
            marginBottom: "24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <Text size={2} fontWeight="bold" style={{ marginBottom: "8px", display: "block" }}>
              Search collections
            </Text>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <Text size={2} fontWeight="bold" style={{ marginBottom: "8px", display: "block" }}>
              Filter by channel
            </Text>
            <select
              value={selectedChannelFilter}
              onChange={e => setSelectedChannelFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              <option value="">All Channels</option>
              {channelsData?.channels?.map((channel: Channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Text size={2} fontWeight="bold" style={{ marginBottom: "8px", display: "block" }}>
              Filter by status
            </Text>
            <select
              value={activeStatusFilter}
              onChange={e => setActiveStatusFilter(e.target.value as any)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <div
              style={{
                animation: "spin 1s linear infinite",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                borderWidth: "4px",
                borderStyle: "solid",
                borderColor: "#e5e7eb",
                borderTopColor: "#3b82f6",
              }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              marginBottom: "16px",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Text style={{ color: "#dc2626", fontWeight: "bold", display: "block" }}>
              Error loading collections: {error.message}
            </Text>
          </div>
        )}

        {/* Collections Grid */}
        {!loading && collections.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "16px",
            }}
          >
            {collections.map((collection: ImageCollection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageBanners={handleManageBanners}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && collections.length === 0 && !error && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
            }}
          >
            <div style={{ marginBottom: "16px", fontSize: "48px" }}>📸</div>
            <Text size={5} fontWeight="bold" style={{ marginBottom: "8px" }}>
              No collections yet
            </Text>
            <div
              style={{
                marginBottom: "24px",
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Get started by creating your first banner collection.
            </div>
            <Button onClick={handleCreateNew}>
              <Plus size={16} style={{ marginRight: "8px" }} />
              Create Collection
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImageCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCollection(undefined);
        }}
        onSave={handleSave}
        collection={selectedCollection}
      />

      <BannerManagementModal
        isOpen={isBannerManagementOpen}
        onClose={() => {
          setIsBannerManagementOpen(false);
          setManagingCollection(null);
        }}
        collection={managingCollection}
        onBannerSave={() => refetch()}
        onBannerDelete={handleBannerDelete}
      />
    </div>
  );
};

import { useMutation, useQuery } from "@apollo/client";
import { Button, Divider, Text } from "@saleor/macaw-ui-next";
import { X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { CREATE_IMAGE_COLLECTION, GET_CHANNELS, UPDATE_IMAGE_COLLECTION } from "../queries";
import { type Channel, type CollectionFormData, type ImageCollection } from "../types";

interface ImageCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: ImageCollection) => void;
  collection?: ImageCollection;
}

const INITIAL_FORM_DATA: CollectionFormData = {
  name: "",
  description: "",
  channelId: "",
  isActive: true,
};

export const ImageCollectionModal: React.FC<ImageCollectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  collection,
}) => {
  const [formData, setFormData] = useState<CollectionFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [createCollection] = useMutation(CREATE_IMAGE_COLLECTION);
  const [updateCollection] = useMutation(UPDATE_IMAGE_COLLECTION);
  const {
    data: channelsData,
    loading: channelsLoading,
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery(GET_CHANNELS, {
    pollInterval: 0,
    notifyOnNetworkStatusChange: true,
    errorPolicy: "all",
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || "",
        channelId: collection.channelId,
        isActive: collection.isActive,
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }

    setErrors({});
  }, [collection, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.channelId) {
      newErrors.channelId = "Channel is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CollectionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };

        delete newErrors[field];

        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (collection) {
        const response = await updateCollection({
          variables: {
            id: collection.id,
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
          },
        });

        if (response.data?.updateImageCollection?.imageCollection) {
          onSave(response.data.updateImageCollection.imageCollection);
          onClose();
        } else if (response.data?.updateImageCollection?.errors?.length > 0) {
          const fieldErrors: Record<string, string> = {};

          response.data.updateImageCollection.errors.forEach((error: any) => {
            if (error.field) {
              fieldErrors[error.field] = error.message;
            } else {
              fieldErrors.general = error.message;
            }
          });
          setErrors(fieldErrors);
        }
      } else {
        const response = await createCollection({
          variables: {
            name: formData.name,
            description: formData.description,
            channelId: formData.channelId,
            isActive: formData.isActive,
          },
        });

        if (response.data?.createImageCollection?.imageCollection) {
          onSave(response.data.createImageCollection.imageCollection);
          onClose();
        } else if (response.data?.createImageCollection?.errors?.length > 0) {
          const fieldErrors: Record<string, string> = {};

          response.data.createImageCollection.errors.forEach((error: any) => {
            if (error.field) {
              fieldErrors[error.field] = error.message;
            } else {
              fieldErrors.general = error.message;
            }
          });
          setErrors(fieldErrors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "4px",
          backgroundColor: "white",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Text size={5} fontWeight="bold">
            {collection ? "Edit Collection" : "Create Collection"}
          </Text>
          <Button variant="tertiary" size="small" onClick={onClose} aria-label="Close">
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange("name", e.target.value)}
                placeholder="Collection name"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: errors.name ? "1px solid #fca5a5" : "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  backgroundColor: errors.name ? "#fef2f2" : "white",
                }}
              />
              {errors.name && (
                <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange("description", e.target.value)}
                rows={3}
                placeholder="Collection description"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Channel Selector */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                Channel *
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <select
                  value={formData.channelId}
                  onChange={e => handleInputChange("channelId", e.target.value)}
                  disabled={!!collection || channelsLoading}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: errors.channelId ? "1px solid #fca5a5" : "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    backgroundColor: collection || channelsLoading ? "#f3f4f6" : "white",
                    cursor: collection || channelsLoading ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">
                    {channelsLoading ? "Loading channels..." : "Select a channel"}
                  </option>
                  {channelsData?.channels?.map((channel: Channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
                {channelsLoading && (
                  <button
                    type="button"
                    onClick={() => refetchChannels()}
                    style={{
                      padding: "8px 12px",
                      marginTop: "0px",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
              {channelsError && (
                <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
                  Error loading channels: {channelsError.message}
                </p>
              )}
              {errors.channelId && (
                <p style={{ marginTop: "4px", fontSize: "12px", color: "#dc2626" }}>
                  {errors.channelId}
                </p>
              )}
            </div>

            {/* Status Checkbox */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => handleInputChange("isActive", e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <Text size={2}>Active</Text>
              </label>
            </div>

            {/* General Error */}
            {errors.general && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  display: "flex",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <Text size={2} style={{ color: "#dc2626" }}>
                  {errors.general}
                </Text>
              </div>
            )}
          </form>

          {/* Footer */}
          <Divider />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              paddingTop: "12px",
            }}
          >
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : collection ? "Update Collection" : "Create Collection"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

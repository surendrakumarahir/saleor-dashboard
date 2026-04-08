import { useMutation } from "@apollo/client";
import BackButton from "@dashboard/components/BackButton";
import {
  ConfirmButton,
  type ConfirmButtonTransitionState,
} from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { TextField } from "@material-ui/core";
import { makeStyles } from "@saleor/macaw-ui";
import { Box, Button, Checkbox, Divider, Text, vars } from "@saleor/macaw-ui-next";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CREATE_BANNER, UPDATE_BANNER } from "../queries";
import {
  type Banner,
  type BannerError,
  type BannerFormData,
  type CreateBannerResponse,
  type UpdateBannerResponse,
} from "../types";

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: Banner) => void;
  banner?: Banner;
  collectionId: string;
  defaultPosition?: number;
}

const useStyles = makeStyles(
  theme => ({
    form: {
      display: "grid",
      gap: theme.spacing(3),
    },
    section: {
      display: "grid",
      gap: theme.spacing(2),
    },
    sectionTitle: {
      fontWeight: 600,
    },
    twoColumns: {
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
      },
    },
    threeColumns: {
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
      },
    },
    hiddenInput: {
      display: "none",
    },
    imagePreview: {
      alignItems: "center",
      border: `1px solid ${vars.colors.border.default1}`,
      borderRadius: theme.spacing(),
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "88px 1fr",
      padding: theme.spacing(2),
    },
    image: {
      borderRadius: theme.spacing(),
      height: 88,
      objectFit: "cover",
      width: 88,
    },
    imageActions: {
      display: "grid",
      gap: theme.spacing(1),
    },
    helperText: {
      color: vars.colors.text.default2,
    },
    errorText: {
      color: vars.colors.text.critical1,
    },
    checkboxWrapper: {
      alignItems: "start",
      display: "grid",
      gap: theme.spacing(0.5),
    },
  }),
  { name: "BannerModal" },
);

const INITIAL_FORM_DATA: BannerFormData = {
  title: "",
  description: "",
  altText: "",
  linkUrl: "",
  linkText: "",
  customField1: "",
  customField2: "",
  customField3: "",
  position: 0,
  isActive: true,
  startDate: "",
  endDate: "",
  image: null,
  imageUrl: "",
};

const customFields: Array<{
  field: "customField1" | "customField2" | "customField3";
  label: string;
}> = [
  { field: "customField1", label: "Custom field 1" },
  { field: "customField2", label: "Custom field 2" },
  { field: "customField3", label: "Custom field 3" },
];

const formatDateTimeLocal = (value: string) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const parseDateTimeLocal = (value: string) => (value ? new Date(value).toISOString() : "");

export const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  banner,
  collectionId,
  defaultPosition = 0,
}) => {
  const classes = useStyles({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BannerFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [createBanner] = useMutation<CreateBannerResponse>(CREATE_BANNER);
  const [updateBanner] = useMutation<UpdateBannerResponse>(UPDATE_BANNER);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        description: banner.description || "",
        altText: banner.altText || "",
        linkUrl: banner.linkUrl || "",
        linkText: banner.linkText || "",
        customField1: banner.customField1 || "",
        customField2: banner.customField2 || "",
        customField3: banner.customField3 || "",
        position: banner.position,
        isActive: banner.isActive,
        startDate: banner.startDate || "",
        endDate: banner.endDate || "",
        imageUrl: banner.image || "",
        image: null,
      });
    } else {
      setFormData({ ...INITIAL_FORM_DATA, position: defaultPosition });
    }

    setErrors({});
  }, [banner, isOpen, defaultPosition]);

  const previewUrl = useMemo(() => {
    if (formData.image) {
      return URL.createObjectURL(formData.image);
    }

    return formData.imageUrl || "";
  }, [formData.image, formData.imageUrl]);

  useEffect(() => {
    return () => {
      if (formData.image && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [formData.image, previewUrl]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.imageUrl && !formData.image) {
      newErrors.image = "Image is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start >= end) {
        newErrors.startDate = "Start date must be before end date";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof BannerFormData,
    value: BannerFormData[keyof BannerFormData],
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => {
        const nextErrors = { ...prev };

        delete nextErrors[field];

        return nextErrors;
      });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      image: file,
      imageUrl: "",
    }));

    setErrors(prev => {
      const nextErrors = { ...prev };

      delete nextErrors.image;

      return nextErrors;
    });
  };

  const handleMutationErrors = (mutationErrors: BannerError[]) => {
    const fieldErrors = mutationErrors.reduce<Record<string, string>>((acc, error) => {
      if (error.field) {
        acc[error.field] = error.message;
      } else {
        acc.general = error.message;
      }

      return acc;
    }, {});

    setErrors(fieldErrors);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const input = {
        title: formData.title,
        description: formData.description,
        image: formData.imageUrl || formData.image?.name || "",
        altText: formData.altText,
        linkUrl: formData.linkUrl,
        linkText: formData.linkText,
        collectionId,
        customField1: formData.customField1,
        customField2: formData.customField2,
        customField3: formData.customField3,
        position: formData.position,
        isActive: formData.isActive,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      if (banner) {
        const response = await updateBanner({
          variables: { id: banner.id, ...input },
        });

        if (response.data?.updateBanner?.banner) {
          onSave(response.data.updateBanner.banner);
          onClose();

          return;
        }

        if (response.data?.updateBanner?.errors?.length) {
          handleMutationErrors(response.data.updateBanner.errors);
        }
      } else {
        const response = await createBanner({
          variables: input,
        });

        if (response.data?.createBanner?.banner) {
          onSave(response.data.createBanner.banner);
          onClose();

          return;
        }

        if (response.data?.createBanner?.errors?.length) {
          handleMutationErrors(response.data.createBanner.errors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmButtonState: ConfirmButtonTransitionState = loading ? "loading" : "default";

  if (!isOpen) {
    return null;
  }

  return (
    <DashboardModal open={isOpen} onChange={onClose}>
      <DashboardModal.Content size="md" __gridTemplateRows="auto 1fr auto">
        <DashboardModal.Header>
          <Text as="span" size={5} fontWeight="bold">
            {banner ? "Edit Banner" : "Create Banner"}
          </Text>
        </DashboardModal.Header>

        <Box
          as="form"
          onSubmit={handleSubmit}
          className={classes.form}
          paddingBottom={2}
          overflowY="auto"
        >
          {errors.general && (
            <Text className={classes.errorText} size={2}>
              {errors.general}
            </Text>
          )}

          <Box className={classes.section}>
            <Text className={classes.sectionTitle} size={3}>
              Basic Information
            </Text>
            <TextField
              label="Title"
              value={formData.title}
              onChange={event => handleInputChange("title", event.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={event => handleInputChange("description", event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <Box className={classes.section}>
              <Text size={2} fontWeight="medium">
                Image
              </Text>
              {previewUrl && (
                <Box className={classes.imagePreview}>
                  <img
                    src={previewUrl}
                    alt={formData.altText || formData.title || "Banner preview"}
                    className={classes.image}
                  />
                  <Box className={classes.imageActions}>
                    <Text size={2} fontWeight="medium">
                      {formData.image?.name || "Current image"}
                    </Text>
                    <Box display="flex" gap={2}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="tertiary"
                        onClick={() => handleInputChange("imageUrl", "")}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
              {!previewUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload image
                </Button>
              )}
              <input
                ref={fileInputRef}
                className={classes.hiddenInput}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <Text className={errors.image ? classes.errorText : classes.helperText} size={2}>
                {errors.image || "Use an image file for the banner preview."}
              </Text>
            </Box>
            <TextField
              label="Alt text"
              value={formData.altText}
              onChange={event => handleInputChange("altText", event.target.value)}
              fullWidth
              helperText="Describe the image for accessibility."
            />
          </Box>

          <Divider />

          <Box className={classes.section}>
            <Text className={classes.sectionTitle} size={3}>
              Link Configuration
            </Text>
            <Box className={classes.twoColumns}>
              <TextField
                label="Link URL"
                type="url"
                value={formData.linkUrl}
                onChange={event => handleInputChange("linkUrl", event.target.value)}
                fullWidth
                placeholder="https://example.com"
              />
              <TextField
                label="Button text"
                value={formData.linkText}
                onChange={event => handleInputChange("linkText", event.target.value)}
                fullWidth
              />
            </Box>
          </Box>

          <Divider />

          <Box className={classes.section}>
            <Text className={classes.sectionTitle} size={3}>
              Custom Fields
            </Text>
            <Box className={classes.threeColumns}>
              {customFields.map(({ field, label }) => (
                <TextField
                  key={field}
                  label={label}
                  value={formData[field]}
                  onChange={event => handleInputChange(field, event.target.value)}
                  fullWidth
                />
              ))}
            </Box>
          </Box>

          <Divider />

          <Box className={classes.section}>
            <Text className={classes.sectionTitle} size={3}>
              Scheduling
            </Text>
            <Box className={classes.twoColumns}>
              <TextField
                label="Start date"
                type="datetime-local"
                value={formatDateTimeLocal(formData.startDate)}
                onChange={event =>
                  handleInputChange("startDate", parseDateTimeLocal(event.target.value))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
              />
              <TextField
                label="End date"
                type="datetime-local"
                value={formatDateTimeLocal(formData.endDate)}
                onChange={event =>
                  handleInputChange("endDate", parseDateTimeLocal(event.target.value))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate}
              />
            </Box>
            <TextField
              label="Position"
              type="number"
              value={formData.position}
              onChange={event => handleInputChange("position", Number(event.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Box>

          <Divider />

          <Box className={classes.checkboxWrapper}>
            <Checkbox
              checked={formData.isActive}
              onCheckedChange={checked => handleInputChange("isActive", !!checked)}
            >
              <Text>Active</Text>
            </Checkbox>
            <Text size={2} className={classes.helperText}>
              Inactive banners stay saved but won&apos;t be shown in the collection.
            </Text>
          </Box>
        </Box>

        <DashboardModal.Actions>
          <BackButton onClick={onClose} />
          <ConfirmButton
            type="submit"
            transitionState={confirmButtonState}
            onClick={handleSubmit}
            data-test-id="banner-save-button"
          >
            {banner ? "Update Banner" : "Create Banner"}
          </ConfirmButton>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

BannerModal.displayName = "BannerModal";

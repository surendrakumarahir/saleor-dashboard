import { useMutation } from "@apollo/client";
import BackButton from "@dashboard/components/BackButton";
import {
  ConfirmButton,
  type ConfirmButtonTransitionState,
} from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import { SaleorThrobber } from "@dashboard/components/Throbber";
import { TextField } from "@material-ui/core";
import { makeStyles } from "@saleor/macaw-ui";
import { Box, Button, Checkbox, Divider, Text, vars } from "@saleor/macaw-ui-next";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import slugify from "slugify";

import { CREATE_BANNER, DELETE_BANNER_IMAGE, UPDATE_BANNER, UPLOAD_BANNER_IMAGE } from "../queries";
import {
  type Banner,
  type BannerError,
  type BannerFormData,
  type CreateBannerResponse,
  type DeleteBannerImageResponse,
  type UpdateBannerResponse,
  type UploadBannerImageResponse,
} from "../types";

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: Banner) => void;
  banner?: Banner;
  collectionId: string;
  collectionName?: string;
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
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "1fr",
      },
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
    folderButtons: {
      display: "flex",
      flexWrap: "wrap",
      gap: theme.spacing(1),
    },
    imageStatusRow: {
      alignItems: "center",
      display: "flex",
      gap: theme.spacing(1),
    },
  }),
  { name: "BannerModal" },
);

const getDefaultUploadFolder = (collectionName?: string) => {
  const normalizedCollectionName = collectionName
    ? slugify(collectionName, {
        lower: true,
        strict: true,
        trim: true,
      })
    : "";

  if (!normalizedCollectionName) {
    return "banners";
  }

  return `banners/${normalizedCollectionName}`;
};

const createInitialFormData = (
  banner: Banner | undefined,
  defaultPosition: number,
  collectionName?: string,
): BannerFormData => {
  if (banner) {
    return {
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
      imageKey: "",
      uploadFolder: getDefaultUploadFolder(collectionName),
    };
  }

  return {
    title: "",
    description: "",
    altText: "",
    linkUrl: "",
    linkText: "",
    customField1: "",
    customField2: "",
    customField3: "",
    position: defaultPosition,
    isActive: true,
    startDate: "",
    endDate: "",
    imageUrl: "",
    imageKey: "",
    uploadFolder: getDefaultUploadFolder(collectionName),
  };
};

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

const getBannerErrorMessage = (error: BannerError) => {
  switch (error.code) {
    case "IMAGE_UPLOAD_ERROR":
      return error.message || "Image upload failed. Try again.";
    case "IMAGE_IN_USE":
      return error.message || "This image is already used by a banner.";
    case "IMAGE_NOT_FOUND":
      return error.message || "The selected image could not be found.";
    default:
      return error.message || "Something went wrong. Try again.";
  }
};

export const BannerModal = ({
  isOpen,
  onClose,
  onSave,
  banner,
  collectionId,
  collectionName,
  defaultPosition = 0,
}: BannerModalProps) => {
  const classes = useStyles({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageSavedRef = useRef(false);

  const [formData, setFormData] = useState<BannerFormData>(
    createInitialFormData(banner, defaultPosition, collectionName),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const [createBanner] = useMutation<CreateBannerResponse>(CREATE_BANNER);
  const [updateBanner] = useMutation<UpdateBannerResponse>(UPDATE_BANNER);
  const [uploadBannerImage] = useMutation<UploadBannerImageResponse>(UPLOAD_BANNER_IMAGE);
  const [deleteBannerImage] = useMutation<DeleteBannerImageResponse>(DELETE_BANNER_IMAGE);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    uploadedImageSavedRef.current = false;
    setFormData(createInitialFormData(banner, defaultPosition, collectionName));
    setErrors({});
  }, [banner, collectionName, defaultPosition, isOpen]);

  const folderOptions = useMemo(() => {
    return Array.from(new Set(["banners", getDefaultUploadFolder(collectionName)])).filter(Boolean);
  }, [collectionName]);

  const isBusy = isSaving || isUploading || isDeletingImage;
  const previewUrl = formData.imageUrl;
  const hasExistingBannerImage = Boolean(banner?.image);

  const setFormError = (field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message,
    }));
  };

  const clearFormError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) {
        return prev;
      }

      const nextErrors = { ...prev };

      delete nextErrors[field];

      return nextErrors;
    });
  };

  const clearImageState = () => {
    setFormData(prev => ({
      ...prev,
      imageKey: "",
      imageUrl: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const applyApiErrors = (apiErrors: BannerError[], fallbackField: string = "general") => {
    const nextErrors = apiErrors.reduce<Record<string, string>>((acc, error) => {
      const field = error.field || fallbackField;

      acc[field] = getBannerErrorMessage(error);

      return acc;
    }, {});

    setErrors(prev => ({
      ...prev,
      ...nextErrors,
    }));
  };

  const requestDeleteUploadedImage = async (
    fileKey: string,
    force = false,
    silent = false,
  ): Promise<"deleted" | "inUse" | "failed"> => {
    try {
      const response = await deleteBannerImage({
        variables: {
          fileKey,
          force,
        },
      });

      const mutationResult = response.data?.deleteBannerImage;

      if (mutationResult?.success) {
        return "deleted";
      }

      if (!mutationResult?.errors?.length) {
        if (!silent) {
          setFormError("image", "Unable to delete the uploaded image.");
        }

        return "failed";
      }

      const imageInUseError = mutationResult.errors.find(error => error.code === "IMAGE_IN_USE");

      if (imageInUseError && !force) {
        return "inUse";
      }

      if (!silent) {
        applyApiErrors(mutationResult.errors, "image");
      }

      return "failed";
    } catch (error) {
      if (!silent) {
        setFormError(
          "image",
          error instanceof Error ? error.message : "Unable to delete the uploaded image.",
        );
      }

      return "failed";
    }
  };

  const cleanupPendingUpload = async () => {
    if (!formData.imageKey || uploadedImageSavedRef.current) {
      return;
    }

    await requestDeleteUploadedImage(formData.imageKey, true, true);
  };

  const handleModalClose = () => {
    void cleanupPendingUpload();
    onClose();
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Title is required";
    }

    if (!formData.imageUrl) {
      nextErrors.image = "Upload an image before saving.";
    }

    if (!banner && !formData.imageKey) {
      nextErrors.image = "Upload an image before creating the banner.";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start >= end) {
        nextErrors.startDate = "Start date must be before end date.";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = <T extends keyof BannerFormData>(
    field: T,
    value: BannerFormData[T],
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    clearFormError(field);
  };

  const handleImageUpload = async (file: File) => {
    clearFormError("image");
    clearFormError("uploadFolder");

    const previousUnsavedFileKey = uploadedImageSavedRef.current ? "" : formData.imageKey || "";

    if (previousUnsavedFileKey) {
      await requestDeleteUploadedImage(previousUnsavedFileKey, true, true);
    }

    setIsUploading(true);

    try {
      const response = await uploadBannerImage({
        variables: {
          file,
          folder: formData.uploadFolder.trim() || undefined,
        },
      });

      const mutationResult = response.data?.uploadBannerImage;

      if (mutationResult?.errors?.length) {
        clearImageState();
        applyApiErrors(mutationResult.errors, "image");

        return;
      }

      if (!mutationResult?.fileKey || !mutationResult.uploadedFile?.url) {
        clearImageState();
        setFormError("image", "Image upload did not return a file key.");

        return;
      }

      setFormData(prev => ({
        ...prev,
        imageKey: mutationResult.fileKey || "",
        imageUrl: mutationResult.uploadedFile?.url || "",
      }));
    } catch (error) {
      clearImageState();
      setFormError(
        "image",
        error instanceof Error ? error.message : "Image upload failed. Try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await handleImageUpload(file);
  };

  const handleRemoveImage = async () => {
    clearFormError("image");

    if (!formData.imageKey) {
      clearImageState();

      return;
    }

    setIsDeletingImage(true);

    try {
      const result = await requestDeleteUploadedImage(formData.imageKey);

      if (result === "inUse") {
        const shouldForceDelete = window.confirm(
          "This image is already used by a banner. Delete it everywhere and remove it here?",
        );

        if (!shouldForceDelete) {
          return;
        }

        const forcedResult = await requestDeleteUploadedImage(formData.imageKey, true);

        if (forcedResult !== "deleted") {
          return;
        }
      } else if (result !== "deleted") {
        return;
      }

      clearImageState();
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();

    if (isBusy || !validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const sharedInput = {
        title: formData.title,
        description: formData.description,
        altText: formData.altText,
        linkUrl: formData.linkUrl,
        linkText: formData.linkText,
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
          variables: {
            id: banner.id,
            ...sharedInput,
            imageKey: formData.imageKey || undefined,
          },
        });

        if (response.data?.updateBanner?.banner) {
          uploadedImageSavedRef.current = true;
          onSave(response.data.updateBanner.banner);
          onClose();

          return;
        }

        if (response.data?.updateBanner?.errors?.length) {
          applyApiErrors(response.data.updateBanner.errors);
        }
      } else {
        const response = await createBanner({
          variables: {
            collectionId,
            ...sharedInput,
            imageKey: formData.imageKey,
          },
        });

        if (response.data?.createBanner?.banner) {
          uploadedImageSavedRef.current = true;
          onSave(response.data.createBanner.banner);
          onClose();

          return;
        }

        if (response.data?.createBanner?.errors?.length) {
          applyApiErrors(response.data.createBanner.errors);
        }
      }
    } catch (error) {
      setFormError("general", error instanceof Error ? error.message : "Unable to save banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmButtonState: ConfirmButtonTransitionState = isSaving ? "loading" : "default";

  if (!isOpen) {
    return null;
  }

  return (
    <DashboardModal open={isOpen} onChange={handleModalClose}>
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
              <TextField
                label="Upload folder"
                value={formData.uploadFolder}
                onChange={event => handleInputChange("uploadFolder", event.target.value)}
                error={!!errors.uploadFolder}
                helperText={
                  errors.uploadFolder || "Choose where uploaded banner files should live."
                }
                fullWidth
              />
              <Box className={classes.folderButtons}>
                {folderOptions.map(folder => (
                  <Button
                    key={folder}
                    type="button"
                    size="small"
                    variant={formData.uploadFolder === folder ? "secondary" : "tertiary"}
                    onClick={() => handleInputChange("uploadFolder", folder)}
                  >
                    {folder}
                  </Button>
                ))}
              </Box>

              {previewUrl && (
                <Box className={classes.imagePreview}>
                  <img
                    src={previewUrl}
                    alt={formData.altText || formData.title || "Banner preview"}
                    className={classes.image}
                  />
                  <Box className={classes.imageActions}>
                    <Text size={2} fontWeight="medium">
                      {formData.imageKey
                        ? "Uploaded image ready to save"
                        : hasExistingBannerImage
                          ? "Current banner image"
                          : "Selected image"}
                    </Text>
                    {formData.imageKey && (
                      <Text size={2} className={classes.helperText}>
                        File key: {formData.imageKey}
                      </Text>
                    )}
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBusy}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="tertiary"
                        onClick={handleRemoveImage}
                        disabled={isBusy}
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
                  disabled={isBusy}
                >
                  Upload image
                </Button>
              )}

              <input
                ref={fileInputRef}
                className={classes.hiddenInput}
                type="file"
                accept="image/*"
                onChange={event => {
                  void handleImageChange(event);
                }}
              />

              {(isUploading || isDeletingImage) && (
                <Box className={classes.imageStatusRow}>
                  <SaleorThrobber size={16} />
                  <Text size={2} className={classes.helperText}>
                    {isUploading
                      ? `Uploading to ${formData.uploadFolder || "banners"}...`
                      : "Removing uploaded image..."}
                  </Text>
                </Box>
              )}

              <Text className={errors.image ? classes.errorText : classes.helperText} size={2}>
                {errors.image ||
                  "Images upload immediately and the returned file key is used when the banner is saved."}
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
              {(
                [
                  { field: "customField1", label: "Custom field 1" },
                  { field: "customField2", label: "Custom field 2" },
                  { field: "customField3", label: "Custom field 3" },
                ] as const
              ).map(({ field, label }) => (
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
          <BackButton onClick={handleModalClose} disabled={isBusy} />
          <ConfirmButton
            type="submit"
            transitionState={confirmButtonState}
            onClick={handleSubmit}
            data-test-id="banner-save-button"
            disabled={isUploading || isDeletingImage}
          >
            {banner ? "Update Banner" : "Create Banner"}
          </ConfirmButton>
        </DashboardModal.Actions>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

BannerModal.displayName = "BannerModal";

import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { Check, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./ImageEditorModal.module.css";

interface ImageEditorModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (editedDataUrl: string) => void;
}

type AspectRatio = "original" | "1:1" | "3:4" | "4:3" | "16:9";

export const ImageEditorModal = ({
  open,
  imageUrl,
  onClose,
  onSave,
}: ImageEditorModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("original");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const originalImgRef = useRef<HTMLImageElement | null>(null);

  // Determine proxy URL to prevent CORS taint
  const getProxyUrl = useCallback((url: string): string => {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) {
      return url;
    }
    return `/api/amazon-image-proxy?url=${encodeURIComponent(url)}`;
  }, []);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;

    setImageLoaded(false);
    setLoadingError(false);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio("original");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);

    const isDataOrBlob = imageUrl.startsWith("data:") || imageUrl.startsWith("blob:");

    if (isDataOrBlob) {
      const img = new Image();
      img.onload = () => {
        originalImgRef.current = img;
        setImageLoaded(true);
      };
      img.onerror = () => {
        setLoadingError(true);
      };
      img.src = imageUrl;
      return;
    }

    // Remote URL: Use proxy with CORS
    const proxyImg = new Image();
    proxyImg.crossOrigin = "anonymous";
    proxyImg.onload = () => {
      originalImgRef.current = proxyImg;
      setImageLoaded(true);
    };
    proxyImg.onerror = () => {
      // Try direct with crossOrigin
      const directCorsImg = new Image();
      directCorsImg.crossOrigin = "anonymous";
      directCorsImg.onload = () => {
        originalImgRef.current = directCorsImg;
        setImageLoaded(true);
      };
      directCorsImg.onerror = () => {
        // Fallback to direct without crossOrigin
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          originalImgRef.current = fallbackImg;
          setImageLoaded(true);
        };
        fallbackImg.onerror = () => {
          setLoadingError(true);
        };
        fallbackImg.src = imageUrl;
      };
      directCorsImg.src = imageUrl;
    };

    proxyImg.src = getProxyUrl(imageUrl);
  }, [open, imageUrl, getProxyUrl]);

  // Redraw canvas whenever transforms/filters change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.naturalWidth || img.width;
    let sourceHeight = img.naturalHeight || img.height;

    if (!sourceWidth || !sourceHeight) return;

    // Apply Aspect Ratio Crop calculation
    if (aspectRatio === "1:1") {
      const size = Math.min(sourceWidth, sourceHeight);
      sourceX = (sourceWidth - size) / 2;
      sourceY = (sourceHeight - size) / 2;
      sourceWidth = size;
      sourceHeight = size;
    } else if (aspectRatio === "3:4") {
      const targetRatio = 3 / 4;
      const currentRatio = sourceWidth / sourceHeight;
      if (currentRatio > targetRatio) {
        const newWidth = sourceHeight * targetRatio;
        sourceX = (sourceWidth - newWidth) / 2;
        sourceWidth = newWidth;
      } else {
        const newHeight = sourceWidth / targetRatio;
        sourceY = (sourceHeight - newHeight) / 2;
        sourceHeight = newHeight;
      }
    } else if (aspectRatio === "4:3") {
      const targetRatio = 4 / 3;
      const currentRatio = sourceWidth / sourceHeight;
      if (currentRatio > targetRatio) {
        const newWidth = sourceHeight * targetRatio;
        sourceX = (sourceWidth - newWidth) / 2;
        sourceWidth = newWidth;
      } else {
        const newHeight = sourceWidth / targetRatio;
        sourceY = (sourceHeight - newHeight) / 2;
        sourceHeight = newHeight;
      }
    } else if (aspectRatio === "16:9") {
      const targetRatio = 16 / 9;
      const currentRatio = sourceWidth / sourceHeight;
      if (currentRatio > targetRatio) {
        const newWidth = sourceHeight * targetRatio;
        sourceX = (sourceWidth - newWidth) / 2;
        sourceWidth = newWidth;
      } else {
        const newHeight = sourceWidth / targetRatio;
        sourceY = (sourceHeight - newHeight) / 2;
        sourceHeight = newHeight;
      }
    }

    const isRotatedSideways = (rotation / 90) % 2 !== 0;
    const targetCanvasWidth = isRotatedSideways ? sourceHeight : sourceWidth;
    const targetCanvasHeight = isRotatedSideways ? sourceWidth : sourceHeight;

    canvas.width = targetCanvasWidth;
    canvas.height = targetCanvasHeight;

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -sourceWidth / 2,
      -sourceHeight / 2,
      sourceWidth,
      sourceHeight
    );

    ctx.restore();
  }, [aspectRatio, brightness, contrast, flipH, flipV, imageLoaded, rotation, saturation]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleRotate = (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  const handleFlipH = () => setFlipH((prev) => !prev);
  const handleFlipV = () => setFlipV((prev) => !prev);

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio("original");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onSave(dataUrl);
      onClose();
    } catch (e) {
      console.error("Canvas export failed, falling back to original:", e);
      onSave(imageUrl);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Text size={5} fontWeight="bold">
              Edit Product Image
            </Text>
            <Text size={2} color="default2">
              Crop, rotate, and adjust image quality before importing
            </Text>
          </Box>
          <Button variant="tertiary" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.canvasWrapper}>
            {!imageLoaded && !loadingError && (
              <div className={styles.loadingPlaceholder}>
                <div className={styles.spinner} />
                <Text size={3} color="default2">
                  Loading image into editor...
                </Text>
              </div>
            )}
            {loadingError && (
              <div className={styles.loadingPlaceholder}>
                <Text size={3} color="critical1">
                  Unable to load image for editing
                </Text>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              style={{ display: imageLoaded ? "block" : "none" }}
            />
          </div>

          <div className={styles.sidebar}>
            {/* Aspect Ratio Crop */}
            <div className={styles.controlSection}>
              <Text size={2} fontWeight="bold">
                Aspect Ratio Crop
              </Text>
              <div className={styles.aspectGrid}>
                {(
                  [
                    ["original", "Original"],
                    ["1:1", "1:1 Square"],
                    ["3:4", "3:4 Book"],
                    ["4:3", "4:3 Standard"],
                    ["16:9", "16:9 Banner"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.actionButton} ${
                      aspectRatio === key ? styles.activeButton : ""
                    }`}
                    onClick={() => setAspectRatio(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Controls */}
            <div className={styles.controlSection}>
              <Text size={2} fontWeight="bold">
                Rotate & Flip
              </Text>
              <div className={styles.aspectGrid}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => handleRotate(-90)}
                  title="Rotate -90°"
                >
                  <RotateCcw size={15} /> -90°
                </button>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => handleRotate(90)}
                  title="Rotate +90°"
                >
                  <RotateCw size={15} /> +90°
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${flipH ? styles.activeButton : ""}`}
                  onClick={handleFlipH}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal size={15} /> Flip H
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${flipV ? styles.activeButton : ""}`}
                  onClick={handleFlipV}
                  title="Flip Vertical"
                >
                  <FlipVertical size={15} /> Flip V
                </button>
              </div>
            </div>

            {/* Filters & Adjustments */}
            <div className={styles.controlSection}>
              <Text size={2} fontWeight="bold">
                Image Adjustments
              </Text>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Brightness</span>
                  <span className={styles.sliderValue}>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  value={brightness}
                  className={styles.slider}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Contrast</span>
                  <span className={styles.sliderValue}>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  value={contrast}
                  className={styles.slider}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </div>

              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span>Saturation</span>
                  <span className={styles.sliderValue}>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={saturation}
                  className={styles.slider}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                />
              </div>
            </div>

            <Button variant="secondary" onClick={handleReset}>
              Reset to Original
            </Button>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={!imageLoaded}>
            <Check size={16} />
            Apply & Save Edits
          </Button>
        </div>
      </div>
    </div>
  );
};

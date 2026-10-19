import { Box } from "@saleor/macaw-ui-next";
import { Package } from "lucide-react";
import { useState } from "react";

interface ProductThumbnailProps {
  url?: string | null;
  alt?: string;
  size?: number;
  width?: number;
  height?: number;
}

export const ProductThumbnail = ({
  url,
  alt = "",
  size = 60,
  width,
  height,
}: ProductThumbnailProps): JSX.Element => {
  const [hasError, setHasError] = useState(false);
  const finalWidth = width || size;
  const finalHeight = height || size;

  if (url && !hasError) {
    return (
      <Box
        as="img"
        src={url}
        alt={alt}
        __width={finalWidth}
        __height={finalHeight}
        __minWidth={finalWidth}
        __maxWidth={finalWidth}
        borderRadius={2}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
        backgroundColor="default2"
        objectFit="contain"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Box
      __width={finalWidth}
      __height={finalHeight}
      __minWidth={finalWidth}
      __maxWidth={finalWidth}
      borderRadius={2}
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
      backgroundColor="default2"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="default2"
    >
      <Package size={Math.round(Math.min(finalWidth, finalHeight) * 0.55)} />
    </Box>
  );
};


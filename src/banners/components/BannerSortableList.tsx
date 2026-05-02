import { makeStyles } from "@saleor/macaw-ui";
import { Box, Button, Text, vars } from "@saleor/macaw-ui-next";
import { GripVertical } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

import { type Banner } from "../types";

interface BannerSortableListProps {
  banners: Banner[];
  onReorder: (banners: Banner[]) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (bannerId: string) => void;
  disabled?: boolean;
}

const useStyles = makeStyles(
  theme => ({
    emptyState: {
      border: `1px dashed ${vars.colors.border.default1}`,
      borderRadius: theme.spacing(),
      display: "grid",
      gap: theme.spacing(1),
      justifyItems: "center",
      padding: theme.spacing(6),
      textAlign: "center",
    },
    list: {
      display: "grid",
      gap: theme.spacing(2),
    },
    listDraggingOver: {
      background: vars.colors.background.default2,
      borderRadius: theme.spacing(),
      padding: theme.spacing(1),
    },
    card: {
      alignItems: "center",
      background: vars.colors.background.default1,
      border: `1px solid ${vars.colors.border.default1}`,
      borderRadius: theme.spacing(),
      display: "grid",
      gap: theme.spacing(2),
      gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
      padding: theme.spacing(2),
      transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
      [theme.breakpoints.down("sm")]: {
        gridTemplateColumns: "auto minmax(0, 1fr)",
      },
    },
    cardDragging: {
      background: vars.colors.background.default2,
      borderColor: vars.colors.border.default1Focused,
      boxShadow: theme.shadows[4],
    },
    cardDisabled: {
      opacity: 0.7,
    },
    dragHandle: {
      alignItems: "center",
      borderRadius: theme.spacing(0.75),
      color: vars.colors.text.default2,
      cursor: "grab",
      display: "inline-flex",
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    dragHandleDisabled: {
      cursor: "not-allowed",
      opacity: 0.5,
    },
    content: {
      display: "grid",
      gap: theme.spacing(1),
      minWidth: 0,
    },
    metaRow: {
      alignItems: "center",
      display: "flex",
      flexWrap: "wrap",
      gap: theme.spacing(1),
    },
    badge: {
      border: `1px solid ${vars.colors.border.default1}`,
      borderRadius: 999,
      padding: theme.spacing(0.25, 1),
    },
    activeBadge: {
      background: vars.colors.background.success1,
      borderColor: vars.colors.border.success1,
    },
    inactiveBadge: {
      background: vars.colors.background.default2,
    },
    description: {
      color: vars.colors.text.default2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    thumbnail: {
      borderRadius: theme.spacing(),
      height: 48,
      objectFit: "cover",
      width: 48,
      [theme.breakpoints.down("sm")]: {
        gridColumn: "2 / 3",
      },
    },
    actions: {
      display: "flex",
      gap: theme.spacing(1),
      [theme.breakpoints.down("sm")]: {
        gridColumn: "1 / -1",
        justifyContent: "flex-end",
      },
    },
  }),
  { name: "BannerSortableList" },
);

export const BannerSortableList: React.FC<BannerSortableListProps> = ({
  banners,
  onReorder,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const classes = useStyles({});
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);

  const handleDragEnd = useCallback(
    (result: any) => {
      const { source, destination } = result;

      if (!destination) {
        return;
      }

      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const reordered = Array.from(localBanners);
      const [movedBanner] = reordered.splice(source.index, 1);

      reordered.splice(destination.index, 0, movedBanner);

      const updatedBanners = reordered.map((banner, index) => ({
        ...banner,
        position: index,
      }));

      setLocalBanners(updatedBanners);
      onReorder(updatedBanners);
    },
    [localBanners, onReorder],
  );

  useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  if (banners.length === 0) {
    return (
      <Box className={classes.emptyState}>
        <Text size={4} fontWeight="bold">
          No banners yet
        </Text>
        <Text size={2} color="default2">
          Add the first banner to start building this collection.
        </Text>
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="banners-list" type="BANNER">
        {(provided: any, snapshot: any) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`${classes.list} ${snapshot.isDraggingOver ? classes.listDraggingOver : ""}`}
          >
            {localBanners.map((banner, index) => (
              <Draggable
                key={banner.id}
                draggableId={banner.id}
                index={index}
                isDragDisabled={disabled}
              >
                {(draggableProvided: any, draggableSnapshot: any) => (
                  <Box
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    className={`${classes.card} ${
                      draggableSnapshot.isDragging ? classes.cardDragging : ""
                    } ${disabled ? classes.cardDisabled : ""}`}
                  >
                    <Box
                      {...draggableProvided.dragHandleProps}
                      className={`${classes.dragHandle} ${disabled ? classes.dragHandleDisabled : ""}`}
                    >
                      <GripVertical size={18} />
                    </Box>

                    <Box className={classes.content}>
                      <Box className={classes.metaRow}>
                        <Text size={3} fontWeight="bold">
                          {banner.title}
                        </Text>
                        <Box className={classes.badge}>
                          <Text size={1} fontWeight="medium">
                            Position {index + 1}
                          </Text>
                        </Box>
                        <Box
                          className={`${classes.badge} ${
                            banner.isActive ? classes.activeBadge : classes.inactiveBadge
                          }`}
                        >
                          <Text size={1} fontWeight="medium">
                            {banner.isActive ? "Active" : "Inactive"}
                          </Text>
                        </Box>
                      </Box>

                      {banner.description && (
                        <Text size={2} className={classes.description}>
                          {banner.description}
                        </Text>
                      )}

                      {banner.startDate && banner.endDate && (
                        <Text size={1} color="default2">
                          Scheduled: {new Date(banner.startDate).toLocaleDateString()} -{" "}
                          {new Date(banner.endDate).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>

                    {banner.image && (
                      <img
                        src={banner.image}
                        alt={banner.altText || banner.title}
                        className={classes.thumbnail}
                      />
                    )}

                    <Box className={classes.actions}>
                      <Button
                        type="button"
                        onClick={() => onEdit(banner)}
                        disabled={disabled}
                        variant="secondary"
                        size="small"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onDelete(banner.id)}
                        disabled={disabled}
                        variant="error"
                        size="small"
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

BannerSortableList.displayName = "BannerSortableList";

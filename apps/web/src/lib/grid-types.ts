import { z } from "zod";

/** Viewport tab: desktop, tablet, or mobile */
export const viewportSchema = z.enum(["desktop", "tablet", "mobile"]);
export type Viewport = z.infer<typeof viewportSchema>;

/** Container width in grid columns (desktop: 12/6/4, tablet: 8/4) */
export const desktopContainerWidthSchema = z.union([
  z.literal(12),
  z.literal(6),
  z.literal(4),
]);
export type DesktopContainerWidth = z.infer<typeof desktopContainerWidthSchema>;

export const tabletContainerWidthSchema = z.union([
  z.literal(8),
  z.literal(4),
]);
export type TabletContainerWidth = z.infer<typeof tabletContainerWidthSchema>;

/** Placement of an element in the grid (1-based col/row for JSON and UI) */
export const placementSchema = z.object({
  col: z.number().int().min(1),
  row: z.number().int().min(1),
  colSpan: z.number().int().min(1),
  rowSpan: z.number().int().min(1),
});
export type Placement = z.infer<typeof placementSchema>;

/** Placements keyed by viewport; element can have placement only on some viewports */
export const placementsSchema = z.object({
  desktop: placementSchema.optional(),
  tablet: placementSchema.optional(),
  mobile: placementSchema.optional(),
});
export type Placements = z.infer<typeof placementsSchema>;

/** Grid element with id, description, and optional placement per viewport */
export const gridElementSchema = z.object({
  id: z.string(),
  description: z.string(),
  placements: placementsSchema,
});
export type GridElement = z.infer<typeof gridElementSchema>;

/** Viewport config: container widths for desktop and tablet (mobile is always full) */
export const viewportConfigSchema = z.object({
  desktop: z.object({ containerWidth: desktopContainerWidthSchema }),
  tablet: z.object({ containerWidth: tabletContainerWidthSchema }),
});
export type ViewportConfig = z.infer<typeof viewportConfigSchema>;

/** Grid dimensions (cols × rows) for one viewport */
export const gridDimensionsSchema = z.object({
  cols: z.number().int().min(1).max(24),
  rows: z.number().int().min(1).max(48),
});
export type GridDimensions = z.infer<typeof gridDimensionsSchema>;

/** Grid dimensions per viewport (desktop, tablet, mobile can each have different cols/rows) */
export const gridPerViewportSchema = z.object({
  desktop: gridDimensionsSchema,
  tablet: gridDimensionsSchema,
  mobile: gridDimensionsSchema,
});
export type GridPerViewport = z.infer<typeof gridPerViewportSchema>;

/** Full layout export/import format (grid is per-viewport) */
export const layoutExportSchema = z.object({
  version: z.literal(1),
  viewportConfig: viewportConfigSchema,
  grid: gridPerViewportSchema,
  elements: z.array(gridElementSchema),
});
export type LayoutExport = z.infer<typeof layoutExportSchema>;

export const MIN_COLS = 1;
export const MAX_COLS = 24;
export const MIN_ROWS = 1;
export const MAX_ROWS = 48;

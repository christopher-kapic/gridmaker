import { create } from "zustand";
import type {
  Viewport,
  ViewportConfig,
  GridPerViewport,
  GridElement,
  Placement,
  Placements,
  LayoutExport,
} from "@/lib/grid-types";
import {
  layoutExportSchema,
  MIN_COLS,
  MAX_COLS,
  MIN_ROWS,
  MAX_ROWS,
} from "@/lib/grid-types";

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultViewportConfig: ViewportConfig = {
  desktop: { containerWidth: 12 },
  tablet: { containerWidth: 8 },
};

const defaultGridPerViewport: GridPerViewport = {
  desktop: { cols: 6, rows: 2 },
  tablet: { cols: 4, rows: 2 },
  mobile: { cols: 1, rows: 2 },
};

export interface GridState {
  viewport: Viewport;
  viewportConfig: ViewportConfig;
  grid: GridPerViewport;
  elements: GridElement[];
  // Actions
  setViewport: (v: Viewport) => void;
  setDesktopContainerWidth: (w: 12 | 6 | 4) => void;
  setTabletContainerWidth: (w: 8 | 4) => void;
  setGridCols: (cols: number) => void;
  setGridRows: (rows: number) => void;
  addRow: () => void;
  removeRow: (rowIndex1Based: number) => void;
  addColumn: () => void;
  removeColumn: (colIndex1Based: number) => void;
  addElement: (description: string) => void;
  removeElement: (id: string) => void;
  updateElementDescription: (id: string, description: string) => void;
  setPlacement: (
    elementId: string,
    viewport: Viewport,
    placement: Placement | null
  ) => void;
  movePlacement: (
    elementId: string,
    viewport: Viewport,
    col: number,
    row: number
  ) => void;
  resizePlacement: (
    elementId: string,
    viewport: Viewport,
    colSpan: number,
    rowSpan: number
  ) => void;
  loadFromJson: (json: string) => { success: true } | { success: false; error: string };
  toJson: () => string;
  toMarkdown: () => string;
}

function clampPlacement(
  p: Placement,
  cols: number,
  rows: number
): Placement | null {
  if (p.col < 1 || p.row < 1) return null;
  const colSpan = Math.max(1, Math.min(p.colSpan, cols - p.col + 1));
  const rowSpan = Math.max(1, Math.min(p.rowSpan, rows - p.row + 1));
  if (p.col + colSpan - 1 > cols || p.row + rowSpan - 1 > rows) return null;
  return { ...p, colSpan, rowSpan };
}

/** Adjust a single viewport's placement after removing a row; returns new placement or undefined */
function adjustPlacementAfterRemoveRow(
  p: Placement | undefined,
  removedRow1Based: number,
  newRows: number
): Placement | undefined {
  if (!p) return undefined;
  const endRow = p.row + p.rowSpan - 1;
  let next: Placement | undefined;
  if (endRow < removedRow1Based) {
    next = p.row > removedRow1Based ? { ...p, row: p.row - 1 } : p;
  } else if (p.row > removedRow1Based) {
    next = { ...p, row: p.row - 1 };
  } else if (p.row === removedRow1Based) {
    next = p.rowSpan > 1 ? { ...p, rowSpan: p.rowSpan - 1 } : undefined;
  } else {
    next = { ...p, rowSpan: p.rowSpan - 1 };
  }
  if (next && (next.row < 1 || next.row + next.rowSpan - 1 > newRows)) return undefined;
  return next;
}

/** Adjust a single viewport's placement after removing a column */
function adjustPlacementAfterRemoveColumn(
  p: Placement | undefined,
  removedCol1Based: number,
  newCols: number
): Placement | undefined {
  if (!p) return undefined;
  const endCol = p.col + p.colSpan - 1;
  let next: Placement | undefined;
  if (endCol < removedCol1Based) {
    next = p.col > removedCol1Based ? { ...p, col: p.col - 1 } : p;
  } else if (p.col > removedCol1Based) {
    next = { ...p, col: p.col - 1 };
  } else if (p.col === removedCol1Based) {
    next = p.colSpan > 1 ? { ...p, colSpan: p.colSpan - 1 } : undefined;
  } else {
    next = { ...p, colSpan: p.colSpan - 1 };
  }
  if (next && (next.col < 1 || next.col + next.colSpan - 1 > newCols)) return undefined;
  return next;
}

export const useGridStore = create<GridState>((set, get) => ({
  viewport: "desktop",
  viewportConfig: defaultViewportConfig,
  grid: defaultGridPerViewport,
  elements: [],

  setViewport: (viewport) => set({ viewport }),

  setDesktopContainerWidth: (containerWidth) =>
    set((s) => ({
      viewportConfig: {
        ...s.viewportConfig,
        desktop: { containerWidth },
      },
    })),

  setTabletContainerWidth: (containerWidth) =>
    set((s) => ({
      viewportConfig: {
        ...s.viewportConfig,
        tablet: { containerWidth },
      },
    })),

  setGridCols: (cols) =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      const c = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
      const elements = s.elements.map((el) => {
        const p = el.placements[vp];
        const next = p ? clampPlacement(p, c, g.rows) ?? undefined : undefined;
        return { ...el, placements: { ...el.placements, [vp]: next } };
      });
      return {
        grid: { ...s.grid, [vp]: { ...g, cols: c } },
        elements,
      };
    }),

  setGridRows: (rows) =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      const r = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows));
      const elements = s.elements.map((el) => {
        const p = el.placements[vp];
        const next = p ? clampPlacement(p, g.cols, r) ?? undefined : undefined;
        return { ...el, placements: { ...el.placements, [vp]: next } };
      });
      return {
        grid: { ...s.grid, [vp]: { ...g, rows: r } },
        elements,
      };
    }),

  addRow: () =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      return {
        grid: {
          ...s.grid,
          [vp]: { ...g, rows: Math.min(MAX_ROWS, g.rows + 1) },
        },
      };
    }),

  removeRow: (rowIndex1Based) =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      if (g.rows <= MIN_ROWS) return s;
      const newRows = g.rows - 1;
      const elements = s.elements.map((el) => ({
        ...el,
        placements: {
          ...el.placements,
          [vp]: adjustPlacementAfterRemoveRow(el.placements[vp], rowIndex1Based, newRows),
        },
      }));
      return {
        grid: { ...s.grid, [vp]: { ...g, rows: newRows } },
        elements,
      };
    }),

  addColumn: () =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      return {
        grid: {
          ...s.grid,
          [vp]: { ...g, cols: Math.min(MAX_COLS, g.cols + 1) },
        },
      };
    }),

  removeColumn: (colIndex1Based) =>
    set((s) => {
      const vp = s.viewport;
      const g = s.grid[vp];
      if (g.cols <= MIN_COLS) return s;
      const newCols = g.cols - 1;
      const elements = s.elements.map((el) => ({
        ...el,
        placements: {
          ...el.placements,
          [vp]: adjustPlacementAfterRemoveColumn(el.placements[vp], colIndex1Based, newCols),
        },
      }));
      return {
        grid: { ...s.grid, [vp]: { ...g, cols: newCols } },
        elements,
      };
    }),

  addElement: (description) =>
    set((s) => ({
      elements: [
        ...s.elements,
        {
          id: generateId(),
          description,
          placements: {},
        },
      ],
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
    })),

  updateElementDescription: (id, description) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id !== id ? el : { ...el, description: description.trim() }
      ),
    })),

  setPlacement: (elementId, viewport, placement) =>
    set((s) => {
      const g = s.grid[viewport];
      const normalized =
        placement && clampPlacement(placement, g.cols, g.rows);
      return {
        elements: s.elements.map((el) =>
          el.id !== elementId
            ? el
            : {
                ...el,
                placements: {
                  ...el.placements,
                  [viewport]: normalized ?? undefined,
                },
              }
        ),
      };
    }),

  movePlacement: (elementId, viewport, col, row) =>
    set((s) => {
      const g = s.grid[viewport];
      return {
        elements: s.elements.map((el) => {
          if (el.id !== elementId) return el;
          const current = el.placements[viewport];
          if (!current) return el;
          const colSpan = Math.min(current.colSpan, g.cols - col + 1);
          const rowSpan = Math.min(current.rowSpan, g.rows - row + 1);
          const placement: Placement = {
            col: Math.max(1, col),
            row: Math.max(1, row),
            colSpan: Math.max(1, colSpan),
            rowSpan: Math.max(1, rowSpan),
          };
          const clamped = clampPlacement(placement, g.cols, g.rows);
          return {
            ...el,
            placements: {
              ...el.placements,
              [viewport]: clamped ?? current,
            },
          };
        }),
      };
    }),

  resizePlacement: (elementId, viewport, colSpan, rowSpan) =>
    set((s) => {
      const g = s.grid[viewport];
      return {
        elements: s.elements.map((el) => {
          if (el.id !== elementId) return el;
          const current = el.placements[viewport];
          if (!current) return el;
          const placement: Placement = {
            col: current.col,
            row: current.row,
            colSpan: Math.max(1, Math.min(colSpan, g.cols - current.col + 1)),
            rowSpan: Math.max(1, Math.min(rowSpan, g.rows - current.row + 1)),
          };
          const clamped = clampPlacement(placement, g.cols, g.rows);
          return {
            ...el,
            placements: {
              ...el.placements,
              [viewport]: clamped ?? current,
            },
          };
        }),
      };
    }),

  loadFromJson: (json: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : "Invalid JSON",
      };
    }
    const result = layoutExportSchema.safeParse(parsed);
    if (!result.success) {
      return { success: false as const, error: result.error.message };
    }
    const data = result.data;
    set({
      viewportConfig: data.viewportConfig,
      grid: data.grid,
      elements: data.elements,
    });
    return { success: true as const };
  },

  toJson: () => {
    const s = get();
    const exportData: LayoutExport = {
      version: 1,
      viewportConfig: s.viewportConfig,
      grid: s.grid,
      elements: s.elements,
    };
    return JSON.stringify(exportData, null, 2);
  },

  toMarkdown: () => {
    const s = get();
    const lines: string[] = [];
    lines.push("# Tailwind Grid Layout");
    lines.push("");
    lines.push("## Grid dimensions");
    for (const vp of ["desktop", "tablet", "mobile"] as const) {
      const g = s.grid[vp];
      const label = vp.charAt(0).toUpperCase() + vp.slice(1);
      lines.push(`- **${label}**: ${g.cols} columns × ${g.rows} rows`);
    }
    lines.push("");
    lines.push("## Container width (in 12-col context)");
    lines.push(
      `- **Desktop**: ${s.viewportConfig.desktop.containerWidth}/12 columns`
    );
    lines.push(
      `- **Tablet**: ${s.viewportConfig.tablet.containerWidth}/8 columns`
    );
    lines.push("- **Mobile**: full width");
    lines.push("");
    for (const vp of ["desktop", "tablet", "mobile"] as const) {
      const label = vp.charAt(0).toUpperCase() + vp.slice(1);
      lines.push(`## ${label}`);
      const withPlacement = s.elements.filter((el) => el.placements[vp]);
      if (withPlacement.length === 0) {
        lines.push("No elements placed.");
      } else {
        for (const el of withPlacement) {
          const p = el.placements[vp]!;
          lines.push(
            `- **${el.description}**: col ${p.col}, row ${p.row}, col-span ${p.colSpan}, row-span ${p.rowSpan}`
          );
        }
      }
      lines.push("");
    }
    // lines.push("## JSON (for import)");
    // lines.push("```json");
    // lines.push(s.toJson());
    // lines.push("```");
    return lines.join("\n");
  },
}));

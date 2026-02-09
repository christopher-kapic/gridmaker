"use client";

import { useRef, useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGridStore } from "@/store/grid-store";
import { MIN_COLS, MIN_ROWS, MAX_COLS, MAX_ROWS } from "@/lib/grid-types";
import { GRID_ELEMENT_TYPE, PLACED_ITEM_TYPE } from "@/lib/dnd-types";
import { motion } from "motion/react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Placement } from "@/lib/grid-types";

const CELL_MIN_SIZE = 64;
const GAP = 8;

type DropItem =
  | { elementId: string; fromSidebar?: true }
  | { elementId: string; fromPlaced: true };

function PlacedBlock({
  elementId,
  description,
  placement,
  dataAreaRef,
  gridCols,
  gridRows,
}: {
  elementId: string;
  description: string;
  placement: Placement;
  dataAreaRef: React.RefObject<HTMLDivElement | null>;
  gridCols: number;
  gridRows: number;
}) {
  const viewport = useGridStore((s) => s.viewport);
  const setPlacement = useGridStore((s) => s.setPlacement);
  const resizePlacement = useGridStore((s) => s.resizePlacement);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: PLACED_ITEM_TYPE,
    item: { elementId, fromPlaced: true as const },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const removeFromGrid = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlacement(elementId, viewport, null);
    },
    [elementId, viewport, setPlacement]
  );

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const onMouseMove = (e: MouseEvent) => {
        const el = dataAreaRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cellWidth = (rect.width - GAP * (gridCols - 1)) / gridCols;
        const cellHeight = (rect.height - GAP * (gridRows - 1)) / gridRows;
        const colIndex0 = Math.floor((e.clientX - rect.left) / (cellWidth + GAP));
        const rowIndex0 = Math.floor((e.clientY - rect.top) / (cellHeight + GAP));
        const startCol0 = placement.col - 1;
        const startRow0 = placement.row - 1;
        const endCol0 = Math.max(
          startCol0,
          Math.min(gridCols - 1, colIndex0)
        );
        const endRow0 = Math.max(
          startRow0,
          Math.min(gridRows - 1, rowIndex0)
        );
        const newColSpan = Math.max(1, endCol0 - startCol0 + 1);
        const newRowSpan = Math.max(1, endRow0 - startRow0 + 1);
        resizePlacement(elementId, viewport, newColSpan, newRowSpan);
      };
      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [
      dataAreaRef,
      elementId,
      viewport,
      placement.col,
      placement.row,
      gridCols,
      gridRows,
      resizePlacement,
    ]
  );

  return (
    <motion.div
      ref={drag}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "border-primary/50 bg-primary/15 relative flex cursor-grab flex-col rounded-lg border p-3 active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
      style={{
        gridColumn: `${placement.col} / span ${placement.colSpan}`,
        gridRow: `${placement.row} / span ${placement.rowSpan}`,
        minHeight: 0,
        zIndex: 10,
      }}
    >
      {/* X remove - top right */}
      <button
        type="button"
        className="hover:bg-destructive/20 text-muted-foreground hover:text-destructive absolute right-1 top-1 flex size-6 shrink-0 items-center justify-center rounded"
        onClick={removeFromGrid}
        aria-label="Remove from grid"
      >
        <X className="size-4" />
      </button>

      {/* Content - centered */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <span className="truncate text-center text-sm font-medium">
          {description}
        </span>
      </div>

      {/* L-shaped resize handle - bottom right */}
      <button
        type="button"
        className="hover:bg-primary/30 border-primary/50 absolute bottom-1 right-1 flex size-5 shrink-0 cursor-se-resize items-end justify-end rounded border-b border-r bg-background/80 p-0.5"
        onMouseDown={onResizeMouseDown}
        aria-label="Resize"
      >
        <span className="sr-only">Resize</span>
      </button>
    </motion.div>
  );
}

function DroppableCell({
  col,
  row,
}: {
  col: number;
  row: number;
}) {
  const viewport = useGridStore((s) => s.viewport);
  const setPlacement = useGridStore((s) => s.setPlacement);
  const movePlacement = useGridStore((s) => s.movePlacement);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [GRID_ELEMENT_TYPE, PLACED_ITEM_TYPE],
      drop: (item: DropItem) => {
        if ("fromPlaced" in item && item.fromPlaced) {
          movePlacement(item.elementId, viewport, col, row);
        } else {
          setPlacement(item.elementId, viewport, {
            col,
            row,
            colSpan: 1,
            rowSpan: 1,
          });
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [viewport, col, row, setPlacement, movePlacement]
  );

  return (
    <motion.div
      ref={drop}
      layout
      className={cn(
        "border-border bg-muted/20 flex min-h-[64px] min-w-[64px] items-center justify-center rounded-lg border border-dashed transition-colors",
        isOver && "bg-primary/20 border-primary"
      )}
      style={{
        gridColumn: col,
        gridRow: row,
      }}
    />
  );
}

export default function GridBuilder() {
  const dataAreaRef = useRef<HTMLDivElement>(null);
  const gridPerViewport = useGridStore((s) => s.grid);
  const viewport = useGridStore((s) => s.viewport);
  const grid = gridPerViewport[viewport];
  const elements = useGridStore((s) => s.elements);
  const setGridCols = useGridStore((s) => s.setGridCols);
  const setGridRows = useGridStore((s) => s.setGridRows);
  const addRow = useGridStore((s) => s.addRow);
  const addColumn = useGridStore((s) => s.addColumn);
  const removeRow = useGridStore((s) => s.removeRow);
  const removeColumn = useGridStore((s) => s.removeColumn);

  const canRemoveRow = grid.rows > MIN_ROWS;
  const canRemoveCol = grid.cols > MIN_COLS;
  const placedElements = elements.filter((el) => el.placements[viewport]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: Columns, Rows inputs + Add/Remove */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grid-cols" className="text-xs">
            Columns
          </Label>
          <div className="flex items-center gap-1">
            <Input
              id="grid-cols"
              type="number"
              min={MIN_COLS}
              max={MAX_COLS}
              value={grid.cols}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setGridCols(n);
              }}
              className="w-20"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={!canRemoveCol}
              onClick={() => removeColumn(grid.cols)}
              aria-label="Remove column"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={grid.cols >= MAX_COLS}
              onClick={addColumn}
              aria-label="Add column"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grid-rows" className="text-xs">
            Rows
          </Label>
          <div className="flex items-center gap-1">
            <Input
              id="grid-rows"
              type="number"
              min={MIN_ROWS}
              max={MAX_ROWS}
              value={grid.rows}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setGridRows(n);
              }}
              className="w-20"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={!canRemoveRow}
              onClick={() => removeRow(grid.rows)}
              aria-label="Remove row"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              disabled={grid.rows >= MAX_ROWS}
              onClick={addRow}
              aria-label="Add row"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Single grid: cells + add column + add row + placed blocks overlay */}
      <motion.div
        layout
        className="grid w-full max-w-4xl"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, minmax(${CELL_MIN_SIZE}px, 1fr)) 48px`,
          gridTemplateRows: `repeat(${grid.rows}, minmax(${CELL_MIN_SIZE}px, 1fr)) 48px`,
          gap: GAP,
        }}
      >
        {/* Data area for resize measurement (behind cells) */}
        <div
          ref={dataAreaRef}
          className="pointer-events-none min-h-0"
          style={{
            gridColumn: `1 / ${grid.cols + 1}`,
            gridRow: `1 / ${grid.rows + 1}`,
          }}
          aria-hidden
        />

        {/* Empty cells (drop targets) */}
        {Array.from({ length: grid.rows }, (_, rowIndex) =>
          Array.from({ length: grid.cols }, (_, colIndex) => {
            const col = colIndex + 1;
            const row = rowIndex + 1;
            return (
              <DroppableCell
                key={`cell-${row}-${col}`}
                col={col}
                row={row}
              />
            );
          })
        )}

        {/* Add column - right side, data rows only */}
        <Button
          variant="outline"
          className="border-dashed hover:bg-muted flex min-h-0 w-12 flex-col items-center justify-center self-stretch"
          style={{
            gridColumn: grid.cols + 1,
            gridRow: `1 / span ${grid.rows}`,
          }}
          onClick={addColumn}
          aria-label="Add column"
        >
          <Plus className="size-6" />
        </Button>

        {/* Add row - bottom, full width */}
        <Button
          variant="outline"
          className="border-dashed hover:bg-muted col-span-full flex min-h-[48px] w-full items-center justify-center"
          style={{
            gridColumn: `1 / ${grid.cols + 1}`,
            gridRow: grid.rows + 1,
          }}
          onClick={addRow}
          aria-label="Add row"
        >
          <Plus className="size-6" />
        </Button>

        {/* Placed blocks - overlay on grid using same grid lines */}
        {placedElements.map((el) => (
          <PlacedBlock
            key={el.id}
            elementId={el.id}
            description={el.description}
            placement={el.placements[viewport]!}
            dataAreaRef={dataAreaRef}
            gridCols={grid.cols}
            gridRows={grid.rows}
          />
        ))}
      </motion.div>
    </div>
  );
}

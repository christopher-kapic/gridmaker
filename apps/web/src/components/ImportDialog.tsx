"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGridStore } from "@/store/grid-store";
import { FileUp } from "lucide-react";

const defaultGridPerViewport = {
  desktop: { cols: 6, rows: 2 },
  tablet: { cols: 4, rows: 2 },
  mobile: { cols: 1, rows: 2 },
} as const;

export default function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [error, setError] = useState<string | null>(null);

  const elements = useGridStore((s) => s.elements);
  const grid = useGridStore((s) => s.grid);
  const loadFromJson = useGridStore((s) => s.loadFromJson);

  const hasContent =
    elements.length > 0 ||
    grid.desktop.cols !== defaultGridPerViewport.desktop.cols ||
    grid.desktop.rows !== defaultGridPerViewport.desktop.rows ||
    grid.tablet.cols !== defaultGridPerViewport.tablet.cols ||
    grid.tablet.rows !== defaultGridPerViewport.tablet.rows ||
    grid.mobile.cols !== defaultGridPerViewport.mobile.cols ||
    grid.mobile.rows !== defaultGridPerViewport.mobile.rows;

  const handleImport = useCallback(() => {
    setError(null);
    const text = paste.trim();
    if (!text) {
      setError("Paste JSON first.");
      return;
    }
    if (hasContent && !window.confirm("Replace current layout?")) {
      return;
    }
    const result = loadFromJson(text);
    if (result.success) {
      setPaste("");
      setOpen(false);
    } else {
      setError(result.error);
    }
  }, [paste, hasContent, loadFromJson]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        setError(null);
      }
    },
    []
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => handleOpenChange(true)}
      >
        <FileUp className="size-4" />
        Import
      </Button>

      {open && (
        <div
          className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => handleOpenChange(false)}
          onKeyDown={(e) => e.key === "Escape" && handleOpenChange(false)}
          role="dialog"
          aria-modal
          aria-labelledby="import-dialog-title"
        >
          <Card
            className="border-border flex max-h-[90vh] w-full max-w-lg flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle id="import-dialog-title">Import layout</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <p className="text-muted-foreground shrink-0 text-sm">
                Paste JSON from Copy (or from another user) to load the layout.
              </p>
              <div className="min-h-0 flex-1 overflow-hidden">
                <Textarea
                  placeholder='{"version":1,"viewportConfig":...}'
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  className="h-full min-h-[120px] max-h-[40vh] resize-none font-mono text-xs"
                />
              </div>
              {error && (
                <p className="text-destructive shrink-0 text-sm">{error}</p>
              )}
              <div className="flex shrink-0 justify-end gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>Import</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

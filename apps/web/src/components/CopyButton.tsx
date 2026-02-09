"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGridStore } from "@/store/grid-store";
import { Copy } from "lucide-react";

export default function CopyButton() {
  const [open, setOpen] = useState(false);
  const contextMenuOpenedRef = useRef(false);
  const toJson = useGridStore((s) => s.toJson);
  const toMarkdown = useGridStore((s) => s.toMarkdown);

  const copyJson = useCallback(() => {
    void navigator.clipboard.writeText(toJson());
    setOpen(false);
  }, [toJson]);

  const copyMarkdown = useCallback(() => {
    void navigator.clipboard.writeText(toMarkdown());
    setOpen(false);
  }, [toMarkdown]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (next && !contextMenuOpenedRef.current) return;
    if (!next) contextMenuOpenedRef.current = false;
    setOpen(next);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    contextMenuOpenedRef.current = true;
    setOpen(true);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <div onContextMenu={handleContextMenu}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              copyJson();
            }}
          >
            <Copy className="size-4" />
            Copy
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyMarkdown}>
          Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyJson}>
          Copy as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

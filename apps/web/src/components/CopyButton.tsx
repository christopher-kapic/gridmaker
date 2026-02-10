"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGridStore } from "@/store/grid-store";
import { Copy, ChevronDown } from "lucide-react";

export default function CopyButton() {
  const [open, setOpen] = useState(false);
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <ButtonGroup>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={copyJson}
          onContextMenu={handleContextMenu}
        >
          <Copy className="size-4" />
          Copy
        </Button>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-2" aria-label="Copy options">
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
      </ButtonGroup>
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

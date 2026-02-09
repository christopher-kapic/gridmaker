"use client";

import { useState } from "react";
import { useDrag } from "react-dnd";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGridStore } from "@/store/grid-store";
import { GRID_ELEMENT_TYPE } from "@/lib/dnd-types";
import { Pencil, Plus, Trash2 } from "lucide-react";

function DraggableElement({
  id,
  description,
  onRemove,
  onEdit,
}: {
  id: string;
  description: string;
  onRemove: () => void;
  onEdit: (description: string) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(description);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: GRID_ELEMENT_TYPE,
    item: { elementId: id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleEditOpen = (open: boolean) => {
    setEditOpen(open);
    if (open) setDraft(description);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== description) {
      onEdit(trimmed);
    }
    setEditOpen(false);
  };

  return (
    <li
      ref={drag}
      className="border-border bg-muted/30 flex cursor-grab items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <span className="min-w-0 truncate">{description}</span>
      <div className="flex shrink-0 items-center gap-0.5">
        <Popover open={editOpen} onOpenChange={handleEditOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              aria-label={`Edit ${description}`}
            >
              <Pencil className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor={`edit-desc-${id}`}>Description</Label>
                <Input
                  id={`edit-desc-${id}`}
                  placeholder="e.g. Hero image"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                Save
              </Button>
            </form>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${description}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

export default function ElementsSidebar() {
  const elements = useGridStore((s) => s.elements);
  const addElement = useGridStore((s) => s.addElement);
  const removeElement = useGridStore((s) => s.removeElement);
  const updateElementDescription = useGridStore((s) => s.updateElementDescription);

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (trimmed) {
      addElement(trimmed);
      setDescription("");
      setOpen(false);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Elements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="size-4" />
              Add element
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label htmlFor="element-desc">Description</Label>
                <Input
                  id="element-desc"
                  placeholder="e.g. Hero image"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" disabled={!description.trim()}>
                Add
              </Button>
            </form>
          </PopoverContent>
        </Popover>

        <ul className="flex flex-col gap-2">
          {elements.length === 0 ? (
            <li className="text-muted-foreground text-sm">No elements yet.</li>
          ) : (
            elements.map((el) => (
              <DraggableElement
                key={el.id}
                id={el.id}
                description={el.description}
                onRemove={() => removeElement(el.id)}
                onEdit={(description) => updateElementDescription(el.id, description)}
              />
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

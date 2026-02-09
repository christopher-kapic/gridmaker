"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGridStore } from "@/store/grid-store";
import type {
  Viewport,
  DesktopContainerWidth,
  TabletContainerWidth,
} from "@/lib/grid-types";
import { cn } from "@/lib/utils";
import GridBuilder from "./GridBuilder";
import ElementsSidebar from "./ElementsSidebar";
import CopyButton from "./CopyButton";
import ImportDialog from "./ImportDialog";

const VIEWPORTS: { value: Viewport; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

const DESKTOP_WIDTHS: { value: DesktopContainerWidth; label: string }[] = [
  { value: 12, label: "Full (12)" },
  { value: 6, label: "Half (6)" },
  { value: 4, label: "Third (4)" },
];

const TABLET_WIDTHS: { value: TabletContainerWidth; label: string }[] = [
  { value: 8, label: "Full (8)" },
  { value: 4, label: "Half (4)" },
];

/** Width of grid builder area as fraction of 12-col context for desktop/tablet */
function getContainerWidthClass(
  viewport: Viewport,
  desktopWidth: DesktopContainerWidth,
  tabletWidth: TabletContainerWidth
): string {
  if (viewport === "mobile") return "w-full";
  if (viewport === "tablet") {
    return tabletWidth === 8 ? "w-full" : "w-1/2";
  }
  if (desktopWidth === 12) return "w-full";
  if (desktopWidth === 6) return "w-1/2";
  return "w-1/3";
}

export default function GridMakerApp() {
  const viewport = useGridStore((s) => s.viewport);
  const setViewport = useGridStore((s) => s.setViewport);
  const viewportConfig = useGridStore((s) => s.viewportConfig);
  const setDesktopContainerWidth = useGridStore((s) => s.setDesktopContainerWidth);
  const setTabletContainerWidth = useGridStore((s) => s.setTabletContainerWidth);

  const widthClass = getContainerWidthClass(
    viewport,
    viewportConfig.desktop.containerWidth,
    viewportConfig.tablet.containerWidth
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen flex-col">
        {/* App bar: viewport tabs centered, Copy right */}
      <header className="border-border flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
        <div className="w-20 shrink-0" />
        <Tabs
          value={viewport}
          onValueChange={(v) => setViewport(v as Viewport)}
          className="flex-1 max-w-2xl"
        >
          <TabsList className="bg-muted grid w-full grid-cols-3">
            {VIEWPORTS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex shrink-0 justify-end gap-2">
          <ImportDialog />
          <CopyButton />
        </div>
      </header>

      {/* Main: 12-col grid - sidebar left, content right */}
      <main className="flex flex-1 flex-col gap-6 p-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar: elements card */}
          <aside className="lg:col-span-3">
            <ElementsSidebar />
          </aside>

          {/* Content: viewport width selector + grid builder */}
          <section className="flex flex-col gap-4 lg:col-span-9">
            {/* Viewport width selector (desktop or tablet only) */}
            {viewport !== "mobile" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  Container width:
                </span>
                {viewport === "desktop" &&
                  DESKTOP_WIDTHS.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={
                        viewportConfig.desktop.containerWidth === value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setDesktopContainerWidth(value)}
                    >
                      {label}
                    </Button>
                  ))}
                {viewport === "tablet" &&
                  TABLET_WIDTHS.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={
                        viewportConfig.tablet.containerWidth === value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setTabletContainerWidth(value)}
                    >
                      {label}
                    </Button>
                  ))}
              </div>
            )}

            {/* Grid builder area - constrained width; mobile in narrow strip (4-col phone-like) */}
            <div
              className={cn(
                "max-w-full",
                viewport !== "mobile" && widthClass,
                viewport === "mobile" && "mx-auto w-full max-w-[375px]"
              )}
            >
              <GridBuilder />
            </div>
          </section>
        </div>
      </main>
    </div>
    </DndProvider>
  );
}

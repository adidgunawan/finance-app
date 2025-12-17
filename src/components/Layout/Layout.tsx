import * as React from "react"

import { Search } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [commandOpen, setCommandOpen] = React.useState(false)

  const isMac = React.useMemo(() => {
    if (typeof navigator === "undefined") return false
    // navigator.platform is deprecated but still widely available for this UX hint.
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  }, [])

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key.toLowerCase() !== "k") return

      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === "input" || tag === "textarea" || target?.isContentEditable

      if (isTyping) return

      e.preventDefault()
      setCommandOpen(true)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-9 w-full max-w-md items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search…</span>
            </span>
            <KbdGroup className="gap-1">
              <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>
        </header>

        <div className="flex flex-1 flex-col p-4">{children}</div>
      </SidebarInset>

      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </SidebarProvider>
  )
}

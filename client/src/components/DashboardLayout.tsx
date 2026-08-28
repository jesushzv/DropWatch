import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BellRing, LogOut, PanelLeft, Radar, Tag } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const SIDEBAR_WIDTH_KEY = "dropwatch-sidebar-width";
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Number(saved) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)), [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] px-6 py-12 flex items-center justify-center">
        <section className="w-full max-w-md border border-border bg-card p-8 sm:p-10 text-center rise-in">
          <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Tag className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">DropWatch</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">One exact price. No noise.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Sign in to build your watchlist and keep a reliable record of every price you log.</p>
          <Button onClick={() => startLogin()} size="lg" className="mt-8 w-full rounded-md font-semibold">Sign in to DropWatch</Button>
        </section>
      </main>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardFrame setSidebarWidth={setSidebarWidth}>{children}</DashboardFrame>
    </SidebarProvider>
  );
}

function DashboardFrame({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const stop = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const isWatchRoute = location === "/" || location.startsWith("/watch/");

  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar" disableTransition={isResizing}>
          <SidebarHeader className="h-20 border-b border-sidebar-border px-3 justify-center">
            <div className="flex items-center gap-2.5 px-1">
              <button onClick={() => setLocation("/")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-150 active:scale-[0.97]" aria-label="Go to watchlist">
                <Tag className="h-4 w-4" aria-hidden="true" />
              </button>
              <button onClick={() => setLocation("/")} className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
                <p className="font-display text-base font-bold tracking-tight">DropWatch</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">price signals</p>
              </button>
            </div>
          </SidebarHeader>
          <SidebarContent className="pt-4">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground group-data-[collapsible=icon]:hidden">Monitor</p>
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isWatchRoute} onClick={() => setLocation("/")} tooltip="Your watches" className="h-10 rounded-md font-medium">
                  <Radar className="h-4 w-4" />
                  <span>Your watches</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="mx-3 mt-6 border border-sidebar-border bg-background/45 p-3 group-data-[collapsible=icon]:hidden">
              <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold">A quieter watchlist</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">You decide the product, stores, and price that matters.</p>
            </div>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-sidebar-border shrink-0"><AvatarFallback className="bg-secondary text-xs font-semibold">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar>
                  <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-semibold">{user?.name || "Your account"}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user?.email || "Signed in"}</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-md"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="absolute inset-y-0 right-0 z-50 hidden w-1 cursor-col-resize hover:bg-primary/30 lg:block" onMouseDown={() => setIsResizing(true)} aria-hidden="true" />
      </div>
      <SidebarInset className="bg-background">
        {isMobile && <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-md" /><Tag className="ml-1 h-4 w-4 text-primary" /><span className="font-display text-sm font-bold">DropWatch</span></header>}
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}

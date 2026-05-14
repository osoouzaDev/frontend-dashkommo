"use client";

import { type ElementType, type ReactNode, useState } from "react";
import { LogOut, Menu, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MenuItem = {
  icon: ElementType;
  label: string;
  href: string;
};

type AppShellUser = {
  nome: string;
  acesso: "administrador" | "usuario";
};

type AppShellProps = {
  user: AppShellUser;
  menuItems: MenuItem[];
  title: string;
  subtitle: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  footerLabel: string;
  onLogout: () => Promise<void> | void;
  headerExtras?: ReactNode;
  heroActions?: ReactNode;
  heroBadges?: ReactNode;
  children: ReactNode;
};

function getInitials(nome?: string) {
  if (!nome) return "US";

  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  user,
  menuItems,
  title,
  subtitle,
  eyebrow,
  heroTitle,
  heroDescription,
  footerLabel,
  onLogout,
  headerExtras,
  heroActions,
  heroBadges,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed left-0 top-0 z-50 flex h-screen w-76 flex-col border-r border-white/10 bg-background/75 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(109,40,217,0.28)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">
                    DashKommo
                  </h1>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Workspace premium
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-5">
            <Card className="glass-card gradient-border rounded-[1.75rem] border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Perfil: {user.acesso}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 space-y-2 px-4 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Button
                  key={item.label}
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "h-12 w-full justify-start gap-3 rounded-[1.15rem] border border-transparent px-4 text-sm",
                    active
                      ? "shadow-[0_14px_30px_rgba(109,40,217,0.22)]"
                      : "text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                  )}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="border-t border-white/10 p-4">
            <Button
              variant="destructive"
              className="h-12 w-full rounded-[1.15rem] gap-2"
              onClick={() => void onLogout()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:pl-76">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-background/60 backdrop-blur-2xl">
            <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-2xl lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h2>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {headerExtras}
                <Avatar className="h-11 w-11 ring-2 ring-primary/15">
                  <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-6">
            <section className="mb-6">
              <Card className="glass-card gradient-border overflow-hidden rounded-[2rem] border-0 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_45%),radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--chart-2)_16%,transparent),transparent_30%)] shadow-[0_25px_70px_rgba(17,24,39,0.16)]">
                <CardContent className="p-6 lg:p-7">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Sparkles className="h-4 w-4" />
                        {eyebrow}
                      </div>
                      <div className="space-y-2">
                        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight lg:text-4xl">
                          {heroTitle}
                        </h1>
                        <p className="max-w-3xl text-sm leading-7 text-muted-foreground lg:text-[15px]">
                          {heroDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {heroBadges ? (
                        <div className="flex flex-wrap gap-3">{heroBadges}</div>
                      ) : null}
                      {heroActions ? (
                        <div className="flex flex-wrap gap-3">{heroActions}</div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {children}
          </main>

          <footer className="border-t border-white/10 bg-background/55 px-4 py-4 backdrop-blur-xl lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>{footerLabel}</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

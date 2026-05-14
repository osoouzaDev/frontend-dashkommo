"use client";

import { type ElementType, type ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  description: string;
  value: ReactNode;
  hint: string;
  icon: ElementType;
  tone?: "primary" | "success" | "danger" | "warning";
  loading?: boolean;
};

const toneClasses = {
  primary: "bg-primary/12 text-primary",
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  danger: "bg-destructive/12 text-destructive",
  warning: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
};

export function StatCard({
  title,
  description,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  loading = false,
}: StatCardProps) {
  return (
    <Card className="glass-card rounded-[1.8rem] border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div
          className={cn(
            "rounded-2xl p-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5",
            toneClasses[tone]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

//src/app/admin/components/MetricCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Users, FolderKanban, FileText, Handshake, Wallet, Receipt, BarChart3 } from "lucide-react";
import Link from "next/link";

interface MetricCardProps {
  title: string;
  value: number;
  label: string;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  href?: string; // ➡️ NUEVO: URL para hacer la tarjeta clickeable
}

export function MetricCard({ 
  title, 
  value, 
  label, 
  icon: Icon, 
  color = "text-blue-600",
  subtitle,
  trend,
  href
}: MetricCardProps) {
  
  const cardContent = (
    <Card className="hover:shadow-lg transition-shadow duration-200 hover:scale-[1.02] cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 mt-1">
            +{trend.value} {trend.label}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );

  // Si tiene href, envolver en Link, si no, solo mostrar
  return href ? (
    <Link href={href}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}
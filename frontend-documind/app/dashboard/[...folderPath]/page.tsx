"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import DashboardView from "@/lib/components/dashboard/DashboardView";

export default function DashboardNestedPage() {
  const params = useParams<{ folderPath?: string[] }>();
  const folderPathSegments = useMemo(() => {
    const path = params?.folderPath;
    if (!path) return [];
    return Array.isArray(path) ? path : [path];
  }, [params]);

  return <DashboardView folderPathSegments={folderPathSegments} />;
}

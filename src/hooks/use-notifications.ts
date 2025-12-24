"use client";

import { useQuery } from "@tanstack/react-query";

interface NotificationTemplate {
  id: string;
  name: string;
  event: string;
  template: string;
  isActive: boolean;
}

interface LineChannel {
  id: string;
  name: string;
  accessToken: string;
  defaultGroupId: string | null;
  enabledEvents: string[];
  isActive: boolean;
}

async function fetchTemplates(): Promise<NotificationTemplate[]> {
  const res = await fetch("/api/notifications/templates");
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

async function fetchChannels(): Promise<LineChannel[]> {
  const res = await fetch("/api/notifications/channels");
  if (!res.ok) throw new Error("Failed to fetch channels");
  return res.json();
}

// Hook: Get notification templates with caching
export function useNotificationTemplates() {
  return useQuery({
    queryKey: ["notificationTemplates"],
    queryFn: fetchTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Get Line channels with caching
export function useLineChannels() {
  return useQuery({
    queryKey: ["lineChannels"],
    queryFn: fetchChannels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


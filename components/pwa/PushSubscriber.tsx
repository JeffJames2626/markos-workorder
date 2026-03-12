"use client";

import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushSubscriber({ role }: { role: string }) {
  useEffect(() => {
    if (role !== "admin") return;
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
          });
        }

        // Send subscription to server
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      } catch (err) {
        console.warn("Push subscription failed:", err);
      }
    };

    subscribe();
  }, [role]);

  return null;
}

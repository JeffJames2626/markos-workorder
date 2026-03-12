import webpush from "web-push";
import { prisma } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@markossprinklers.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function saveSubscription(userId: string, subscription: PushSubscriptionJSON) {
  const { endpoint, keys } = subscription as { endpoint: string; keys: { p256dh: string; auth: string } };

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
}

export async function removeSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function notifyAdmins(title: string, body: string, url?: string) {
  const adminSubs = await prisma.pushSubscription.findMany({
    where: { user: { role: "admin" } },
  });

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/history",
  });

  const results = await Promise.allSettled(
    adminSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        // Remove stale subscriptions (410 Gone or 404)
        if (err && typeof err === "object" && "statusCode" in err) {
          const statusCode = (err as { statusCode: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
        throw err;
      }
    })
  );

  return results;
}

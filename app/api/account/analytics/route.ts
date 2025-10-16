import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [
      docsCount,
      favToolsCount,
      favDocsCount,
      ordersCount,
      credit,
      usageLast30,
      lastOrder,
      lastCreditPurchase,
      lastCreditUsage,
      recentDocuments,
      favoriteTools,
      settings,
    ] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.favorite.count({ where: { userId, itemType: "aiTools" } }),
      prisma.favorite.count({ where: { userId, itemType: "documents" } }),
      prisma.aiToolOrder.count({ where: { userId } }),
      prisma.userCredit.findFirst({ where: { userId } }),
      prisma.creditUsageHistory.findMany({
        where: { userId, timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { service: true, amount: true },
      }),
      prisma.aiToolOrder.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { serviceName: true, createdAt: true, amount: true, status: true },
      }),
      prisma.creditPurchase.findFirst({
        where: { userId, status: "completed" },
        orderBy: { timestamp: "desc" },
        select: { amount: true, price: true, timestamp: true },
      }),
      prisma.creditUsageHistory.findFirst({
        where: { userId },
        orderBy: { timestamp: "desc" },
        select: { service: true, timestamp: true, amount: true },
      }),
      prisma.document.findMany({
        where: { userId, isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, updatedAt: true, previewText: true, isPublished: true },
      }),
      prisma.favorite.findMany({
        where: { userId, itemType: "aiTools" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          itemId: true,
          createdAt: true,
          aiTool: {
            select: { id: true, name: true, coverImage: true, rating: true, url: true },
          },
        },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    const usageByService: Record<string, number> = {};
    let usageTotal = 0;
    for (const row of usageLast30) {
      usageByService[row.service] = (usageByService[row.service] || 0) + (row.amount || 0);
      usageTotal += row.amount || 0;
    }

    return NextResponse.json({
      docsCount,
      favToolsCount,
      favDocsCount,
      ordersCount,
      credit: credit
        ? {
            plan: credit.plan,
            total: credit.totalCredits,
            used: credit.usedCredits,
            remaining: Math.max(0, credit.totalCredits - credit.usedCredits),
          }
        : null,
      usageLast30: { total: usageTotal, byService: usageByService },
      lastOrder,
      lastCreditPurchase,
      lastCreditUsage,
      recentDocuments,
      favoriteTools,
      preferences: settings
        ? {
            analyticsEnabled: settings.analyticsEnabled,
            publicProfile: settings.publicProfile,
            newsEmails: settings.newsEmails,
            productEmails: settings.productEmails,
            securityEmails: settings.securityEmails,
            timezone: settings.timezone,
            language: settings.language,
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

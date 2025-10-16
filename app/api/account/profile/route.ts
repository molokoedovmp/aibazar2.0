import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { settings: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name ?? "",
      image: user.image ?? "",
      settings: user.settings ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

type UpdatePayload = {
  name?: string;
  image?: string | null;
  bio?: string | null;
  company?: string | null;
  position?: string | null;
  website?: string | null;
  location?: string | null;
  timezone?: string | null;
  language?: string | null;
  theme?: string | null;
  analyticsEnabled?: boolean;
  publicProfile?: boolean;
  newsEmails?: boolean;
  productEmails?: boolean;
  securityEmails?: boolean;
};

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdatePayload = {};
  try {
    body = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, image, ...settings } = body;

  try {
    // Update core user fields
    if (typeof name === "string" || typeof image === "string" || image === null) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(typeof name === "string" ? { name: name.slice(0, 120) } : {}),
          ...(typeof image === "string" || image === null ? { image: image || null } : {}),
        },
      });
    }

    // Upsert settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(settings.bio !== undefined ? { bio: settings.bio } : {}),
        ...(settings.company !== undefined ? { company: settings.company } : {}),
        ...(settings.position !== undefined ? { position: settings.position } : {}),
        ...(settings.website !== undefined ? { website: settings.website } : {}),
        ...(settings.location !== undefined ? { location: settings.location } : {}),
        ...(settings.timezone !== undefined ? { timezone: settings.timezone } : {}),
        ...(settings.language !== undefined ? { language: settings.language } : {}),
        ...(settings.theme !== undefined ? { theme: settings.theme } : {}),
        ...(settings.analyticsEnabled !== undefined ? { analyticsEnabled: !!settings.analyticsEnabled } : {}),
        ...(settings.publicProfile !== undefined ? { publicProfile: !!settings.publicProfile } : {}),
        ...(settings.newsEmails !== undefined ? { newsEmails: !!settings.newsEmails } : {}),
        ...(settings.productEmails !== undefined ? { productEmails: !!settings.productEmails } : {}),
        ...(settings.securityEmails !== undefined ? { securityEmails: !!settings.securityEmails } : {}),
      },
      create: {
        userId: session.user.id,
        bio: settings.bio ?? null,
        company: settings.company ?? null,
        position: settings.position ?? null,
        website: settings.website ?? null,
        location: settings.location ?? null,
        timezone: settings.timezone ?? undefined,
        language: settings.language ?? undefined,
        theme: settings.theme ?? undefined,
        analyticsEnabled: settings.analyticsEnabled ?? undefined,
        publicProfile: settings.publicProfile ?? undefined,
        newsEmails: settings.newsEmails ?? undefined,
        productEmails: settings.productEmails ?? undefined,
        securityEmails: settings.securityEmails ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, settings: updatedSettings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


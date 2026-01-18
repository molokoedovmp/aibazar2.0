import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";

// Кешируем ответ на 60 секунд, чтобы снизить нагрузку на БД
export const revalidate = 60;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        aiTools: {
          where: { isActive: true },
          orderBy: { rating: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
            url: true,
            type: true,
            rating: true,
            price: true,
            startPrice: true,
            createdAt: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const shouldConvert = categories.some((category) =>
      category.aiTools.some(
        (tool) => typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0
      )
    );
    const fx = shouldConvert ? await getUsdFx() : null;
    const data = categories.map((category) => ({
      ...category,
      aiTools: category.aiTools.map((tool) => {
        let price = tool.price;
        if (fx && typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0) {
          price = calcRubPrice(tool.startPrice, { fx });
        } else if (typeof price === "number") {
          price = Math.round(price);
        }
        return { ...tool, price };
      }),
    }));

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      fx,
    });
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Не удалось получить категории",
      },
      { status: 500 }
    );
  }
}

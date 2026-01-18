import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";

// Лёгкое кеширование списка (60с) — достаточно для ленты
export const revalidate = 60;

export async function GET() {
  try {
    const aiTools = await prisma.aiTool.findMany({
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
        category: { select: { id: true, name: true, icon: true } },
      },
      orderBy: { rating: 'desc' },
    });

    const shouldConvert = aiTools.some(
      (tool) => typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0
    );
    const fx = shouldConvert ? await getUsdFx() : null;
    const data = aiTools.map((tool) => {
      let price = tool.price;
      if (fx && typeof tool.startPrice === "number" && Number.isFinite(tool.startPrice) && tool.startPrice > 0) {
        price = calcRubPrice(tool.startPrice, { fx });
      } else if (typeof price === "number") {
        price = Math.round(price);
      }
      return { ...tool, price };
    });

    return NextResponse.json({ 
      success: true, 
      data,
      count: data.length,
      fx,
    });
  } catch (error) {
    console.error("Ошибка при получении AI инструментов:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось получить инструменты" },
      { status: 500 }
    );
  }
}

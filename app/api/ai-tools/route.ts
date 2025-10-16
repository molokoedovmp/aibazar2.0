import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    return NextResponse.json({ 
      success: true, 
      data: aiTools,
      count: aiTools.length 
    });
  } catch (error) {
    console.error("Ошибка при получении AI инструментов:", error);
    return NextResponse.json(
      { success: false, error: "Не удалось получить инструменты" },
      { status: 500 }
    );
  }
}


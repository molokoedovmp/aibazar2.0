import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
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

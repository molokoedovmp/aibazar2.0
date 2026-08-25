FROM node:20

# 1. Создаём НЕ-root пользователя
RUN useradd -m appuser

WORKDIR /app

COPY package*.json ./

# 2. Ставим зависимости БЕЗ postinstall
RUN npm ci --ignore-scripts

COPY . .

RUN npx prisma generate
RUN npm run build
RUN mkdir -p /app/.next/cache && chown -R appuser:appuser /app/.next

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 3. Запуск ТОЛЬКО под обычным пользователем
USER appuser

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]

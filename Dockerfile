# Simple Node 20 image without Alpine mirrors issues
FROM node:20

ARG NPM_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

COPY package*.json ./

# Use Russia-friendly npm mirror to avoid download blocks; override via --build-arg if needed
RUN npm config set registry ${NPM_REGISTRY} && npm install

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]

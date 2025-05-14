# 1. Use official Node.js image to build the app
FROM node:18 AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# 2. Use Nginx to serve the built app
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

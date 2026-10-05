# Build the browser application with its production API path baked into the static bundle.
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /workspace

# npm workspaces 需要完整的包布局才能安装依赖。
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/miniprogram/package.json apps/miniprogram/
COPY packages/core/package.json packages/core/
COPY packages/client/package.json packages/client/
# npm ci 在 workspaces 布局下会跳过跨平台的原生可选依赖（rolldown 绑定），
# 因此这里使用 npm install：版本仍由 package-lock.json 锁定，仅补齐当前平台的可选依赖。
# 容器到 npm registry 的连接偶发中断：缓存下载产物并重试一次。
RUN --mount=type=cache,target=/root/.npm \
    (npm install || npm install)

COPY . ./

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --output-document=/dev/null http://127.0.0.1/ || exit 1

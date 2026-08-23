# Dockerfile — Studio Hub
#
# Le dépôt est passé à bun : package-lock.json a été retiré au profit de
# bun.lock. `npm ci` ne peut donc plus fonctionner ici, d'où l'image oven/bun.
# Le développement local reste possible avec npm (`npm install`), mais la
# construction reproductible passe par bun et son lockfile.

# ============================================================================
# Étape 1 : construction
# ============================================================================
FROM oven/bun:1-alpine AS builder

WORKDIR /build

# Couche de dépendances séparée : elle n'est reconstruite que si le manifeste
# ou le lockfile changent.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ============================================================================
# Étape 2 : exécution
# ============================================================================
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./

# vite.config.ts fait partie de l'execution, pas seulement de la construction.
# `vite preview` le relit au demarrage pour y trouver `preview.allowedHosts` ;
# sans lui, il tourne sur la configuration par defaut et repond 403 « Blocked
# request » a toute requete portant un nom de domaine — c'est-a-dire a tout
# visiteur arrivant par le proxy, l'acces direct par IP restant le seul a
# fonctionner. La construction, elle, reussissait : le defaut ne se voyait
# qu'une fois en ligne.
COPY --from=builder /build/vite.config.ts ./

# Exécution sans privilèges.
RUN addgroup -g 1001 -S appuser \
 && adduser -S appuser -u 1001 \
 && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD bun -e "fetch('http://localhost:3000/').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "preview"]

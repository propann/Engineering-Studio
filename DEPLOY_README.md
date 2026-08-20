# 🚀 Deploy Branch - Studio Hub Audio Plugin Rack

**Branch**: `deploy/coolify-production`  
**Purpose**: Production deployment with Coolify + Docker  
**Status**: ✅ Ready for deployment

---

## 📋 Quick Start

### 1. Prerequisites

```bash
# Ensure you have:
- Docker >= 20.10
- Docker Compose >= 2.0
- Coolify instance (self-hosted or managed)
- GitHub account with repository access
```

### 2. Configure Secrets

Follow **DEPLOY_SECRETS.md**:
```bash
1. Create GitHub secrets (COOLIFY_API_TOKEN, COOLIFY_WEBHOOK_URL)
2. Configure Coolify application
3. Set environment variables
```

### 3. Deploy

```bash
# Option A: Automatic (via GitHub Actions)
git push origin deploy/coolify-production
# Automatically triggers build and deployment

# Option B: Manual (via Coolify)
cd /path/to/repository
docker compose up -d

# Option C: Using script
./scripts/deploy.sh production latest
```

---

## 📁 Branch Structure

```
deploy/coolify-production/
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Production compose config
├── .dockerignore                # Build context optimization
├── .env.production              # Environment variables
├── coolify.json                 # Coolify configuration
├── DEPLOYMENT.md                # Full deployment guide
├── DEPLOY_SECRETS.md            # Secrets setup guide
├── DEPLOY_README.md             # This file
├── scripts/
│   └── deploy.sh                # Automated deployment script
├── .github/workflows/
│   └── deploy.yml               # GitHub Actions CI/CD
└── [Project files]
```

---

## 🔧 Configuration Files

### Dockerfile
- Multi-stage build for optimization
- Non-root user for security
- Health checks enabled
- Minimal final image size

### docker-compose.yml
- Production-ready configuration
- Resource limits set
- Volume for data persistence
- Logging configuration

### coolify.json
- Coolify platform integration
- Environment variable definitions
- Resource requirements
- Deployment settings

### .env.production
- Production environment variables
- Feature flags
- Audio configuration
- Security settings

---

## 🔐 Security Features

✅ **Container Security**
- Non-root user execution
- Read-only filesystem support
- Resource limits enforced
- Security scanning (Trivy)

✅ **Application Security**
- HTTPS/SSL enforcement
- CORS configuration
- Secure cookies
- Environment-based secrets

✅ **CI/CD Security**
- Secret management
- Artifact signing
- Vulnerability scanning
- Automated testing

---

## 📊 Deployment Flow

```
1. Push to deploy/coolify-production
   ↓
2. GitHub Actions Trigger
   ├─ Run tests
   ├─ Build Docker image
   ├─ Security scan (Trivy)
   └─ Upload to registry
   ↓
3. Deploy to Coolify
   ├─ Pull Docker image
   ├─ Start container
   ├─ Health checks
   └─ Notify Slack
   ↓
4. Monitor & Verify
   ├─ Container status
   ├─ Application health
   ├─ Error tracking
   └─ Performance metrics
```

---

## 🚀 Deployment Options

### Option 1: Automatic (Recommended)

```bash
# Push to branch (triggers GitHub Actions)
git push origin deploy/coolify-production

# Automatically:
# 1. Runs tests
# 2. Builds Docker image
# 3. Scans for vulnerabilities
# 4. Deploys to Coolify
# 5. Notifies via Slack
```

### Option 2: Docker Compose (Local/Server)

```bash
# Copy repository to server
git clone -b deploy/coolify-production https://github.com/username/engineering-studio
cd engineering-studio

# Start services
docker compose up -d

# View logs
docker compose logs -f studio-hub

# Verify health
curl http://localhost:3000
```

### Option 3: Manual Script

```bash
# Run deployment script
./scripts/deploy.sh production v1.0.0

# Script handles:
# - Prerequisites check
# - Environment loading
# - Image building
# - Container lifecycle
# - Health verification
```

### Option 4: Coolify Dashboard

```
1. Login to Coolify
2. New Application → Docker
3. Connect repository (deploy/coolify-production branch)
4. Configure environment variables
5. Configure domain
6. Click Deploy

Automatic updates:
- Enable "Auto Deploy" for push-to-deploy
```

---

## 📈 Environment Variables

### Essential
```bash
NODE_ENV=production
VITE_API_URL=https://your-domain.com
```

### Audio
```bash
AUDIO_CONTEXT_SAMPLE_RATE=44100
FEATURE_AUDIO_EXPORT=true
FEATURE_SAMPLE_PACKS=true
```

### Monitoring
```bash
LOG_LEVEL=info
SENTRY_DSN=https://...@sentry.io/...
```

### See `.env.production` for complete list

---

## 📊 Monitoring & Health

### Health Endpoint

```bash
curl https://your-domain.com
# Expected: 200 OK with HTML
```

### Container Health

```bash
# Check status
docker ps --filter "name=studio-hub"

# View logs
docker logs studio-hub

# Check resource usage
docker stats studio-hub
```

### Coolify Dashboard

```
Application → Monitoring
- CPU usage
- Memory usage
- Network I/O
- Container status
- Recent deployments
```

---

## 🔄 Updating Deployment

### Rolling Update (Recommended)

```bash
# 1. Update code on main branch
git checkout main
# Make changes
git push origin main

# 2. Merge to deploy branch
git checkout deploy/coolify-production
git merge main
git push origin deploy/coolify-production

# 3. GitHub Actions automatically deploys
# 4. Health checks verify new version
```

### Force Redeploy

```bash
# Via Coolify Dashboard
Application → Deployments → Click "Deploy Now"

# Via API
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-coolify/api/applications/deploy/app-id
```

### Rollback

```bash
# Via Coolify Dashboard
Application → Deployments → Previous version → "Rollback"

# Via Docker
docker stop studio-hub
docker rm studio-hub
docker run ... studio-hub:previous-tag
```

---

## 🐛 Troubleshooting

### Deployment Fails

```bash
# Check GitHub Actions
GitHub repo → Actions → Failed workflow → View logs

# Common issues:
- Build failing: Check `npm run build` (pas de tests configurés à ce jour)
- Build failing: Check Dockerfile syntax
- Push failing: Check registry credentials
```

### Container Won't Start

```bash
# Check Docker logs
docker logs studio-hub

# Common issues:
- Port 3000 in use: Change port mapping
- Out of memory: Increase memory limit
- Missing env vars: Check .env.production
```

### Health Check Failing

```bash
# Test manually
curl http://localhost:3000/

# Check container
docker exec studio-hub npm run health

# View detailed logs
docker logs -f studio-hub
```

### High CPU/Memory

```bash
# Monitor usage
docker stats studio-hub

# If high:
1. Check for infinite loops in code
2. Profile with Chrome DevTools
3. Increase resource limits
4. Optimize code
```

---

## 📝 Deployment Checklist

État au 2026-08-20. Rien n'a encore été déployé : Coolify n'est pas configuré.

### Préparation — fait
- [x] Code poussé et fusionné sur `main` (`5ded027`)
- [x] `npm run typecheck` : 0 erreur
- [x] `npm run build` : passe
- [x] `docker build` : passe en local (Node 20 Alpine)
- [x] `Dockerfile`, `docker-compose.yml`, `.dockerignore` écrits et testés
- [x] `coolify.json` et `.env.production` écrits
- [x] Workflow GitHub Actions écrit et corrigé (il appelait des scripts inexistants)

### Préparation — à faire
- [ ] Application Coolify créée
- [ ] Secrets GitHub renseignés — `COOLIFY_API_TOKEN`, `COOLIFY_WEBHOOK_URL` (voir `DEPLOY_SECRETS.md`)
- [ ] Variables d'environnement renseignées côté Coolify
- [ ] Domaine enregistré et DNS pointé
- [ ] Certificat SSL demandé (Let's Encrypt via Coolify)
- [ ] Sauvegardes configurées
- [ ] ~~Tests passants~~ — sans objet : aucune infra de test sur studio-hub

### Déploiement — à faire
- [ ] Push sur `deploy/coolify-production`
- [ ] Le workflow GitHub Actions se termine
- [ ] Image Docker construite et poussée sur le registre
- [ ] Scan de sécurité Trivy passé
- [ ] Déploiement Coolify réussi
- [ ] Healthchecks au vert
- [ ] Application accessible depuis le domaine

### Après déploiement — à faire
- [ ] Vérifier les fonctionnalités
- [ ] Tester la synthèse audio
- [ ] Tester la sauvegarde/chargement de patch
- [ ] Tester le sélecteur de dossier (le TLS Coolify fournit le contexte sécurisé)
- [ ] Surveiller les logs d'erreur
- [ ] Relever CPU/mémoire
- [ ] Établir une référence de performance
- [ ] Configurer les alertes de supervision

---

## 🎯 Success Criteria

✅ **Deployment Successful When:**
- GitHub Actions workflow passes
- Docker image builds and pushes
- Container starts and stays running
- Health endpoint responds (HTTP 200)
- Application loads in browser
- Audio synthesis works
- Patches save and load correctly
- Error logs are clean

---

## 📞 Useful Commands

### Deployment Script
```bash
# Full deployment with tests
./scripts/deploy.sh production latest

# Skip tests (faster)
./scripts/deploy.sh production latest --no-test

# Custom version
./scripts/deploy.sh production v1.2.3
```

### Docker Commands
```bash
# Build
docker build -t studio-hub:latest .

# Run
docker run -d -p 3000:3000 studio-hub:latest

# Compose
docker compose up -d
docker compose logs -f
docker compose down

# Debug
docker exec -it studio-hub sh
docker inspect studio-hub
```

### Verification
```bash
# Health check
curl http://localhost:3000

# Get version
curl http://localhost:3000/api/version

# Check logs
docker logs studio-hub
docker logs -f --tail 100 studio-hub
```

---

## 📚 Reference Guides

1. **DEPLOYMENT.md** - Complete deployment guide with all options
2. **DEPLOY_SECRETS.md** - Secrets configuration and setup
3. **AUDIO_RACK_README.md** - Application documentation
4. **AUDIO_RACK_ROADMAP.md** - Development roadmap

---

## 🔗 Useful Links

- **Coolify Docs**: https://coolify.io/docs
- **Docker Docs**: https://docs.docker.com
- **GitHub Actions**: https://github.com/features/actions
- **Docker Hub**: https://hub.docker.com

---

## 📋 Branch Rules (Recommended)

### For Deploy Branch

```
Branch name: deploy/coolify-production

Protection rules:
✓ Require pull request reviews (1 review)
✓ Require status checks to pass
✓ Require branches to be up to date
✓ Dismiss stale pull request approvals
✓ Restrict who can push to matching branches (maintainers only)
```

This ensures:
- All changes reviewed
- Tests pass before merge
- Only authorized people can deploy
- CI/CD workflows complete successfully

---

## 🎓 Learning Resources

### Docker
- [Dockerfile best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
- [Docker security](https://docs.docker.com/engine/security/)

### Coolify
- [Getting started](https://coolify.io/docs/getting-started)
- [Application deployment](https://coolify.io/docs/applications)
- [Environment variables](https://coolify.io/docs/deployment/environment)

### CI/CD
- [GitHub Actions guide](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Secrets management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Need Help?

1. **Check DEPLOYMENT.md** - Full guide for all deployment options
2. **Check DEPLOY_SECRETS.md** - Secrets configuration issues
3. **Check Coolify Dashboard** - Application logs and status
4. **Check GitHub Actions** - Workflow logs for CI/CD issues
5. **Check Docker Logs** - `docker logs studio-hub`

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-08-20  
**Version**: 1.0.0

🚀 Ready to deploy Studio Hub to production!


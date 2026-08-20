# 🚀 Deployment Guide - Studio Hub Audio Plugin Rack

Complete guide for deploying Studio Hub using Coolify and Docker.

---

## 📋 Prerequisites

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Coolify** instance (self-hosted or cloud)
- **Node.js** >= 18 (for local builds)
- **2GB RAM minimum** for container
- **1GB disk space minimum**

---

## 🔧 Quick Deploy with Coolify

### 1. Connect Repository

```bash
# In Coolify Dashboard:
1. Click "New Application"
2. Select "Docker Compose"
3. Enter repository URL: https://github.com/username/engineering-studio
4. Branch: deploy/coolify-production
5. Click "Deploy"
```

### 2. Configure Environment

```bash
# In Coolify Environment Variables:
NODE_ENV=production
VITE_API_URL=https://your-domain.com
LOG_LEVEL=info
AUDIO_CONTEXT_SAMPLE_RATE=44100
FEATURE_AUDIO_EXPORT=true
FEATURE_SAMPLE_PACKS=true
```

### 3. Configure Domain

```bash
# In Coolify Application Settings:
Domain: studio-hub.your-domain.com
SSL: Let's Encrypt (auto)
Port: 3000
```

### 4. Deploy

```bash
# Click "Deploy" in Coolify Dashboard
# Wait for build to complete (~3-5 minutes)
# Access at https://studio-hub.your-domain.com
```

---

## 🐳 Local Docker Deployment

### Build Image

```bash
docker build -t studio-hub:latest .
```

### Run Container

```bash
docker run -d \
  --name studio-hub \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e VITE_API_URL=http://localhost:3000 \
  -v studio-hub-data:/app/data \
  --restart unless-stopped \
  studio-hub:latest
```

### Using Docker Compose

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f studio-hub

# Stop
docker-compose down

# Remove volumes (full cleanup)
docker-compose down -v
```

---

## 📊 Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Domain registered and DNS configured
- [ ] SSL certificate requested
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Error tracking (Sentry) configured

### Deployment
- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Health checks passing
- [ ] Application responds on port 3000
- [ ] UI loads at configured domain
- [ ] Audio synthesis working
- [ ] Patch saving/loading working

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test audio export
- [ ] Check sample creation
- [ ] Monitor CPU/Memory usage
- [ ] Plan rollback if needed

---

## 🔒 Security Configuration

### Environment Variables (PRODUCTION)

```bash
# DO NOT commit these
NODE_ENV=production
VITE_API_URL=https://your-domain.com
SECURE_COOKIES=true
ALLOW_INSECURE_LOCALHOST=false
CORS_ORIGIN=https://your-domain.com
```

### Firewall Rules

```bash
# Allow HTTPS only
- Port 443: HTTPS (open)
- Port 80: HTTP redirect to HTTPS (optional)
- Port 3000: Internal only (if behind reverse proxy)

# Deny
- Port 22: SSH (if not needed)
- Port 27017: MongoDB (if applicable)
```

### Docker Security

```bash
# Use non-root user
USER nodejs

# Read-only filesystem
--read-only

# No privilege escalation
--security-opt=no-new-privileges:true

# Resource limits
--memory 2G
--cpus 2
```

---

## 📈 Monitoring & Logging

### Coolify Dashboard

```
1. Navigate to Application → Monitoring
2. View:
   - CPU usage
   - Memory usage
   - Network I/O
   - Container status
   - Recent logs
```

### Docker Logs

```bash
# Live logs
docker logs -f studio-hub

# Last 100 lines
docker logs --tail 100 studio-hub

# With timestamps
docker logs -f --timestamps studio-hub

# JSON format
docker logs --format='{{json .}}' studio-hub | jq
```

### Health Check Status

```bash
docker inspect --format='{{.State.Health.Status}}' studio-hub

# Expected: "healthy"
```

---

## 🔄 Scaling Configuration

### Single Instance (Default)

```yaml
deploy:
  replicas: 1
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### High Availability (Multiple Instances)

```yaml
# For Docker Swarm or Kubernetes
deploy:
  replicas: 3
  resources:
    limits:
      cpus: '1'
      memory: 1G
```

### Load Balancing

If using multiple instances, configure:
- Nginx or HAProxy as reverse proxy
- Round-robin load balancing
- Session affinity (sticky sessions)
- Health check endpoints

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs studio-hub

# Common issues:
# - Port 3000 already in use → Change port
# - Out of memory → Increase memory limit
# - Build failed → Check Dockerfile
```

### Application Crash

```bash
# Get detailed error
docker inspect studio-hub | grep -i error

# Restart
docker restart studio-hub

# Full rebuild
docker-compose down
docker-compose up --build
```

### High CPU Usage

```bash
# Monitor CPU
docker stats studio-hub

# If >80% consistently:
# 1. Check for infinite loops
# 2. Profile with DevTools
# 3. Increase CPU limit
# 4. Cache optimization
```

### Health Check Failing

```bash
# Test manually
curl http://localhost:3000/

# Expected: 200 status + HTML response

# If failing:
# 1. Check container logs
# 2. Verify port binding: docker port studio-hub
# 3. Test inside container: docker exec studio-hub curl localhost:3000
```

---

## 📦 Backup & Recovery

### Backup User Data

```bash
# Backup volume
docker run --rm \
  -v studio-hub-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/studio-hub-data.tar.gz -C /data .

# Restore from backup
docker run --rm \
  -v studio-hub-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/studio-hub-data.tar.gz -C /data
```

### Database Backup (if applicable)

```bash
# Scheduled backup (cron job)
0 3 * * * docker exec studio-hub npm run backup

# Manual backup
docker exec studio-hub npm run backup
```

---

## 🔐 SSL/TLS Configuration

### Automatic (Recommended)

```yaml
# Coolify handles this automatically
# Select "Let's Encrypt" in domain settings
```

### Manual

```bash
# Install cert
docker exec studio-hub npm run ssl:install

# Renew cert
docker exec studio-hub npm run ssl:renew
```

---

## 📊 Performance Tuning

### Node.js Optimization

```bash
# In Dockerfile or environment:
NODE_OPTIONS="--max-old-space-size=1024"
```

### Build Optimization

```bash
# Multi-stage build (already in Dockerfile)
# Reduces final image size by ~80%
```

### Caching Strategy

```bash
# Cache Docker layers
docker build --cache-from studio-hub:latest .
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [deploy/coolify-production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -d '{"ref":"deploy/coolify-production"}' \
            ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

---

## 📞 Support & Monitoring

### Health Endpoint

```bash
curl https://studio-hub.your-domain.com/health
# Returns: {"status": "ok", "timestamp": "2026-08-20T..."}
```

### Error Tracking (Sentry)

```bash
# In environment:
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Errors automatically reported
```

### Uptime Monitoring

```bash
# Services like:
- UptimeRobot
- Pingdom
- StatusCake

# Monitor: https://studio-hub.your-domain.com
# Interval: 5 minutes
# Alerts: Email/Slack
```

---

## 🔄 Update Process

### Pull Latest Changes

```bash
# On server
git pull origin deploy/coolify-production
docker-compose build --no-cache
docker-compose up -d
```

### Automatic Updates (Coolify)

```
Settings → Auto Deploy → Enable
```

This rebuilds on every push to the branch.

---

## 💾 Database Migration (if applicable)

```bash
# Run migrations in container
docker exec studio-hub npm run migrate

# Rollback
docker exec studio-hub npm run migrate:rollback
```

---

## 📝 Deployment Logs

All deployments are logged in:
- **Coolify Dashboard** → Application → Deployments
- **Docker Logs** → `docker logs studio-hub`
- **System Logs** → `/var/log/docker.log`

---

## 🎯 Success Verification

### Post-Deployment Checklist

```bash
# 1. Access application
curl https://studio-hub.your-domain.com
# Expected: 200 OK + HTML

# 2. Check API
curl https://studio-hub.your-domain.com/api/health
# Expected: {"status": "ok"}

# 3. Verify SSL
curl -I https://studio-hub.your-domain.com
# Expected: SSL certificate valid

# 4. Monitor resources
docker stats studio-hub
# CPU: <50%, Memory: <1GB (normal)

# 5. Test audio
# Open in browser, test audio synthesis
```

---

**Deployment Complete!** 🎉

For issues or questions, refer to:
- Coolify Documentation: https://coolify.io/docs
- Docker Documentation: https://docs.docker.com
- GitHub Issues: Create an issue in the repository

---

**Status**: Production Ready ✅  
**Last Updated**: 2026-08-20  
**Version**: 1.0.0


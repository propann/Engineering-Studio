# 🔐 Deployment Secrets Setup Guide

Configure required secrets for Coolify and GitHub Actions deployment.

---

## GitHub Secrets Setup

### 1. Create GitHub Personal Access Token

**For Coolify Integration:**

```
Settings → Developer settings → Personal access tokens → Tokens (classic)
Create new token

Scopes:
  - repo (all)
  - admin:repo_hook
  - admin:org_hook

Name: COOLIFY_API_TOKEN
Save token value
```

### 2. Create Coolify API Token

**In Coolify Dashboard:**

```
Settings → API Tokens
Create new token

Permissions:
  - application:deploy
  - application:view
  - docker:manage

Save token value
```

### 3. Create Slack Webhook (Optional)

**For deployment notifications:**

```
https://api.slack.com/messaging/webhooks

Create Incoming Webhook
Select channel: #deployments
Copy Webhook URL
```

---

## Add Secrets to GitHub

### Method 1: GitHub Web UI

```
GitHub Repository Settings → Secrets and variables → Actions

Click "New repository secret"

Add each secret:
1. COOLIFY_API_TOKEN
2. COOLIFY_WEBHOOK_URL
3. SLACK_WEBHOOK (optional)
```

### Method 2: GitHub CLI

```bash
# Install GitHub CLI
brew install gh

# Login
gh auth login

# Add secrets
gh secret set COOLIFY_API_TOKEN --body "your-token-here"
gh secret set COOLIFY_WEBHOOK_URL --body "https://coolify.io/api/deploy/..."
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/..."
```

### Secret Values

#### COOLIFY_API_TOKEN
```
Type: API Token from Coolify
Pattern: ^[a-zA-Z0-9]{40,}$
Used by: GitHub Actions → Coolify API
```

#### COOLIFY_WEBHOOK_URL
```
Type: Webhook URL from Coolify
Pattern: https://your-coolify-instance.com/api/webhooks/deploy
Used by: GitHub Actions → Trigger deployment
```

#### SLACK_WEBHOOK
```
Type: Slack Incoming Webhook
Pattern: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
Used by: GitHub Actions → Slack notifications
Optional: If not set, deployment still works without notifications
```

---

## Coolify Configuration

### 1. Create Application

**In Coolify Dashboard:**

```
New Application → Docker
Name: Studio Hub
Repository: https://github.com/username/engineering-studio
Branch: deploy/coolify-production
Build command: npm run build
Dockerfile: Dockerfile
```

### 2. Configure Environment Variables

**In Application Settings → Environment:**

```
NODE_ENV=production
VITE_API_URL=https://your-domain.com
LOG_LEVEL=info
AUDIO_CONTEXT_SAMPLE_RATE=44100
FEATURE_AUDIO_EXPORT=true
FEATURE_SAMPLE_PACKS=true

# Add more from .env.production as needed
```

### 3. Configure Domain

**In Application Settings → Domains:**

```
Domain: studio-hub.your-domain.com
SSL: Let's Encrypt
Force HTTPS: Yes
```

### 4. Create Webhook

**In Application Settings → Webhooks:**

```
Webhook URL: https://your-coolify-instance.com/api/webhooks/deploy
Events: repository.push

Copy webhook URL for COOLIFY_WEBHOOK_URL secret
```

### 5. Set API Token Permissions

**In Coolify Settings → API Tokens:**

```
Token: [Name: GitHub Actions]

Permissions:
✓ application:deploy
✓ application:view
✓ docker:manage
✓ resource:view

Copy token for COOLIFY_API_TOKEN secret
```

---

## Environment Variables for Production

### Database (if applicable)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/studio_hub
DATABASE_POOL_SIZE=5
DATABASE_TIMEOUT=10000
```

### Email (for notifications)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SUPPORT_EMAIL=support@example.com
```

### Analytics (optional)

```bash
# Sentry for error tracking
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Analytics
ANALYTICS_ENABLED=true
GA_ID=G-XXXXXXXXXX
```

### Security

```bash
JWT_SECRET=your-random-secret-key-min-32-chars
SESSION_SECRET=your-random-session-key-min-32-chars
CORS_ORIGIN=https://studio-hub.your-domain.com
SECURE_COOKIES=true
```

---

## Local Development Secrets

### .env.local (Not committed)

```bash
# Copy from .env.production
# Override specific values for local testing

NODE_ENV=development
VITE_API_URL=http://localhost:3000
LOG_LEVEL=debug
ALLOW_INSECURE_LOCALHOST=true
```

### .env.example (Committed, no values)

```bash
# Committed for documentation
# Shows what secrets are needed without exposing values

NODE_ENV=
VITE_API_URL=
LOG_LEVEL=
AUDIO_CONTEXT_SAMPLE_RATE=
FEATURE_AUDIO_EXPORT=
FEATURE_SAMPLE_PACKS=
```

---

## Verification Checklist

### GitHub Actions

```bash
# Check secrets are set
Settings → Secrets and variables → Actions

Required:
  ✓ COOLIFY_API_TOKEN
  ✓ COOLIFY_WEBHOOK_URL

Optional:
  ○ SLACK_WEBHOOK
```

### Coolify Configuration

```bash
# Verify in Coolify Dashboard

Application Settings:
  ✓ Repository configured
  ✓ Branch: deploy/coolify-production
  ✓ Dockerfile found
  ✓ Environment variables set
  ✓ Domain configured
  ✓ SSL certificate active
  ✓ Webhooks configured
```

### Deployment Test

```bash
# Push to deploy branch
git push origin deploy/coolify-production

# Watch GitHub Actions
GitHub repo → Actions tab

# Check Coolify
Coolify Dashboard → Applications → Studio Hub → Deployments

Expected:
  ✓ Tests pass
  ✓ Docker image builds
  ✓ Security scan completes
  ✓ Deployment succeeds
  ✓ Application is healthy
```

---

## Troubleshooting Secrets

### Secret not found error

```bash
# Check secret is set in GitHub
GitHub Settings → Secrets → Look for the secret name

# Reload workflow
- Delete failed workflow run
- Push same code again
- Workflow will retry with secrets
```

### Invalid secret value

```bash
# Common issues:
- Extra spaces or newlines
- Incomplete token
- Token expired
- Wrong secret name in workflow

# Fix:
- Edit secret in GitHub
- Update token value
- Push code again
```

### Deployment fails with auth error

```bash
# Check API token
Coolify Settings → API Tokens → Token permissions

# Verify permissions:
  ✓ application:deploy
  ✓ application:view
  ✓ docker:manage

# If needed:
- Create new token
- Update COOLIFY_API_TOKEN secret
- Retry deployment
```

---

## Security Best Practices

### 1. Token Rotation

```bash
# Rotate secrets every 90 days
- Generate new token in Coolify
- Update GitHub secret
- Delete old token from Coolify
```

### 2. Scope Limiting

```bash
# Give tokens minimum necessary permissions
✓ DO: application:deploy only
✗ DON'T: Full admin access
```

### 3. Access Control

```bash
# Limit who can manage secrets
GitHub Settings → Collaborators

Only grant to:
- Senior developers
- DevOps engineers
- CI/CD administrators
```

### 4. Audit Logging

```bash
# Monitor secret usage
GitHub Settings → Audit log
Coolify Dashboard → Activity log

Alert on:
- New token creation
- Secret rotation
- Deployment failures
```

### 5. Secret Naming

```bash
# Use descriptive names
GOOD: COOLIFY_API_TOKEN_PRODUCTION
BAD: SECRET123, COOLIFY_TOKEN

# Include environment if applicable
COOLIFY_API_TOKEN  # For production
COOLIFY_API_TOKEN_STAGING  # For staging
```

---

## Removing Secrets

### From GitHub

```bash
# Remove via web UI:
Settings → Secrets → Click X on secret

# Via CLI:
gh secret delete SECRET_NAME
```

### From Coolify

```bash
# Coolify Dashboard:
Settings → API Tokens → Delete token

# This invalidates the token immediately
```

---

## Testing Secrets

### Validate Configuration

```bash
# Run deployment test
git push origin deploy/coolify-production

# Check logs for:
✓ GitHub Actions passed
✓ Docker image built
✓ Security scan passed
✓ Coolify webhook triggered
✓ Deployment succeeded
```

### Manual Deployment Test

```bash
# Test Coolify API directly
curl -X POST \
  -H "Authorization: Bearer YOUR_COOLIFY_TOKEN" \
  https://your-coolify-instance.com/api/applications/deploy \
  -d '{"applicationId": "YOUR_APP_ID"}'
```

---

## Support

For secret-related issues:

1. **GitHub Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
2. **Coolify Docs**: https://coolify.io/docs/api
3. **Slack Webhooks**: https://api.slack.com/messaging/webhooks

---

**Secrets Configuration Complete!** ✅

Next step: Push to `deploy/coolify-production` branch to trigger first deployment.


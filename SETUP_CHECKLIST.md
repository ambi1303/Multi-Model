# Repository Setup Checklist

## ✅ Quick Setup Checklist

### 1. Enable GitHub Actions
- [ ] Go to Settings → Actions → General
- [ ] Select "Allow all actions and reusable workflows"
- [ ] Set "Workflow permissions" to "Read and write permissions"
- [ ] Check "Allow GitHub Actions to create and approve pull requests"

### 2. Set up GitHub Container Registry
- [ ] Go to Settings → Packages
- [ ] Ensure "Inherit access from source repository" is enabled
- [ ] Set visibility to "Public" (or "Private" if needed)

### 3. Create Environments
- [ ] Go to Settings → Environments
- [ ] Create "production" environment
- [ ] Create "staging" environment

### 4. Add Environment Secrets

#### Production Environment:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `GOOGLE_CLOUD_API_KEY` - Google Cloud API key
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `KUBECONFIG_BASE64` - Base64 encoded Kubernetes config
- [ ] `DOCKER_REGISTRY_TOKEN` - GitHub token

#### Staging Environment:
- [ ] Same secrets as production (with staging values)

### 5. Set Repository Variables
- [ ] Go to Settings → Secrets and variables → Actions → Variables
- [ ] Add `REGISTRY` = `ghcr.io`
- [ ] Add `IMAGE_NAME` = `your-username/multi-model`
- [ ] Add `KUBERNETES_NAMESPACE` = `emotion-analysis-prod`
- [ ] Add `DOMAIN` = `your-domain.com`

### 6. Configure Branch Protection

#### Main Branch:
- [ ] Go to Settings → Branches
- [ ] Add rule for `main` branch
- [ ] Require pull request before merging
- [ ] Require status checks to pass
- [ ] Require branches to be up to date
- [ ] Require conversation resolution
- [ ] Include administrators

#### Develop Branch:
- [ ] Add rule for `develop` branch
- [ ] Require pull request before merging
- [ ] Require status checks to pass
- [ ] Require branches to be up to date

### 7. Enable Security Features
- [ ] Go to Settings → Security
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Code scanning
- [ ] Enable Secret scanning
- [ ] Enable Push protection

### 8. Test the Setup
- [ ] Run: `gh workflow run ci-cd.yml`
- [ ] Check Actions tab for successful run
- [ ] Verify all jobs pass

## 🚀 Quick Setup Commands

### Manual Setup Commands:
```bash
# Enable Actions
gh api repos/:owner/:repo/actions/permissions --method PUT --field enabled=true --field allowed_actions=all

# Set workflow permissions
gh api repos/:owner/:repo/actions/permissions/workflow --method PUT --field default_workflow_permissions=write

# Create environments
gh api repos/:owner/:repo/environments --method PUT --field name=production
gh api repos/:owner/:repo/environments --method PUT --field name=staging

# Add secrets (replace with your values)
gh secret set DATABASE_URL --env production --body "postgresql://user:password@host:5432/db"
gh secret set REDIS_URL --env production --body "redis://host:6379"
gh secret set GOOGLE_CLOUD_API_KEY --env production --body "your-api-key"
gh secret set OPENAI_API_KEY --env production --body "your-openai-key"

# Set repository variables
gh api repos/:owner/:repo/actions/variables --method POST --field name=REGISTRY --field value=ghcr.io
gh api repos/:owner/:repo/actions/variables --method POST --field name=IMAGE_NAME --field value=your-username/multi-model
```

## 🔍 Verification

### Check if setup is complete:
```bash
# Run validation workflow
gh workflow run validate-setup.yml

# Check workflow status
gh run list --limit 5

# List secrets (names only)
gh secret list --env production
```

### Expected Results:
- ✅ All workflows run successfully
- ✅ No permission errors
- ✅ Secrets are accessible
- ✅ Container registry access works

## 📋 Required Values

### Database URLs:
- **Production**: `postgresql://user:password@prod-host:5432/emotion_analysis`
- **Staging**: `postgresql://user:password@staging-host:5432/emotion_analysis_staging`

### Redis URLs:
- **Production**: `redis://prod-host:6379`
- **Staging**: `redis://staging-host:6379`

### API Keys:
- **Google Cloud**: Get from Google Cloud Console
- **OpenAI**: Get from OpenAI Platform

### Kubernetes Config:
```bash
# Generate base64 encoded config
base64 -w 0 ~/.kube/config
```

## 🆘 Troubleshooting

### Common Issues:

1. **Actions not running**:
   - Check Actions permissions in Settings
   - Verify workflow files are in `.github/workflows/`

2. **Container registry access denied**:
   - Verify `GITHUB_TOKEN` has write permissions
   - Check package registry settings

3. **Secrets not found**:
   - Verify secret names match exactly
   - Check if secrets are in correct environment
   - Ensure workflow references correct environment

4. **Permission errors**:
   - Check if you have admin access to repository
   - Verify GitHub CLI is authenticated
   - Check branch protection rules

## ✅ Completion Checklist

After setup, verify:
- [ ] GitHub Actions workflows run successfully
- [ ] Container images build and push to registry
- [ ] Security scans complete without critical issues
- [ ] Environment secrets are accessible
- [ ] Branch protection rules are active
- [ ] Monitoring and alerting work correctly

**🎉 Your repository is now ready for CI/CD!** 
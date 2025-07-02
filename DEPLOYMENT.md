# GitHub Pages Deployment

This document explains how to deploy FreeSpot to GitHub Pages using the automated workflow.

## Setup Instructions

### 1. Repository Configuration

Make sure your repository is configured correctly:

- Repository should be public (required for GitHub Pages on free accounts)
- Repository name should match the base path in `vite.config.ts` (currently set to `/freespot/`)

### 2. GitHub Pages Settings

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. This enables the custom deployment workflow

### 3. Repository Permissions

The workflow needs the following permissions (automatically granted):
- `pages: write` - to deploy to Pages
- `id-token: write` - to verify deployment source

## Deployment Process

### Manual Deployment

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Deploy to GitHub Pages" workflow
4. Click "Run workflow" button
5. Choose environment (production/staging)
6. Click "Run workflow"

The deployment process includes:
- ✅ Install dependencies
- ✅ Run tests
- ✅ Build application with production optimizations
- ✅ Deploy to GitHub Pages

### Local Testing

Test the production build locally before deploying:

```bash
# Build for GitHub Pages
npm run build:github

# Preview with correct base path
npm run preview:github
```

## Configuration Files

### `.github/workflows/deploy.yml`
- Manual trigger workflow
- Runs tests and builds the app
- Deploys to GitHub Pages

### `vite.config.ts`
- Sets base path to `/freespot/` for production
- Keeps root path for development

### `public/.nojekyll`
- Prevents GitHub from treating this as Jekyll site
- Ensures proper asset loading

## Deployment URL

After successful deployment, your app will be available at:
```
https://[username].github.io/freespot/
```

Replace `[username]` with your GitHub username.

## Troubleshooting

### Assets Not Loading
- Verify base path in `vite.config.ts` matches repository name
- Check that `.nojekyll` file exists in `public/` directory

### Workflow Failures
- Check the Actions tab for error logs
- Ensure all tests pass: `npm test`
- Verify build succeeds: `npm run build:github`

### Permission Issues
- Repository must be public for free GitHub Pages
- Workflow permissions are automatically configured

## Environment Variables

The deployment uses:
- `NODE_ENV=production` - Enables production optimizations
- Base path automatically set via Vite config
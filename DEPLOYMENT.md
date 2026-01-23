# Vercel Deployment Guide

Complete guide for deploying this React e-commerce catalogue to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Node.js installed locally (for testing)

## Quick Start

### Step 1: Prepare Your Code

1. **Ensure all files are committed**
   ```bash
   git status
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Method A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **"Deploy"**
6. Wait 1-2 minutes for build to complete
7. Your site is live! 🎉

#### Method B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod
```

## Build Configuration

### Automatic Detection

Vercel automatically detects Vite projects and uses:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x (default)

### Manual Configuration (if needed)

If auto-detection doesn't work, manually set in Vercel dashboard:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Development Command | `npm run dev` |

## Project Structure for Vercel

```
your-project/
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies & scripts
├── vite.config.js      # Vite configuration
├── index.html          # Entry point
├── public/            # Static assets
│   └── images/        # Product images
└── src/               # Source code
    ├── components/
    ├── pages/
    ├── data/
    └── ...
```

## Important Files

### vercel.json

This file configures:
- SPA routing (all routes → index.html)
- Cache headers for assets
- Build settings

**Don't delete this file!**

### package.json

Required scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Environment Variables

If you need environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables:
   - `NODE_ENV=production` (auto-set)
   - Add any custom variables you need
3. Redeploy

## Post-Deployment

### Test Your Deployment

1. **Homepage**: `https://your-project.vercel.app`
2. **Product Pages**: Click any product
3. **Navigation**: Test all menu items
4. **WhatsApp**: Click WhatsApp button
5. **Mobile**: Test on mobile device

### Common Issues & Solutions

#### Issue: Routes return 404
**Solution**: Ensure `vercel.json` exists with rewrites configuration

#### Issue: Images not loading
**Solution**: 
- Check images are in `public/images/`
- Verify image paths in `src/data/products.js`
- Ensure images are committed to git

#### Issue: Build fails
**Solution**:
- Check Vercel build logs
- Ensure all dependencies in `package.json`
- Verify Node.js version compatibility

#### Issue: WhatsApp not working
**Solution**:
- Verify WhatsApp number in `src/components/WhatsAppButton.jsx`
- Check number format (country code, no +)

## Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)

## Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

### Disable Auto-Deploy (if needed)

Settings → Git → Unlink Repository

## Performance Optimization

Vercel automatically:
- ✅ CDN distribution
- ✅ Image optimization
- ✅ Gzip compression
- ✅ HTTP/2 support
- ✅ Edge caching

## Monitoring

- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Deployments → View Logs
- **Performance**: Built-in Web Vitals tracking

## Rollback

If something goes wrong:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

## Checklist Before Deployment

- [ ] All code committed to git
- [ ] `package.json` has correct scripts
- [ ] `vercel.json` exists in root
- [ ] WhatsApp number updated
- [ ] Product images added (if using local images)
- [ ] Tested locally with `npm run build`
- [ ] All routes working locally
- [ ] Mobile responsive tested

## Deployment Commands Reference

```bash
# Local development
npm run dev

# Build locally
npm run build

# Preview build
npm run preview

# Deploy to Vercel (first time)
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

---

**Ready to deploy?** Push your code to GitHub and import to Vercel! 🚀


# Build for production
npm run build

# Build as web app (for deployment)
npm run build:app

# Build as library (for npm package)
npm run build:lib
```

## 🚀 Deployment

### Vercel Deployment
The easiest way to deploy is using Vercel:

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: GitHub Integration
# Push to GitHub and connect to Vercel dashboard
```

The project includes:
- ✅ `vercel.json` configuration
- ✅ Automatic app/library build detection
- ✅ Proper routing for SPA
- ✅ CORS headers for Web Audio API

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed deployment guide.

### Other Platforms
- **Netlify**: Works with `npm run build:app`
- **GitHub Pages**: Requires additional configuration for SPA routing
- **Custom Server**: Serve the `dist/` folder as static files
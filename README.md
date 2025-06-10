# audioblocks/audio-streams

to-be submodule for the audioblocks

# Build as web app (for deployment)
npm run build:app

# Development env setup
```
git clone dlfkgnldgkhj --depth 1 ………

$> bun i && bun dev


[…prompt away…]
⌠ git commit -m ':---)' && git push --no-verify --ff --force -u origin main
⎮ [………]
⌡ git add . && git commit -m "fix linting issues" && git push # <-- classic
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

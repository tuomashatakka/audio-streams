# Vercel Deployment Guide for Audio Streams 🚀

This guide will help you deploy the Audio Streams module to Vercel successfully.

## 🎯 Quick Setup

### 1. **Vercel Configuration**
The project includes a `vercel.json` file with the correct settings:

```json
{
  "buildCommand": "npm run build:app",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy", 
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

### 2. **Package.json Scripts**
The following scripts are configured for deployment:

- `npm run build:app` - Builds as a web application (for Vercel)
- `npm run build:lib` - Builds as a library (for npm package)
- `npm run build` - Default library build

## 🔧 Build Configuration

### Conditional Build Setup
The `vite.config.ts` automatically detects deployment environments:

```typescript
// Detects Vercel/Netlify deployment or BUILD_MODE=app
const isAppBuild = process.env.BUILD_MODE === 'app' || process.env.VERCEL || process.env.NETLIFY

// Uses different build configs for app vs library
```

### App Build vs Library Build

**App Build (for deployment):**
- Entry point: `index.html`
- Output: Static website in `dist/` folder
- Includes all HTML, CSS, JS assets
- Ready for hosting on Vercel/Netlify

**Library Build (for npm):**
- Entry point: `src/index.ts`
- Output: ES modules and CommonJS
- For use in other React projects
- Exports components and utilities

## 🚀 Deployment Steps

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd /path/to/audio-streams
vercel --prod
```

### Option 2: Vercel Dashboard
1. **Connect Repository** - Import your GitHub/GitLab repo
2. **Configure Project** - Vercel should auto-detect settings
3. **Set Environment Variables** (if needed):
   - `BUILD_MODE=app` (optional - auto-detected)
4. **Deploy** - Click deploy button

### Option 3: GitHub Integration
1. **Push to GitHub** - Push your code to a repository
2. **Connect to Vercel** - Import the repo in Vercel dashboard
3. **Auto-deploy** - Every push triggers a new deployment

## ✅ Verification Checklist

After deployment, verify:

- [ ] **Homepage loads** - Shows "Audio Streams Demo" header
- [ ] **Drag & Drop works** - Can drop audio files onto interface
- [ ] **Audio processing** - Files get processed and create tracks
- [ ] **Playback controls** - Play/pause/stop buttons work
- [ ] **Timeline scrubbing** - Can click timeline to seek
- [ ] **Audio output** - Can hear audio when playing tracks
- [ ] **Console errors** - No critical errors in browser console

## 🐛 Troubleshooting

### Common Issues

**1. 404 Page Not Found**
- Check `vercel.json` rewrites configuration
- Ensure `index.html` is in `dist/` folder after build
- Verify build command: `npm run build:app`

**2. Blank White Page**
- Check browser console for JavaScript errors
- Verify all assets are loading correctly
- Check if build includes all necessary files

**3. Audio Not Working**
- AudioContext requires user gesture (click play first)
- Check browser console for audio-related errors
- Verify CORS headers are set correctly

**4. Build Failures**
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run type-check`
- Verify Node.js version compatibility

### Environment Variables

If needed, set these in Vercel dashboard:

```bash
# Force app build mode (usually auto-detected)
BUILD_MODE=app

# Development mode (for debugging)
NODE_ENV=development
```

## 📱 Performance Tips

### Optimization for Production

1. **Audio File Formats**
   - Use compressed formats (MP3, M4A) for faster loading
   - Keep file sizes reasonable (< 10MB per file)

2. **Browser Compatibility**
   - Test on Chrome, Firefox, Safari, Edge
   - Mobile Safari requires user gesture for audio

3. **Loading Performance**
   - Files process in background (no UI blocking)
   - Waveforms generate after audio decoding
   - Progress indicators show processing status

## 🔗 Example Deployment

Live demo: [Your Vercel URL will appear here after deployment]

## 📞 Support

If you encounter issues:

1. **Check the build logs** in Vercel dashboard
2. **Test locally** with `npm run build:app && npm run preview`
3. **Verify all files** are included in the `dist/` folder
4. **Check browser console** for runtime errors

---

**Happy Deploying! 🎵✨**

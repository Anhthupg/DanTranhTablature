# 🌐 Dan Tranh Tablature v3.7.2 - Deployment Guide

## 🎯 GitHub Pages Ready!

Your Dan Tranh Tablature system is now **fully compatible with GitHub Pages** and any static hosting platform. Here's your complete deployment guide:

---

## ✅ What Was Accomplished

### 🔄 URL-Safe Structure
- **126 Vietnamese songs** converted to URL-safe directory names
- **Beautiful Vietnamese titles preserved** in metadata for display
- **No server features required** - works with pure static hosting

### 📁 Dual Naming System
| Type | Example | Usage |
|------|---------|-------|
| **Directory** | `Co_noi_sao` | URLs, file paths |
| **Display** | `Cô nói sao` | User interface, titles |

### 🤖 Auto-Import Ready
- **New MusicXML files** automatically get URL-safe directory names
- **Vietnamese display names** preserved in metadata
- **Future-proof** for thousands of songs

---

## 🚀 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

#### Step 1: Enable GitHub Pages
1. Go to your repository: `https://github.com/yourusername/DanTranhTablature`
2. Click **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main`
5. **Folder**: `/v3` (or `/ (root)` if you want to serve from root)
6. Click **Save**

#### Step 2: Access Your Site
- **URL**: `https://yourusername.github.io/DanTranhTablature/v3/`
- **Library**: `https://yourusername.github.io/DanTranhTablature/v3/index.html`
- **Individual Songs**: `https://yourusername.github.io/DanTranhTablature/v3/data/processed/Co_noi_sao/complete-dual-panel.html`

#### ✅ GitHub Pages Benefits
- ✅ **Free hosting**
- ✅ **Custom domain support**
- ✅ **Automatic builds** on git push
- ✅ **HTTPS by default**
- ✅ **No server maintenance**

---

### Option 2: Netlify (Enhanced Features)

#### Quick Deploy
1. Go to [netlify.com](https://netlify.com)
2. **New site from Git** → Select your GitHub repo
3. **Build command**: Leave empty (static site)
4. **Publish directory**: `v3`
5. **Deploy site**

#### ✅ Netlify Benefits
- ✅ **Free tier available**
- ✅ **Custom domains**
- ✅ **Form handling**
- ✅ **Serverless functions** (if you want server features later)
- ✅ **Branch previews**

---

### Option 3: Vercel (Performance Optimized)

#### Quick Deploy
1. Go to [vercel.com](https://vercel.com)
2. **Import Git Repository**
3. **Root Directory**: `v3`
4. **Deploy**

#### ✅ Vercel Benefits
- ✅ **Free tier**
- ✅ **Global CDN**
- ✅ **Edge functions**
- ✅ **Analytics**
- ✅ **Fast builds**

---

## 🔧 System Architecture

### File Structure
```
v3/
├── index.html                    # Main library interface
├── data/processed/              # All song data
│   ├── Co_noi_sao/             # URL-safe directory name
│   │   ├── metadata.json        # Contains songName: "Cô nói sao"
│   │   ├── complete-dual-panel.html
│   │   ├── relationships.json
│   │   └── thumbnail.svg
│   ├── Bai_choi/
│   └── ... (126 more songs)
├── convert-to-url-safe.js      # Conversion tool
├── auto-import.js              # New file processor
└── server.js                   # Optional local development
```

### How Display Names Work
```javascript
// In metadata.json:
{
  "songName": "Cô nói sao",        // Beautiful Vietnamese display
  "directoryName": "Co_noi_sao",   // URL-safe file path
  "totalNotes": 91,
  "tuning": "C-D-Eb-F-Bb"
}

// In index.html:
name: metadata.songName,          // Shows "Cô nói sao" to users
dirName: dirName,                 // Uses "Co_noi_sao" for URLs
```

---

## 🌍 Testing Your Deployment

### Test URLs to Verify
```bash
# Main library
https://yoursite.com/v3/

# Individual song (URL-safe path)
https://yoursite.com/v3/data/processed/Co_noi_sao/complete-dual-panel.html

# Metadata (URL-safe path)
https://yoursite.com/v3/data/processed/Bai_choi/metadata.json

# Thumbnail
https://yoursite.com/v3/data/processed/Ba_rang_ba_ri/thumbnail.svg
```

### Expected Results
- ✅ **Library loads** with 128 Vietnamese song titles
- ✅ **Song cards show** beautiful Vietnamese names (e.g., "Cô nói sao")
- ✅ **Clicking songs** opens individual viewers
- ✅ **URLs are clean** (no %20 encoding issues)
- ✅ **All themes work** (White, Light Grey, Dark Grey, Black)

---

## 🔄 Adding New Songs

### For New MusicXML Files
1. **Drop files** in `v3/data/musicxml/`
2. **Run auto-import**:
   ```bash
   cd v3
   node auto-import.js
   ```
3. **Files automatically get URL-safe names**:
   - `Nàng Kiều.xml` → `v3/data/processed/Nang_Kieu/`
   - **Display name preserved**: "Nàng Kiều"
   - **Directory is URL-safe**: `Nang_Kieu`

### Auto-Import Features
- ✅ **Vietnamese character conversion**: à→a, ô→o, ư→u
- ✅ **Space handling**: spaces become underscores
- ✅ **Special character removal**: safe for all file systems
- ✅ **Metadata preservation**: Beautiful Vietnamese names in JSON

---

## 🎵 Vietnamese Character Handling

### Conversion Examples
| Original Vietnamese | URL-Safe Directory | Display Name |
|-------------------|-------------------|--------------|
| `Cô nói sao` | `Co_noi_sao` | `Cô nói sao` |
| `Bài chòi` | `Bai_choi` | `Bài chòi` |
| `Hát ru em (quảng bình)` | `Hat_ru_em_quang_binh` | `Hát ru em (quảng bình)` |
| `Đò đưa quan họ` | `Do_dua_quan_ho` | `Đò đưa quan họ` |

### Character Mapping
```javascript
// Vietnamese diacritics → ASCII
ô, ở, ớ, ờ, ợ, ỡ → o
à, á, ạ, ả, ã, â, ă → a
è, é, ẹ, ẻ, ẽ, ê → e
ù, ú, ụ, ủ, ũ, ư → u
ì, í, ị, ỉ, ĩ → i
ỳ, ý, ỵ, ỷ, ỹ → y
đ → d
```

---

## 🛠️ Local Development

### Option 1: With Server Features (Development)
```bash
cd v3
node server.js
# Serves at http://localhost:8080
# Includes URL decoding for Vietnamese characters
```

### Option 2: Static Only (Production Simulation)
```bash
cd v3
python3 -m http.server 8081
# Serves at http://localhost:8081
# Simulates GitHub Pages/static hosting
```

---

## 📊 Performance Benefits

### GitHub Pages Advantages
- **Global CDN**: Fast loading worldwide
- **Caching**: Automatic browser and edge caching
- **No server costs**: Completely free hosting
- **Reliability**: GitHub's infrastructure
- **SSL/HTTPS**: Automatic secure connections

### File Size Optimization
- **128 songs**: ~50MB total (very reasonable)
- **Individual viewers**: ~100-200KB each
- **Thumbnails**: SVG format (small, scalable)
- **Metadata**: JSON format (efficient)

---

## 🎯 Next Steps

### Immediate
1. ✅ **Deploy to GitHub Pages** using guide above
2. ✅ **Test all functionality** with provided URLs
3. ✅ **Share your live site** with users

### Future Enhancements
- **Custom domain**: Point your domain to GitHub Pages
- **Analytics**: Add Google Analytics for usage tracking
- **PWA features**: Make it installable as an app
- **Search optimization**: Add meta tags for SEO

---

## 🚨 Troubleshooting

### Issue: Songs Don't Load
**Cause**: URL encoding issues
**Solution**: ✅ **Already fixed** - all directories are URL-safe

### Issue: Vietnamese Names Don't Show
**Cause**: Missing metadata
**Solution**: Check `metadata.json` has `songName` field

### Issue: 404 Errors
**Cause**: Incorrect paths
**Solution**: Ensure GitHub Pages is set to `/v3` folder

### Issue: Themes Don't Work
**Cause**: CSS not loading
**Solution**: Check GitHub Pages deployment completed successfully

---

## 🎉 Deployment Complete!

Your **Dan Tranh Tablature v3.7.2** is now:

- ✅ **GitHub Pages ready** - No server required
- ✅ **Vietnamese character friendly** - Beautiful display names preserved
- ✅ **Auto-import ready** - New songs get URL-safe names automatically
- ✅ **Cross-platform compatible** - Works everywhere
- ✅ **Free to host** - No ongoing costs
- ✅ **Scalable** - Ready for 1000+ songs

**Your live site will be**: `https://yourusername.github.io/DanTranhTablature/v3/`

Enjoy your **free, fast, and beautiful** Vietnamese music library! 🎵
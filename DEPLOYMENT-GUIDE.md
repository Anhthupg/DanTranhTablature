# Deployment Guide for Dan Tranh Tablature

## Quick Deploy (Automated)

### Option 1: Using the deployment script
```bash
./deploy.sh "Your commit message here"
```

### Option 2: Manual deployment
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## First-Time Setup (Already Done!)

### SSH Key Setup
✅ SSH key already generated at `~/.ssh/id_ed25519`
✅ Remote switched to SSH: `git@github.com:Anhthupg/DanTranhTablature.git`

### Add SSH Key to GitHub
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste this key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINWWCXP+Lo1F50C3yNEnQm3ZGAUj61ZRHa1J5nLNYxDB ngothanhnhan@macbookpro.mynetworksettings.com
```
4. Click "Add SSH key"

## Deployment Examples

### Example 1: Deploy V4.3.6 changes
```bash
./deploy.sh "V4.3.6 - Syllable count fix implemented"
```

### Example 2: Deploy new features
```bash
./deploy.sh "Added phrase analysis visualization"
```

### Example 3: Deploy bug fixes
```bash
./deploy.sh "Fix: Tablature alignment issues resolved"
```

## What the Script Does

1. ✅ Checks git status
2. ✅ Adds all changes
3. ✅ Shows what will be committed
4. ✅ Creates commit with your message
5. ✅ Pushes to GitHub main branch
6. ✅ Confirms successful deployment

## Troubleshooting

### SSH Connection Test
```bash
ssh -T git@github.com
```

Should show: "Hi Anhthupg! You've successfully authenticated..."

### Manual Push
```bash
git push origin main
```

### View Remote
```bash
git remote -v
```

Should show:
```
origin  git@github.com:Anhthupg/DanTranhTablature.git (fetch)
origin  git@github.com:Anhthupg/DanTranhTablature.git (push)
```

## GitHub Repository
https://github.com/Anhthupg/DanTranhTablature

## Future Deployments

Simply run:
```bash
./deploy.sh "Your version description"
```

That's it! The script handles everything automatically.

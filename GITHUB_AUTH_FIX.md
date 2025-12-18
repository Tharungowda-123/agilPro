# 🔐 Fix GitHub Authentication Error

## Problem
```
fatal: Authentication failed for 'https://github.com/ManojYadavNR/agilPro.git/'
remote: Invalid username or token. Password authentication is not supported for Git operations.
```

## Solution: Use Personal Access Token (PAT)

GitHub no longer accepts passwords. You need to use a **Personal Access Token** instead.

---

## ✅ Method 1: Create Personal Access Token (Recommended)

### Step 1: Create Token on GitHub

1. **Go to GitHub**: https://github.com
2. **Click your profile** (top right) → **Settings**
3. **Scroll down** → Click **"Developer settings"** (left sidebar)
4. **Click "Personal access tokens"** → **"Tokens (classic)"**
5. **Click "Generate new token"** → **"Generate new token (classic)"**
6. **Fill in**:
   - **Note**: `AgilPro Project` (or any name)
   - **Expiration**: Choose (90 days, 1 year, or no expiration)
   - **Select scopes**: Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (if you use GitHub Actions)
7. **Click "Generate token"** at bottom
8. **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't see it again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use Token in Git

**Option A: Update Git Credential (Recommended)**

1. **In VS Code Terminal** or command line:
   ```bash
   cd /home/ai/agilPro
   git push origin main
   ```
2. When prompted:
   - **Username**: Enter your GitHub username (`ManojYadavNR`)
   - **Password**: Paste your **Personal Access Token** (not your GitHub password!)
3. VS Code will save this for future use

**Option B: Update Remote URL with Token**

```bash
cd /home/ai/agilPro
git remote set-url origin https://YOUR_TOKEN@github.com/ManojYadavNR/agilPro.git
```

Replace `YOUR_TOKEN` with your actual token.

**Option C: Use Git Credential Helper**

```bash
# Store credentials
git config --global credential.helper store

# Then push (will prompt once)
git push origin main
# Username: ManojYadavNR
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```

---

## ✅ Method 2: Use SSH (Alternative)

### Step 1: Generate SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Press Enter for no passphrase (or set one)

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/id_ed25519
```

### Step 2: Add SSH Key to GitHub

1. **Copy your public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. **Copy the output** (starts with `ssh-ed25519`)
3. **Go to GitHub**: https://github.com/settings/keys
4. **Click "New SSH key"**
5. **Title**: `AgilPro Development`
6. **Key**: Paste your public key
7. **Click "Add SSH key"**

### Step 3: Change Remote to SSH

```bash
cd /home/ai/agilPro
git remote set-url origin git@github.com:ManojYadavNR/agilPro.git
```

### Step 4: Test Connection

```bash
ssh -T git@github.com
# Should say: "Hi ManojYadavNR! You've successfully authenticated..."
```

---

## 🚀 Quick Fix (Fastest Method)

**Just do this:**

1. **Create PAT** (see Method 1, Step 1 above)
2. **In VS Code**:
   - Click "Sync Changes" button
   - When prompted for password, paste your **Personal Access Token**
   - VS Code will remember it

---

## ✅ Verify It Works

After setting up, test:

```bash
cd /home/ai/agilPro
git push origin main
```

Should work without errors!

---

## 🔧 Troubleshooting

### Still getting errors?

1. **Clear old credentials**:
   ```bash
   git config --global --unset credential.helper
   git credential-cache exit
   ```

2. **Try again** with fresh token

3. **Check token permissions**:
   - Make sure `repo` scope is checked
   - Token not expired

### VS Code not saving credentials?

1. **Install GitHub extension** in VS Code
2. **Sign in to GitHub** in VS Code:
   - Click account icon (bottom left)
   - Sign in with GitHub
   - Authorize VS Code

---

## 📝 Quick Reference

**Personal Access Token**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
**Username**: `ManojYadavNR`
**Repository**: `ManojYadavNR/agilPro`

---

**After fixing, you can push your code and deploy to Render! 🚀**


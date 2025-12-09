# 🚀 Ubuntu Deployment Instructions

## Quick Start (Recommended)

On your Ubuntu machine, run these commands:

```bash
# Navigate to your project directory
cd /path/to/security-platform

# Pull the latest changes
git pull origin master

# Make the script executable
chmod +x rebuild-docker.sh

# Run the automated rebuild script
./rebuild-docker.sh
```

That's it! The script will:
1. ✅ Pull latest changes
2. ✅ Stop existing container
3. ✅ Set proper permissions
4. ✅ Rebuild Docker image
5. ✅ Start container
6. ✅ Verify everything works

---

## Manual Deployment (Alternative)

If you prefer to run commands manually:

### Step 1: Pull Changes
```bash
cd /path/to/security-platform
git pull origin master
```

### Step 2: Set Permissions
```bash
# Ensure data directory exists
mkdir -p ./data/tutorials

# Set proper permissions (755)
chmod -R 755 ./data
```

### Step 3: Rebuild Container
```bash
# Stop existing container
docker-compose down

# Rebuild with no cache
docker-compose build --no-cache

# Start container
docker-compose up -d
```

### Step 4: Verify
```bash
# Check container is running
docker ps

# View logs
docker logs security-platform -f

# Check permissions inside container
docker exec -it security-platform ls -la /app/data
```

---

## What Changed?

### Files Modified:
1. **Dockerfile** - Added proper directory creation and ownership
2. **docker-compose.yml** - Added user mapping and startup permissions
3. **src/lib/tutorials.ts** - Enhanced error logging

### Files Added:
1. **rebuild-docker.sh** - Automated deployment script (Linux)
2. **rebuild-docker.ps1** - Automated deployment script (Windows)
3. **DOCKER_FIX_GUIDE.md** - Detailed troubleshooting guide
4. **FIX_SUMMARY.md** - Complete fix summary
5. **DOCKER_PERMISSIONS_EXPLAINED.md** - Visual explanation

---

## Testing the Fix

After deployment, test the upload functionality:

1. **Open admin dashboard:**
   ```
   http://your-ubuntu-server:3000/admin
   ```

2. **Upload HTML content:**
   - Click "Import HTML File" or paste HTML content
   - Fill in title, category, description
   - Click "Publish Tutorial"

3. **Verify success:**
   - Tutorial should appear in the list immediately
   - Check files were created:
     ```bash
     ls -la ./data/tutorials/
     cat ./data/metadata.json
     ```

4. **Check logs for confirmation:**
   ```bash
   docker logs security-platform -f
   ```
   
   You should see:
   ```
   [saveTutorial] Attempting to save tutorial to: /app/data/tutorials/...
   [saveTutorial] Successfully wrote HTML file: /app/data/tutorials/...
   [saveTutorial] Successfully saved metadata for: ...
   ```

---

## Troubleshooting on Ubuntu

### Issue: Permission denied

**Solution 1 - Check file ownership:**
```bash
ls -la ./data
```

**Solution 2 - Reset permissions:**
```bash
sudo chown -R $USER:$USER ./data
chmod -R 755 ./data
```

**Solution 3 - Check Docker user mapping:**
```bash
docker exec -it security-platform id
# Should show: uid=1001(nextjs) gid=1001(nodejs)
```

### Issue: Container won't start

**Check logs:**
```bash
docker logs security-platform
```

**Rebuild completely:**
```bash
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Files not persisting

**Verify volume mount:**
```bash
docker inspect security-platform | grep -A 10 Mounts
```

**Check host directory:**
```bash
ls -la ./data/tutorials/
```

---

## Differences from Windows

On Ubuntu/Linux, the permission fix is actually **simpler** because:

1. ✅ Native UID/GID mapping works better
2. ✅ No need for special Windows permissions (icacls)
3. ✅ chmod commands work natively
4. ✅ Better Docker volume performance

The fix should work **more reliably** on Ubuntu than Windows!

---

## Production Considerations

### Using a Reverse Proxy (Recommended)

If deploying to production, use nginx or Caddy:

**Example nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Auto-restart on Boot

Add to systemd or use Docker restart policy (already configured in docker-compose.yml):
```yaml
restart: always
```

### Backup Data Directory

```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz ./data

# Restore backup
tar -xzf backup-20251209.tar.gz
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check data directory size
du -sh ./data

# Check individual tutorials
du -h ./data/tutorials/* | sort -h
```

---

## Security Notes for Ubuntu

1. **Firewall:** Ensure port 3000 is open (or your reverse proxy port)
   ```bash
   sudo ufw allow 3000/tcp
   ```

2. **Docker Security:** The container runs as non-root (UID 1001)
   ```bash
   docker exec -it security-platform whoami
   # Output: nextjs
   ```

3. **File Permissions:** Only owner can write (755)
   ```bash
   ls -la ./data
   # drwxr-xr-x
   ```

---

## Quick Reference

### Start/Stop Commands
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker logs security-platform -f

# Execute command in container
docker exec -it security-platform sh
```

### Useful Checks
```bash
# Container status
docker ps

# Container resource usage
docker stats security-platform

# Network info
docker inspect security-platform | grep IPAddress

# Volume info
docker volume ls
```

---

## Support

If you encounter issues:

1. **Check logs first:**
   ```bash
   docker logs security-platform -f
   ```

2. **Verify permissions:**
   ```bash
   docker exec -it security-platform ls -la /app/data
   ```

3. **Test file write:**
   ```bash
   docker exec -it security-platform sh -c "echo 'test' > /app/data/test.txt && cat /app/data/test.txt"
   ```

4. **Review documentation:**
   - `DOCKER_FIX_GUIDE.md` - Detailed troubleshooting
   - `FIX_SUMMARY.md` - Complete overview
   - `DOCKER_PERMISSIONS_EXPLAINED.md` - Visual diagrams

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Ready for Ubuntu Deployment

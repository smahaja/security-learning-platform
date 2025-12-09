# 🔧 Docker File Upload Fix Guide

## Problem Summary
HTML content uploads were failing in Docker because the container's `nextjs` user (UID 1001) didn't have write permissions to the mounted `data` directory.

## What Was Fixed

### 1. **Dockerfile Changes**
- Created `data/tutorials` directory structure with proper ownership **before** copying files
- Ensured the `nextjs` user owns the entire data directory tree
- This allows the application to write files when running as the non-root user

### 2. **docker-compose.yml Changes**
- Added explicit user mapping (`user: "1001:1001"`)
- Added startup command to ensure proper permissions on the data directory
- Maintains bind mount for easy data access from host

## 🚀 How to Apply the Fix

### Step 1: Stop the Current Container
```bash
docker-compose down
```

### Step 2: Rebuild the Docker Image
```bash
docker-compose build --no-cache
```

The `--no-cache` flag ensures a clean rebuild with the new permission settings.

### Step 3: Ensure Data Directory Permissions on Host
On your host machine, make sure the data directory is accessible:

**On Linux/Mac:**
```bash
chmod -R 755 ./data
```

**On Windows (PowerShell):**
```powershell
icacls .\data /grant Everyone:(OI)(CI)F /T
```

### Step 4: Start the Container
```bash
docker-compose up -d
```

### Step 5: Verify the Fix
1. Open your browser to `http://localhost:3000/admin`
2. Try uploading HTML content
3. Check that the tutorial appears in the list
4. Verify the file was created in `./data/tutorials/` on your host

## 🔍 Troubleshooting

### Issue: Still can't upload files

**Check container logs:**
```bash
docker logs security-platform
```

**Check file permissions inside container:**
```bash
docker exec -it security-platform ls -la /app/data
```

You should see:
```
drwxr-xr-x    3 nextjs   nodejs        4096 Dec  9 14:00 .
drwxr-xr-x    1 nextjs   nodejs        4096 Dec  9 14:00 ..
-rw-r--r--    1 nextjs   nodejs        3340 Dec  9 14:00 metadata.json
drwxr-xr-x    2 nextjs   nodejs        4096 Dec  9 14:00 tutorials
```

**Verify user inside container:**
```bash
docker exec -it security-platform whoami
```

Should output: `nextjs`

### Issue: Permission denied on Windows

If you're on Windows and still having issues, you may need to:

1. **Ensure Docker Desktop has access to the drive:**
   - Open Docker Desktop Settings
   - Go to Resources → File Sharing
   - Ensure your project drive is shared

2. **Run Docker Desktop as Administrator** (one-time setup)

3. **Alternative: Use a named volume instead of bind mount**
   
   Edit `docker-compose.yml`:
   ```yaml
   volumes:
     - tutorial-data:/app/data
   
   volumes:
     tutorial-data:
   ```
   
   **Note:** With named volumes, data is stored in Docker's internal storage, not directly accessible from host.

## 📊 Verify Data Persistence

After uploading content, verify files are persisted:

```bash
# List tutorials in data directory
ls -la ./data/tutorials/

# Check metadata
cat ./data/metadata.json
```

## 🔄 Migration from Old Setup

If you had data in the old container, you can migrate it:

```bash
# Copy data from old container (if it's still running)
docker cp security-platform:/app/data ./data-backup

# Stop old container
docker-compose down

# Apply fix (rebuild)
docker-compose build --no-cache

# Copy data back if needed
cp -r ./data-backup/* ./data/

# Start new container
docker-compose up -d
```

## ✅ Expected Behavior After Fix

1. ✅ Upload HTML files via admin dashboard
2. ✅ Files saved to `./data/tutorials/[id].html`
3. ✅ Metadata updated in `./data/metadata.json`
4. ✅ Tutorials visible in library immediately
5. ✅ Data persists across container restarts
6. ✅ Can edit/delete tutorials

## 🎯 Testing Checklist

- [ ] Container starts without errors
- [ ] Can access admin dashboard at `/admin`
- [ ] Can upload new HTML tutorial
- [ ] Tutorial appears in library
- [ ] Can view uploaded tutorial
- [ ] Can edit existing tutorial
- [ ] Can delete tutorial
- [ ] Data persists after `docker-compose restart`
- [ ] Files visible in `./data/tutorials/` on host

## 📝 Additional Notes

### Why User 1001?
The Dockerfile creates the `nextjs` user with UID 1001. By mapping the container user to 1001, we ensure consistency between the build-time and runtime user, allowing proper file access.

### Why Not Run as Root?
Running as non-root is a security best practice. The fix maintains this security posture while enabling file writes.

### Data Directory Structure
```
data/
├── metadata.json          # Tutorial metadata (titles, categories, etc.)
├── tutorials/             # Individual HTML files
│   ├── tutorial-1.html
│   ├── tutorial-2.html
│   └── ...
└── tutorials.json.backup  # Backup from old format (if migrated)
```

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check Docker version:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Check disk space:**
   ```bash
   df -h  # Linux/Mac
   ```

3. **Review application logs:**
   ```bash
   docker-compose logs -f web
   ```

4. **Test file write manually:**
   ```bash
   docker exec -it security-platform sh -c "echo 'test' > /app/data/test.txt && cat /app/data/test.txt"
   ```

If the above command fails, there's still a permission issue.

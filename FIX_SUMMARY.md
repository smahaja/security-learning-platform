# 🎯 Docker File Upload Issue - Complete Fix Summary

## Problem Diagnosed
When deploying your security learning platform to Docker, HTML content uploads were failing silently. The tutorials would not save or publish.

### Root Cause
**Permission Mismatch**: The Docker container runs as a non-root user (`nextjs`, UID 1001) for security, but the mounted volume didn't have proper write permissions for this user.

## ✅ Changes Made

### 1. **Dockerfile** (d:\Playground\PRJ-Security-Learning-Website1\security-platform\Dockerfile)
```dockerfile
# Added before copying data:
RUN mkdir -p data/tutorials
RUN chown -R nextjs:nodejs data
```
**Why**: Creates the directory structure with proper ownership BEFORE copying files, ensuring the nextjs user can write to it.

### 2. **docker-compose.yml** (d:\Playground\PRJ-Security-Learning-Website1\security-platform\docker-compose.yml)
```yaml
# Added:
user: "1001:1001"
command: sh -c "chmod -R 755 /app/data 2>/dev/null || true && node server.js"
```
**Why**: 
- Maps container user to UID 1001 (the nextjs user)
- Ensures permissions are set on startup
- Allows file writes from the application

### 3. **Enhanced Error Handling** (src\lib\tutorials.ts)
Added comprehensive logging and error messages to:
- `saveTutorial()` - Now logs file paths and provides clear error messages
- `updateTutorial()` - Same improvements for editing tutorials

**Benefits**:
- Clear error messages mentioning Docker permissions
- Detailed console logs for debugging
- Automatic cleanup on partial failures

## 🚀 How to Apply the Fix

### Quick Method (Recommended)
Run the automated rebuild script:
```powershell
.\rebuild-docker.ps1
```

### Manual Method
```bash
# 1. Stop container
docker-compose down

# 2. Rebuild image
docker-compose build --no-cache

# 3. Start container
docker-compose up -d

# 4. Check logs
docker logs security-platform -f
```

## 📋 Testing Checklist

After applying the fix, verify:

- [ ] Container starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can access admin dashboard at http://localhost:3000/admin
- [ ] **Can upload new HTML tutorial** ✨
- [ ] Tutorial appears in library immediately
- [ ] Can view the uploaded tutorial
- [ ] Can edit existing tutorial
- [ ] Can delete tutorial
- [ ] Files appear in `./data/tutorials/` on host
- [ ] Data persists after `docker-compose restart`

## 🔍 Verification Commands

### Check if container is running
```bash
docker ps
```

### View application logs
```bash
docker logs security-platform -f
```

### Check permissions inside container
```bash
docker exec -it security-platform ls -la /app/data
```

Expected output:
```
drwxr-xr-x    3 nextjs   nodejs        4096 Dec  9 14:00 .
drwxr-xr-x    1 nextjs   nodejs        4096 Dec  9 14:00 ..
-rw-r--r--    1 nextjs   nodejs        3340 Dec  9 14:00 metadata.json
drwxr-xr-x    2 nextjs   nodejs        4096 Dec  9 14:00 tutorials
```

### Test file write manually
```bash
docker exec -it security-platform sh -c "echo 'test' > /app/data/test.txt && cat /app/data/test.txt"
```

If this succeeds, permissions are correct!

### Check what user the app runs as
```bash
docker exec -it security-platform whoami
```

Should output: `nextjs`

## 📊 What You'll See in Logs

### ✅ Successful Upload
```
[saveTutorial] Attempting to save tutorial to: /app/data/tutorials/my-tutorial.html
[saveTutorial] Successfully wrote HTML file: /app/data/tutorials/my-tutorial.html
[saveTutorial] Successfully saved metadata for: my-tutorial
```

### ❌ Permission Error (if fix not applied)
```
[saveTutorial] Attempting to save tutorial to: /app/data/tutorials/my-tutorial.html
[saveTutorial] Failed to write HTML file: /app/data/tutorials/my-tutorial.html
Error: EACCES: permission denied, open '/app/data/tutorials/my-tutorial.html'
Failed to write tutorial file: EACCES: permission denied. Check Docker volume permissions.
```

## 🛠️ Troubleshooting

### Issue: Container won't start
**Check**: Build logs for errors
```bash
docker-compose build
```

### Issue: Still can't upload files
**Check**: Volume permissions on host (Windows)
```powershell
icacls .\data /grant Everyone:(OI)(CI)F /T
```

**Check**: Docker Desktop has access to your drive
- Settings → Resources → File Sharing

### Issue: Files upload but don't persist
**Check**: Volume is properly mounted
```bash
docker inspect security-platform | grep -A 10 Mounts
```

### Issue: Permission denied errors in logs
**Verify**: User mapping is correct
```bash
docker exec -it security-platform id
```

Should show: `uid=1001(nextjs) gid=1001(nodejs)`

## 📁 File Structure

After successful upload, your directory should look like:

```
security-platform/
├── data/
│   ├── metadata.json          # Tutorial metadata
│   ├── tutorials/             # HTML files
│   │   ├── tutorial-1.html
│   │   ├── tutorial-2.html
│   │   └── ...
│   └── tutorials.json.backup  # Old format backup
├── Dockerfile                 # ✅ Updated
├── docker-compose.yml         # ✅ Updated
├── rebuild-docker.ps1         # 🆕 Automation script
└── DOCKER_FIX_GUIDE.md       # 🆕 Detailed guide
```

## 🎓 Understanding the Fix

### Why UID 1001?
- The Dockerfile creates the `nextjs` user with UID 1001
- Docker volumes inherit host permissions
- By mapping the container user to 1001, we ensure consistency

### Why Not Root?
- Running as root in containers is a security risk
- This fix maintains security best practices
- Non-root users can't escalate privileges

### Why the Startup Command?
```bash
sh -c "chmod -R 755 /app/data 2>/dev/null || true && node server.js"
```
- Sets permissions on startup (handles host permission issues)
- `2>/dev/null || true` prevents errors if permissions already correct
- Then starts the Node.js server

## 🔐 Security Considerations

This fix maintains security by:
- ✅ Still running as non-root user
- ✅ Minimal permissions (755 = owner can write, others can read)
- ✅ Only affects the data directory
- ✅ No elevated privileges required

## 📚 Additional Resources

- **Detailed Guide**: See `DOCKER_FIX_GUIDE.md`
- **Rebuild Script**: Run `.\rebuild-docker.ps1`
- **Docker Logs**: `docker logs security-platform -f`
- **Next.js Docs**: https://nextjs.org/docs/deployment/docker

## 🎉 Expected Results

After applying this fix:
1. ✅ HTML uploads work in Docker
2. ✅ Files persist across restarts
3. ✅ Clear error messages if issues occur
4. ✅ Detailed logs for debugging
5. ✅ Secure non-root operation maintained

## 💡 Pro Tips

1. **Always check logs first**: `docker logs security-platform -f`
2. **Test file writes manually** before uploading through UI
3. **Keep data directory backed up** before major changes
4. **Use named volumes** for production deployments
5. **Monitor disk space** as tutorials accumulate

## 🆘 Still Having Issues?

If you're still experiencing problems after applying the fix:

1. **Completely remove and rebuild**:
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Check Docker version**:
   ```bash
   docker --version
   docker-compose --version
   ```
   Ensure you're on a recent version.

3. **Verify host permissions**:
   Make sure your user account has write access to the project directory.

4. **Try with a named volume** instead of bind mount:
   Edit `docker-compose.yml`:
   ```yaml
   volumes:
     - tutorial-data:/app/data
   
   volumes:
     tutorial-data:
   ```

---

**Last Updated**: December 9, 2025
**Status**: ✅ Ready to Deploy

# Docker Volume Permission Issue - Visual Explanation

## Before Fix (❌ Broken)

```
┌─────────────────────────────────────────────────────────────┐
│  HOST MACHINE (Windows)                                     │
│                                                              │
│  ./data/                                                     │
│  ├── metadata.json        (Host User Permissions)           │
│  └── tutorials/           (Host User Permissions)           │
│                                                              │
│       ↓ Volume Mount                                        │
└───────┼──────────────────────────────────────────────────────┘
        │
        │ Bind Mount: ./data → /app/data
        │
┌───────┼──────────────────────────────────────────────────────┐
│       ↓                                                      │
│  DOCKER CONTAINER                                            │
│                                                              │
│  Running as: nextjs (UID 1001)  ← Non-root user             │
│                                                              │
│  /app/data/                                                  │
│  ├── metadata.json        (Host Permissions - READ ONLY!)   │
│  └── tutorials/           (Host Permissions - READ ONLY!)   │
│                                                              │
│  ❌ PROBLEM: nextjs user can't write to mounted directory!  │
│  ❌ Uploads fail silently                                   │
│  ❌ No error messages                                       │
└──────────────────────────────────────────────────────────────┘
```

## After Fix (✅ Working)

```
┌─────────────────────────────────────────────────────────────┐
│  HOST MACHINE (Windows)                                     │
│                                                              │
│  ./data/                                                     │
│  ├── metadata.json        (Permissions: 755)                │
│  └── tutorials/           (Permissions: 755)                │
│                                                              │
│       ↓ Volume Mount                                        │
└───────┼──────────────────────────────────────────────────────┘
        │
        │ Bind Mount: ./data → /app/data
        │ + User Mapping: 1001:1001
        │ + Startup chmod: 755
        │
┌───────┼──────────────────────────────────────────────────────┐
│       ↓                                                      │
│  DOCKER CONTAINER                                            │
│                                                              │
│  Running as: nextjs (UID 1001)  ← Non-root user             │
│  User Mapping: 1001:1001        ← Matches host permissions  │
│                                                              │
│  /app/data/                                                  │
│  ├── metadata.json        (Owner: nextjs - READ/WRITE ✅)   │
│  └── tutorials/           (Owner: nextjs - READ/WRITE ✅)   │
│                                                              │
│  ✅ SOLUTION: nextjs user owns the directory!               │
│  ✅ Uploads work correctly                                  │
│  ✅ Clear error messages if issues occur                    │
│  ✅ Detailed logging for debugging                          │
└──────────────────────────────────────────────────────────────┘
```

## File Upload Flow (After Fix)

```
┌──────────────────┐
│  User uploads    │
│  HTML content    │
│  via /admin      │
└────────┬─────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  AdminDashboard.tsx                                    │
│  - Reads HTML file                                     │
│  - Sends POST to /api/tutorials                        │
└────────┬───────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  /api/tutorials/route.ts                               │
│  - Validates data                                      │
│  - Calls saveTutorial()                                │
└────────┬───────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  lib/tutorials.ts → saveTutorial()                     │
│                                                         │
│  1. ensureDirectories()                                │
│     ✅ Creates /app/data/tutorials if needed           │
│                                                         │
│  2. fs.writeFileSync(filePath, content)                │
│     ✅ Writes HTML to /app/data/tutorials/[id].html    │
│     📝 Logs: "Attempting to save tutorial to: ..."     │
│     📝 Logs: "Successfully wrote HTML file: ..."       │
│                                                         │
│  3. saveMetadata(metadata)                             │
│     ✅ Updates /app/data/metadata.json                 │
│     📝 Logs: "Successfully saved metadata for: ..."    │
│                                                         │
│  ✅ SUCCESS: Tutorial saved!                           │
└────────┬───────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────┐
│  Files Created:                                        │
│                                                         │
│  Host: ./data/tutorials/my-tutorial.html               │
│  Container: /app/data/tutorials/my-tutorial.html       │
│                                                         │
│  Host: ./data/metadata.json (updated)                  │
│  Container: /app/data/metadata.json (updated)          │
│                                                         │
│  ✅ Both accessible from host and container            │
└─────────────────────────────────────────────────────────┘
```

## Permission Breakdown

### File Permissions (755)
```
7 = Owner (nextjs):  Read + Write + Execute
5 = Group (nodejs):  Read + Execute
5 = Others:          Read + Execute
```

**Why 755?**
- Owner (nextjs user) can create/modify files ✅
- Others can read files (for serving content) ✅
- Secure: Others cannot modify files ✅

### User Mapping
```
Container UID 1001 (nextjs) → Host UID 1001
Container GID 1001 (nodejs) → Host GID 1001
```

**Why map users?**
- Files created in container appear with correct ownership on host
- Host permissions apply correctly in container
- Consistent behavior across restarts

## Key Changes in Code

### Dockerfile
```dockerfile
# BEFORE (implicit)
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

# AFTER (explicit)
RUN mkdir -p data/tutorials          # Create structure first
RUN chown -R nextjs:nodejs data      # Set ownership explicitly
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
```

### docker-compose.yml
```yaml
# BEFORE
volumes:
  - ./data:/app/data

# AFTER
user: "1001:1001"                    # Map to nextjs user
volumes:
  - ./data:/app/data
command: sh -c "chmod -R 755 /app/data 2>/dev/null || true && node server.js"
```

### lib/tutorials.ts
```typescript
// BEFORE
fs.writeFileSync(filePath, tutorial.content, 'utf8');

// AFTER
try {
    console.log(`[saveTutorial] Attempting to save tutorial to: ${filePath}`);
    fs.writeFileSync(filePath, tutorial.content, 'utf8');
    console.log(`[saveTutorial] Successfully wrote HTML file: ${filePath}`);
} catch (writeError: any) {
    console.error(`[saveTutorial] Failed to write HTML file: ${filePath}`, writeError);
    throw new Error(`Failed to write tutorial file: ${writeError.message}. Check Docker volume permissions.`);
}
```

## Debugging Workflow

```
┌─────────────────────┐
│  Upload fails       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────────┐
│  Check Docker logs                  │
│  $ docker logs security-platform -f │
└──────────┬──────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────┐
│  Look for error messages:                           │
│                                                      │
│  ❌ "Failed to write HTML file"                     │
│     → Permission issue                              │
│                                                      │
│  ❌ "EACCES: permission denied"                     │
│     → User doesn't have write access                │
│                                                      │
│  ❌ "ENOENT: no such file or directory"             │
│     → Directory doesn't exist                       │
└──────────┬──────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────┐
│  Check permissions inside container                 │
│  $ docker exec -it security-platform ls -la /app/data │
└──────────┬──────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────┐
│  Verify user                                        │
│  $ docker exec -it security-platform whoami         │
│  Expected: nextjs                                   │
└──────────┬──────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────┐
│  Test manual write                                  │
│  $ docker exec -it security-platform sh -c \        │
│    "echo 'test' > /app/data/test.txt"               │
└──────────┬──────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────┐
│  If fails → Rebuild with fix                        │
│  $ ./rebuild-docker.ps1                             │
│                                                      │
│  If succeeds → Check application code               │
└──────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌────────────────────────────────────────────────────┐
│  Security Best Practices Maintained                │
│                                                     │
│  ✅ Non-root user (nextjs, UID 1001)               │
│  ✅ Minimal permissions (755, not 777)             │
│  ✅ Isolated data directory                        │
│  ✅ No privilege escalation                        │
│  ✅ Read-only application code                     │
│  ✅ Writable data directory only                   │
│                                                     │
│  Container Security:                               │
│  - Application runs as nextjs (non-root)           │
│  - Can only write to /app/data                     │
│  - Cannot modify system files                      │
│  - Cannot install packages                         │
│  - Cannot change user                              │
└─────────────────────────────────────────────────────┘
```

## Common Pitfalls Avoided

```
❌ WRONG: Run container as root
   user: "0:0"
   → Security risk!

❌ WRONG: Set permissions to 777
   chmod -R 777 /app/data
   → Everyone can write!

❌ WRONG: Disable user in Dockerfile
   USER root
   → Defeats security purpose!

✅ CORRECT: Map to non-root user
   user: "1001:1001"
   → Secure and functional!

✅ CORRECT: Minimal permissions
   chmod -R 755 /app/data
   → Owner can write, others read!

✅ CORRECT: Maintain non-root user
   USER nextjs
   → Security best practice!
```

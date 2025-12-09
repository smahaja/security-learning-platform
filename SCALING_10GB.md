# Handling 10GB+ Content in Docker

This guide explains how to manage large amounts of content (10GB+) in your Dockerized security learning platform.

## 🎯 Quick Answer: Yes, Docker Can Handle 10GB!

**Docker itself has no problem with 10GB of data.** However, your **application architecture** needs to be optimized for large files.

---

## 📊 What Changed for 10GB Support

### Old Architecture (Not Suitable for 10GB)
```
data/
└── tutorials.json  (10GB - ❌ Will crash Node.js)
```

**Problems:**
- Loading 10GB JSON into memory = Out of Memory crash
- 10-30 second load times
- File corruption risk
- Cannot handle concurrent uploads

### New Architecture (Optimized for 10GB+)
```
data/
├── metadata.json           (~1MB - Fast to load)
└── tutorials/
    ├── tutorial-1.html     (50MB)
    ├── tutorial-2.html     (100MB)
    ├── tutorial-3.html     (200MB)
    └── ...                 (Total: 10GB+)
```

**Benefits:**
- ✅ Only loads metadata (~1MB) for listing
- ✅ Loads individual HTML files on-demand
- ✅ No memory issues
- ✅ Fast performance even with 1000+ tutorials
- ✅ Safe concurrent uploads

---

## 🚀 Migration Steps

### Step 1: Update Your Code

The new `src/lib/tutorials.ts` has been updated to use file-based storage.

**Key changes:**
- `metadata.json` stores only tutorial info (title, description, etc.)
- Each tutorial's HTML is stored in `data/tutorials/{id}.html`
- Content is loaded **only when viewing** a specific tutorial

### Step 2: Run Migration Script

This will convert your existing `tutorials.json` to the new format:

```bash
# On your local machine (before deploying)
cd security-platform
node migrate.js
```

**What it does:**
1. Reads `data/tutorials.json`
2. Creates `data/tutorials/` directory
3. Saves each tutorial as separate `.html` file
4. Creates `data/metadata.json` with tutorial info
5. Backs up old file to `tutorials.json.backup`

**Output:**
```
🔄 Starting migration to new storage format...

Starting migration from old format...
Migration complete! Migrated 3 tutorials
Old file backed up to: data/tutorials.json.backup

✅ Migration successful!

📊 Storage Statistics:
   Total Tutorials: 3
   Total Size: 0.65 MB (0.00 GB)

📁 Individual Tutorial Sizes:
   - AI Security Learning Lab: 0.22 MB
   - Threat Modeling: 0.31 MB
   - LangChain Document Loaders: 0.12 MB
```

### Step 3: Verify New Structure

```bash
ls -lh data/
# Should show:
# metadata.json
# tutorials/
# tutorials.json.backup

ls -lh data/tutorials/
# Should show:
# ai-security-learning-lab.html
# threat-modeling.html
# langchain-document-loaders-data-ingestion.html
```

### Step 4: Deploy to Ubuntu VM

```bash
# On Ubuntu VM
git pull origin master

# Rebuild Docker container with new code
sudo docker compose down
sudo docker compose up --build -d

# Check logs
sudo docker compose logs -f
```

---

## 🐳 Docker Configuration for 10GB

### Current Setup (Already Configured)

Your `docker-compose.yml` already has the correct volume mount:

```yaml
volumes:
  - ./data:/app/data
```

This mounts your entire `data/` directory, including:
- `metadata.json`
- `tutorials/*.html` (all your HTML files)

### Docker Storage Limits

Docker containers use the **host filesystem**, so:

| Host Disk Space | Max Content Size | Status |
|-----------------|------------------|--------|
| 20 GB free      | ~15 GB content   | ✅ Safe |
| 50 GB free      | ~40 GB content   | ✅ Safe |
| 100 GB free     | ~80 GB content   | ✅ Safe |

**Check your Ubuntu VM disk space:**
```bash
df -h
```

**Example output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       100G   20G   80G  20% /
```
☝️ This VM can handle **~70GB** of tutorial content safely.

---

## 📈 Performance with 10GB

### Expected Performance

| Tutorials | Total Size | Listing Page Load | Single Tutorial Load |
|-----------|------------|-------------------|---------------------|
| 10        | 1 GB       | ~50ms            | ~100-500ms          |
| 50        | 5 GB       | ~100ms           | ~200-800ms          |
| 100       | 10 GB      | ~150ms           | ~300ms-1s           |
| 500       | 50 GB      | ~300ms           | ~500ms-2s           |

### Why It's Fast

1. **Listing page** only loads `metadata.json` (~1MB)
2. **Tutorial page** loads only that specific HTML file
3. **No database queries** - direct file system access
4. **Docker volume mount** is native filesystem performance

---

## 💾 Storage Management for 10GB

### Monitor Storage Usage

**Check total size:**
```bash
# On Ubuntu VM
du -sh data/
# Output: 10G    data/

du -sh data/tutorials/
# Output: 9.9G   data/tutorials/
```

**Check individual files:**
```bash
ls -lh data/tutorials/ | head -20
# Shows largest files first
```

**Inside Docker container:**
```bash
docker exec security-platform du -sh /app/data
```

### Automated Cleanup Script

Create `cleanup-old-tutorials.sh`:

```bash
#!/bin/bash
# Delete tutorials older than 1 year

TUTORIALS_DIR="./data/tutorials"
DAYS_OLD=365

echo "🗑️  Finding tutorials older than $DAYS_OLD days..."

# Find and list old files
find "$TUTORIALS_DIR" -name "*.html" -type f -mtime +$DAYS_OLD -exec ls -lh {} \;

# Ask for confirmation
read -p "Delete these files? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    find "$TUTORIALS_DIR" -name "*.html" -type f -mtime +$DAYS_OLD -delete
    echo "✅ Old tutorials deleted"
else
    echo "❌ Cancelled"
fi
```

### Backup Strategy for 10GB

**Incremental backup (recommended):**

```bash
#!/bin/bash
# backup-incremental.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/tutorials"

# Only backup files changed in last 24 hours
rsync -av --update \
  --include="*.html" \
  --include="metadata.json" \
  ./data/ \
  "$BACKUP_DIR/$DATE/"

echo "✅ Incremental backup complete: $BACKUP_DIR/$DATE/"
```

**Full backup (for weekly backups):**

```bash
#!/bin/bash
# backup-full.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/tutorials"

# Compress and backup entire data directory
tar -czf "$BACKUP_DIR/full-backup-$DATE.tar.gz" ./data/

echo "✅ Full backup complete: full-backup-$DATE.tar.gz"
```

---

## 🔧 Optimization Tips

### 1. Enable Compression (Saves ~70% space)

**Compress HTML files:**

```bash
# Install gzip
sudo apt-get install gzip

# Compress all tutorials
cd data/tutorials
gzip *.html

# Files become: tutorial-1.html.gz (70% smaller)
```

**Update code to handle gzip:**

```typescript
// In src/lib/tutorials.ts
import zlib from 'zlib';

export function getTutorial(id: string): Tutorial | undefined {
    // ... existing code ...
    
    const filePath = getTutorialFilePath(id);
    const gzipPath = filePath + '.gz';
    
    let content: string;
    
    if (fs.existsSync(gzipPath)) {
        // Read compressed file
        const compressed = fs.readFileSync(gzipPath);
        content = zlib.gunzipSync(compressed).toString('utf8');
    } else if (fs.existsSync(filePath)) {
        // Read uncompressed file
        content = fs.readFileSync(filePath, 'utf8');
    } else {
        return undefined;
    }
    
    return {
        ...meta,
        content
    };
}
```

**Result:** 10GB → ~3GB

### 2. Add Caching

```typescript
// Simple in-memory cache for frequently accessed tutorials
const tutorialCache = new Map<string, { content: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getTutorial(id: string): Tutorial | undefined {
    // Check cache first
    const cached = tutorialCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return { ...meta, content: cached.content };
    }
    
    // Load from file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Cache it
    tutorialCache.set(id, { content, timestamp: Date.now() });
    
    return { ...meta, content };
}
```

### 3. Pagination for Large Lists

```typescript
// In src/app/api/tutorials/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const allTutorials = getTutorials();
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return Response.json({
        tutorials: allTutorials.slice(start, end),
        total: allTutorials.length,
        page,
        totalPages: Math.ceil(allTutorials.length / limit)
    });
}
```

---

## 🚨 Troubleshooting

### Issue: "No space left on device"

**Check disk space:**
```bash
df -h
```

**Solution 1: Clean Docker cache**
```bash
sudo docker system prune -a
sudo docker volume prune
```

**Solution 2: Increase VM disk size**
```bash
# In your VM provider (VirtualBox, VMware, etc.)
# Increase disk size to 100GB or more
```

### Issue: Slow tutorial loading

**Cause:** Large HTML files (>10MB each)

**Solution:** Enable compression (see Optimization Tips above)

### Issue: Out of memory error

**Cause:** Too many tutorials cached in memory

**Solution:** Limit cache size:

```typescript
const MAX_CACHE_SIZE = 50; // Only cache 50 tutorials

if (tutorialCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = tutorialCache.keys().next().value;
    tutorialCache.delete(firstKey);
}
```

---

## 📊 Monitoring Dashboard

Create `storage-stats.js` to monitor your storage:

```javascript
import { getStorageStats } from './src/lib/tutorials.js';

const stats = getStorageStats();

console.log('📊 Storage Dashboard\n');
console.log('='.repeat(50));
console.log(`Total Tutorials: ${stats.totalTutorials}`);
console.log(`Total Size: ${stats.totalSizeGB} GB (${stats.totalSizeMB} MB)`);
console.log('='.repeat(50));
console.log('\n📁 Top 10 Largest Tutorials:\n');

const sorted = stats.tutorials.sort((a, b) => 
    parseFloat(b.sizeMB) - parseFloat(a.sizeMB)
);

sorted.slice(0, 10).forEach((t, i) => {
    console.log(`${i + 1}. ${t.title}`);
    console.log(`   Size: ${t.sizeMB} MB`);
    console.log('');
});
```

**Run it:**
```bash
node storage-stats.js
```

---

## ✅ Summary

### Can Docker handle 10GB? **YES!**

✅ Docker has no problem with 10GB  
✅ Your Ubuntu VM just needs enough disk space  
✅ The new file-based architecture handles it efficiently  
✅ Performance remains fast even with 1000+ tutorials  

### What You Need to Do:

1. ✅ Run migration script: `node migrate.js`
2. ✅ Verify new structure: `ls -lh data/tutorials/`
3. ✅ Deploy to Ubuntu: `git pull && docker compose up --build -d`
4. ✅ Monitor disk space: `df -h`

### Recommended VM Specs for 10GB Content:

- **Disk Space**: 50GB+ (20GB for OS + 10GB content + 20GB buffer)
- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum

You're all set to handle 10GB of content! 🚀

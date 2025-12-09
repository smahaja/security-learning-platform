# Security Learning Platform

A professional, interactive learning platform for cloud and AI security built with Next.js, designed for easy deployment with Docker.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [How Content is Stored](#how-content-is-stored)
- [Data Management](#data-management)
- [Docker Deployment](#docker-deployment)
- [Scaling with Docker](#scaling-with-docker)
- [Storage Management](#storage-management)
- [Development](#development)
- [Production Deployment](#production-deployment)

---

## 🏗️ Architecture Overview

### Application Structure

```
security-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page with featured tutorials
│   │   ├── layout.tsx         # Root layout
│   │   ├── TutorialLibrary.tsx # Tutorial listing component
│   │   ├── admin/             # Admin panel for content management
│   │   │   └── page.tsx       # Upload and manage tutorials
│   │   ├── tutorial/[id]/     # Dynamic tutorial pages
│   │   │   ├── page.tsx       # Tutorial viewer
│   │   │   └── raw/           # Raw HTML export endpoint
│   │   └── api/               # API routes
│   │       └── tutorials/     # Tutorial CRUD operations
│   └── lib/
│       └── tutorials.ts       # Tutorial data access layer
├── data/
│   └── tutorials.json         # ⭐ ALL CONTENT STORED HERE
├── public/                    # Static assets
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
└── package.json              # Dependencies
```

### Technology Stack

- **Framework**: Next.js 16 (React 19)
- **Runtime**: Node.js 20
- **Storage**: File-based JSON (tutorials.json)
- **Deployment**: Docker + Docker Compose
- **Styling**: CSS Modules + Global Styles

---

## 📦 How Content is Stored

### Content Storage Location

**ALL HTML content is stored in a single JSON file:**

```
data/tutorials.json
```

### Data Structure

Each tutorial is stored as a JSON object with the following structure:

```json
{
  "id": "unique-tutorial-id",
  "title": "Tutorial Title",
  "description": "Brief description",
  "content": "<html>...entire HTML content as string...</html>",
  "category": "LLM Security",
  "tags": ["Prompt Injection", "AI Security"],
  "createdAt": "2025-12-07T03:42:38.948Z"
}
```

### Key Points About Content Storage

1. **HTML Content**: Complete HTML documents (including `<html>`, `<head>`, `<body>` tags) are stored as **escaped strings** in the `content` field
2. **File Size**: Currently ~670KB for your existing tutorials
3. **No Database**: This is a **file-based** system - no PostgreSQL, MongoDB, or other database required
4. **Automatic Creation**: The `data/` directory and `tutorials.json` file are created automatically if they don't exist

### How Content Flows

```
User uploads HTML → Admin API → tutorials.json → Tutorial Viewer → Renders HTML
```

**Upload Flow:**
1. User uploads `.html` file via Admin Panel (`/admin`)
2. API endpoint (`/api/tutorials`) reads the file
3. Content is saved to `data/tutorials.json`
4. File is immediately available for viewing

**View Flow:**
1. User navigates to `/tutorial/[id]`
2. `getTutorial(id)` reads from `data/tutorials.json`
3. HTML content is rendered in an `<iframe>` for isolation

---

## 🗄️ Data Management

### Current File Size

Your current `tutorials.json` is **~670KB** (compressed) with 3 tutorials containing full HTML documents with embedded CSS and JavaScript.

### Adding New Content

**Via Admin Panel (Recommended):**
1. Navigate to `/admin`
2. Fill in title, description, category
3. Upload `.html` file
4. Click "Upload Tutorial"

**Programmatically:**
```typescript
import { saveTutorial } from '@/lib/tutorials';

saveTutorial({
  id: 'my-tutorial',
  title: 'My Tutorial',
  description: 'Description',
  content: '<html>...</html>',
  category: 'Cloud Security',
  tags: ['AWS', 'Security'],
  createdAt: new Date().toISOString()
});
```

### Deleting Content

```typescript
import { deleteTutorial } from '@/lib/tutorials';

deleteTutorial('tutorial-id');
```

### Updating Content

```typescript
import { updateTutorial } from '@/lib/tutorials';

updateTutorial({
  id: 'existing-id',
  title: 'Updated Title',
  // ... other fields
});
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Build and run
docker compose up --build -d

# Access the app
http://localhost:3000
```

### How Docker Handles Storage

The `docker-compose.yml` includes a **volume mount** to persist data:

```yaml
volumes:
  - ./data:/app/data
```

**What this means:**
- The `data/` folder on your **host machine** is mapped to `/app/data` inside the container
- Any changes made inside the container are **immediately reflected** on your host
- If you delete the container, your data **persists** on the host
- You can edit `tutorials.json` directly on your host, and changes appear in the container

### Container Architecture

```
┌─────────────────────────────────────┐
│  Docker Container                   │
│  ┌───────────────────────────────┐  │
│  │  Next.js App (Port 3000)      │  │
│  │  - Reads/Writes to /app/data │  │
│  └───────────────┬───────────────┘  │
│                  │                   │
│                  ↓                   │
│         /app/data (mounted)         │
└──────────────────┬──────────────────┘
                   │
                   ↓ (Volume Mount)
         ┌─────────────────────┐
         │  Host Machine       │
         │  ./data/            │
         │  └─ tutorials.json  │
         └─────────────────────┘
```

---

## 📈 Scaling with Docker

### Understanding Storage Growth

As you add more tutorials, `tutorials.json` will grow. Here's what to expect:

| Tutorials | Avg Size/Tutorial | Total Size | Performance |
|-----------|-------------------|------------|-------------|
| 10        | ~200KB            | ~2MB       | ✅ Excellent |
| 50        | ~200KB            | ~10MB      | ✅ Excellent |
| 100       | ~200KB            | ~20MB      | ✅ Good      |
| 500       | ~200KB            | ~100MB     | ⚠️ Consider optimization |
| 1000+     | ~200KB            | ~200MB+    | ❌ Migrate to database |

### When Content Size Grows: Solutions

#### Option 1: Increase Docker Container Storage (Recommended for < 500 tutorials)

**No action needed!** Docker containers use the host filesystem. As long as your host has space, the container can grow.

**Check available space:**
```bash
# On host machine
df -h

# Inside container
docker exec security-platform df -h
```

#### Option 2: Split Content Across Multiple Files

Modify `src/lib/tutorials.ts` to use multiple JSON files:

```typescript
// Instead of one tutorials.json, use:
// data/tutorials/2024-12.json
// data/tutorials/2025-01.json
// etc.

export function getTutorials(): Tutorial[] {
  const tutorialsDir = path.join(process.cwd(), 'data', 'tutorials');
  const files = fs.readdirSync(tutorialsDir);
  
  const allTutorials = files
    .filter(f => f.endsWith('.json'))
    .flatMap(file => {
      const content = fs.readFileSync(path.join(tutorialsDir, file), 'utf8');
      return JSON.parse(content);
    });
  
  return allTutorials;
}
```

#### Option 3: Migrate to Database (For 500+ tutorials)

When you reach scale, migrate to a database:

**Update `docker-compose.yml`:**
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/tutorials
    depends_on:
      - db
  
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=tutorials
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Update `src/lib/tutorials.ts`:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function getTutorials(): Promise<Tutorial[]> {
  const result = await pool.query('SELECT * FROM tutorials ORDER BY created_at DESC');
  return result.rows;
}
```

#### Option 4: Use Object Storage (For very large files)

Store HTML content in S3/MinIO and keep metadata in JSON:

```json
{
  "id": "tutorial-id",
  "title": "Tutorial Title",
  "description": "Description",
  "contentUrl": "s3://bucket/tutorials/tutorial-id.html",
  "category": "Security",
  "tags": ["AI"],
  "createdAt": "2025-12-07T03:42:38.948Z"
}
```

---

## 💾 Storage Management

### Monitoring Storage Usage

**Check JSON file size:**
```bash
# On host
ls -lh data/tutorials.json

# Inside container
docker exec security-platform ls -lh /app/data/tutorials.json
```

**Check total container size:**
```bash
docker system df
docker ps -s
```

### Backup Strategy

**Automated backup script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup tutorials.json
cp ./data/tutorials.json $BACKUP_DIR/tutorials_$DATE.json

# Keep only last 30 backups
ls -t $BACKUP_DIR/tutorials_*.json | tail -n +31 | xargs -r rm

echo "Backup created: tutorials_$DATE.json"
```

**Run daily with cron:**
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Stop container
docker compose down

# Restore backup
cp backups/tutorials_20251207_020000.json data/tutorials.json

# Restart
docker compose up -d
```

---

## 🔧 Development

### Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🚀 Production Deployment

### Deploy to Ubuntu Server

See [`DEPLOY_INSTRUCTIONS.md`](./DEPLOY_INSTRUCTIONS.md) for detailed Ubuntu deployment steps.

**Quick summary:**
```bash
# On Ubuntu VM
git clone https://github.com/smahaja/security-learning-platform.git
cd security-learning-platform
sudo docker compose up --build -d
```

### Environment Variables

Create `.env.local` for production:

```env
NODE_ENV=production
PORT=3000
# Add any API keys or secrets here
```

### Security Considerations

1. **Data Directory Permissions:**
   ```bash
   # Ensure proper permissions
   chmod 755 data/
   chmod 644 data/tutorials.json
   ```

2. **Admin Panel Protection:**
   - Consider adding authentication to `/admin`
   - Use environment variables for admin credentials

3. **Content Validation:**
   - The app renders user-uploaded HTML in iframes
   - Consider implementing CSP (Content Security Policy)
   - Sanitize HTML if needed

---

## 📊 Performance Optimization

### Current Performance

- **File Read**: ~1-5ms for `tutorials.json` (670KB)
- **Memory Usage**: ~100MB for Next.js app
- **Startup Time**: ~2-3 seconds

### Optimization Tips

1. **Enable Caching:**
   ```typescript
   // Cache tutorials in memory
   let cachedTutorials: Tutorial[] | null = null;
   let cacheTime: number = 0;
   const CACHE_TTL = 60000; // 1 minute

   export function getTutorials(): Tutorial[] {
     const now = Date.now();
     if (cachedTutorials && (now - cacheTime) < CACHE_TTL) {
       return cachedTutorials;
     }
     
     cachedTutorials = loadTutorialsFromFile();
     cacheTime = now;
     return cachedTutorials;
   }
   ```

2. **Compress Large Content:**
   ```bash
   # Use gzip for large JSON files
   gzip -k data/tutorials.json
   ```

3. **Lazy Load Tutorials:**
   - Load only metadata initially
   - Fetch full HTML content on-demand

---

## 🆘 Troubleshooting

### Issue: Container can't write to `data/` folder

**Solution:**
```bash
# Fix permissions on host
chmod 777 data/

# Or run container with specific user
docker compose run --user $(id -u):$(id -g) web
```

### Issue: `tutorials.json` is too large

**Solution:**
- Implement pagination in `TutorialLibrary.tsx`
- Split into multiple files (see "Scaling" section)
- Migrate to database

### Issue: Out of disk space

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Check disk usage
df -h

# Remove old images
docker image prune -a
```

---

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. For questions or suggestions, contact the repository owner.

---

## 📞 Support

For deployment issues or questions:
- Check `DEPLOY_INSTRUCTIONS.md`
- Review Docker logs: `docker compose logs -f`
- GitHub Issues: https://github.com/smahaja/security-learning-platform/issues

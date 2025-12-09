const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, 'data');
const oldPath = path.join(dataDirectory, 'tutorials.json');
const metadataPath = path.join(dataDirectory, 'metadata.json');
const tutorialsDirectory = path.join(dataDirectory, 'tutorials');

function ensureDirectories() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }
    if (!fs.existsSync(tutorialsDirectory)) {
        fs.mkdirSync(tutorialsDirectory, { recursive: true });
    }
}

function migrateFromOldFormat() {
    if (!fs.existsSync(oldPath)) {
        console.log('❌ No tutorials.json found at:', oldPath);
        console.log('   Nothing to migrate.');
        return;
    }

    console.log('📂 Found tutorials.json');
    console.log('🔄 Starting migration...\n');

    const oldContent = fs.readFileSync(oldPath, 'utf8');
    const oldTutorials = JSON.parse(oldContent);

    console.log(`   Found ${oldTutorials.length} tutorials to migrate\n`);

    ensureDirectories();

    const metadata = [];

    for (const tutorial of oldTutorials) {
        // Save HTML to separate file
        const filePath = path.join(tutorialsDirectory, `${tutorial.id}.html`);
        fs.writeFileSync(filePath, tutorial.content, 'utf8');

        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log(`   ✅ ${tutorial.title}`);
        console.log(`      → ${tutorial.id}.html (${sizeMB} MB)`);

        metadata.push({
            id: tutorial.id,
            title: tutorial.title,
            description: tutorial.description,
            category: tutorial.category,
            tags: tutorial.tags,
            createdAt: tutorial.createdAt,
            fileSize: stats.size
        });
    }

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`\n   ✅ Created metadata.json`);

    // Backup old file
    const backupPath = path.join(dataDirectory, 'tutorials.json.backup');
    fs.renameSync(oldPath, backupPath);
    console.log(`   ✅ Backed up old file to tutorials.json.backup`);

    return metadata;
}

function getStorageStats(metadata) {
    const totalSize = metadata.reduce((sum, meta) => sum + meta.fileSize, 0);

    return {
        totalTutorials: metadata.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(2),
        tutorials: metadata.map(m => ({
            id: m.id,
            title: m.title,
            sizeMB: (m.fileSize / 1024 / 1024).toFixed(2)
        }))
    };
}

// Run migration
console.log('🔄 Migration Script for 10GB Scalability\n');
console.log('='.repeat(60));

try {
    const metadata = migrateFromOldFormat();

    if (!metadata) {
        process.exit(0);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration Successful!\n');

    const stats = getStorageStats(metadata);
    console.log('📊 Storage Statistics:');
    console.log(`   Total Tutorials: ${stats.totalTutorials}`);
    console.log(`   Total Size: ${stats.totalSizeMB} MB (${stats.totalSizeGB} GB)`);

    console.log('\n📁 Individual Tutorial Sizes:');
    stats.tutorials.forEach(t => {
        console.log(`   - ${t.title}: ${t.sizeMB} MB`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📂 New File Structure:');
    console.log('   data/');
    console.log('   ├── metadata.json          (tutorial info)');
    console.log('   ├── tutorials/             (HTML files)');
    console.log(`   │   ├── ${stats.tutorials[0].id}.html`);
    if (stats.tutorials.length > 1) {
        console.log(`   │   ├── ${stats.tutorials[1].id}.html`);
    }
    if (stats.tutorials.length > 2) {
        console.log(`   │   └── ... (${stats.tutorials.length - 2} more)`);
    }
    console.log('   └── tutorials.json.backup  (old format)');

    console.log('\n✅ You can now deploy to Docker!');
    console.log('   Next steps:');
    console.log('   1. git add data/');
    console.log('   2. git commit -m "Migrate to file-based storage"');
    console.log('   3. git push origin master');
    console.log('   4. Deploy to Ubuntu VM');

} catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
}

// Migration script - Run this once to convert your existing data
import { migrateFromOldFormat, getStorageStats } from './src/lib/tutorials';

console.log('🔄 Starting migration to new storage format...\n');

try {
    migrateFromOldFormat();

    console.log('\n✅ Migration successful!\n');

    const stats = getStorageStats();
    console.log('📊 Storage Statistics:');
    console.log(`   Total Tutorials: ${stats.totalTutorials}`);
    console.log(`   Total Size: ${stats.totalSizeMB} MB (${stats.totalSizeGB} GB)`);
    console.log('\n📁 Individual Tutorial Sizes:');
    stats.tutorials.forEach(t => {
        console.log(`   - ${t.title}: ${t.sizeMB} MB`);
    });

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}

import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'data');
const metadataPath = path.join(dataDirectory, 'metadata.json');
const tutorialsDirectory = path.join(dataDirectory, 'tutorials');

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: string;
}

export interface TutorialMetadata {
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    createdAt: string;
    fileSize: number; // in bytes
}

function ensureDirectories() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }
    if (!fs.existsSync(tutorialsDirectory)) {
        fs.mkdirSync(tutorialsDirectory, { recursive: true });
    }
}

function getMetadata(): TutorialMetadata[] {
    ensureDirectories();
    if (!fs.existsSync(metadataPath)) {
        return [];
    }
    const fileContent = fs.readFileSync(metadataPath, 'utf8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

function saveMetadata(metadata: TutorialMetadata[]): void {
    ensureDirectories();
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

function getTutorialFilePath(id: string): string {
    return path.join(tutorialsDirectory, `${id}.html`);
}

export function getTutorials(): Tutorial[] {
    const metadata = getMetadata();

    // Only return metadata (without content) for listing
    return metadata.map(meta => ({
        ...meta,
        content: '' // Don't load content for listing
    }));
}

export function getTutorial(id: string): Tutorial | undefined {
    const metadata = getMetadata();
    const meta = metadata.find((t) => t.id === id);

    if (!meta) {
        return undefined;
    }

    const filePath = getTutorialFilePath(id);

    if (!fs.existsSync(filePath)) {
        return undefined;
    }

    // Load content only when needed
    const content = fs.readFileSync(filePath, 'utf8');

    return {
        ...meta,
        content
    };
}

export function saveTutorial(tutorial: Tutorial): void {
    try {
        ensureDirectories();

        const metadata = getMetadata();

        // Save HTML content to separate file
        const filePath = getTutorialFilePath(tutorial.id);

        console.log(`[saveTutorial] Attempting to save tutorial to: ${filePath}`);

        try {
            fs.writeFileSync(filePath, tutorial.content, 'utf8');
            console.log(`[saveTutorial] Successfully wrote HTML file: ${filePath}`);
        } catch (writeError: any) {
            console.error(`[saveTutorial] Failed to write HTML file: ${filePath}`, writeError);
            throw new Error(`Failed to write tutorial file: ${writeError.message}. Check Docker volume permissions.`);
        }

        // Get file size
        const stats = fs.statSync(filePath);

        // Save metadata
        const meta: TutorialMetadata = {
            id: tutorial.id,
            title: tutorial.title,
            description: tutorial.description,
            category: tutorial.category,
            tags: tutorial.tags,
            createdAt: tutorial.createdAt,
            fileSize: stats.size
        };

        metadata.push(meta);

        try {
            saveMetadata(metadata);
            console.log(`[saveTutorial] Successfully saved metadata for: ${tutorial.id}`);
        } catch (metaError: any) {
            console.error(`[saveTutorial] Failed to save metadata`, metaError);
            // Try to clean up the HTML file if metadata save fails
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error(`[saveTutorial] Failed to cleanup HTML file after metadata error`, cleanupError);
            }
            throw new Error(`Failed to save tutorial metadata: ${metaError.message}. Check Docker volume permissions.`);
        }
    } catch (error: any) {
        console.error(`[saveTutorial] Error saving tutorial:`, error);
        throw error;
    }
}

export function deleteTutorial(id: string): void {
    let metadata = getMetadata();
    metadata = metadata.filter(t => t.id !== id);
    saveMetadata(metadata);

    // Delete HTML file
    const filePath = getTutorialFilePath(id);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

export function updateTutorial(updatedTutorial: Tutorial): void {
    try {
        let metadata = getMetadata();
        const index = metadata.findIndex(t => t.id === updatedTutorial.id);

        if (index !== -1) {
            // Update HTML file
            const filePath = getTutorialFilePath(updatedTutorial.id);

            console.log(`[updateTutorial] Attempting to update tutorial: ${filePath}`);

            try {
                fs.writeFileSync(filePath, updatedTutorial.content, 'utf8');
                console.log(`[updateTutorial] Successfully updated HTML file: ${filePath}`);
            } catch (writeError: any) {
                console.error(`[updateTutorial] Failed to write HTML file: ${filePath}`, writeError);
                throw new Error(`Failed to update tutorial file: ${writeError.message}. Check Docker volume permissions.`);
            }

            // Get new file size
            const stats = fs.statSync(filePath);

            // Update metadata
            metadata[index] = {
                id: updatedTutorial.id,
                title: updatedTutorial.title,
                description: updatedTutorial.description,
                category: updatedTutorial.category,
                tags: updatedTutorial.tags,
                createdAt: updatedTutorial.createdAt,
                fileSize: stats.size
            };

            try {
                saveMetadata(metadata);
                console.log(`[updateTutorial] Successfully updated metadata for: ${updatedTutorial.id}`);
            } catch (metaError: any) {
                console.error(`[updateTutorial] Failed to save metadata`, metaError);
                throw new Error(`Failed to update tutorial metadata: ${metaError.message}. Check Docker volume permissions.`);
            }
        } else {
            throw new Error(`Tutorial with id ${updatedTutorial.id} not found`);
        }
    } catch (error: any) {
        console.error(`[updateTutorial] Error updating tutorial:`, error);
        throw error;
    }
}

// Migration function to convert old tutorials.json to new structure
export function migrateFromOldFormat(): void {
    const oldPath = path.join(dataDirectory, 'tutorials.json');

    if (!fs.existsSync(oldPath)) {
        console.log('No old tutorials.json found, skipping migration');
        return;
    }

    console.log('Starting migration from old format...');

    const oldContent = fs.readFileSync(oldPath, 'utf8');
    const oldTutorials: Tutorial[] = JSON.parse(oldContent);

    ensureDirectories();

    const metadata: TutorialMetadata[] = [];

    for (const tutorial of oldTutorials) {
        // Save HTML to separate file
        const filePath = getTutorialFilePath(tutorial.id);
        fs.writeFileSync(filePath, tutorial.content, 'utf8');

        const stats = fs.statSync(filePath);

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

    saveMetadata(metadata);

    // Backup old file
    const backupPath = path.join(dataDirectory, 'tutorials.json.backup');
    fs.renameSync(oldPath, backupPath);

    console.log(`Migration complete! Migrated ${oldTutorials.length} tutorials`);
    console.log(`Old file backed up to: ${backupPath}`);
}

// Get total storage used
export function getStorageStats() {
    const metadata = getMetadata();
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

import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'data');
const storePath = path.join(dataDirectory, 'tutorials.json');

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    createdAt: string;
}

function ensureDataDirectory() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }
}

export function getTutorials(): Tutorial[] {
    ensureDataDirectory();
    if (!fs.existsSync(storePath)) {
        return [];
    }
    const fileContent = fs.readFileSync(storePath, 'utf8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export function getTutorial(id: string): Tutorial | undefined {
    const tutorials = getTutorials();
    return tutorials.find((t) => t.id === id);
}

export function saveTutorial(tutorial: Tutorial): void {
    const tutorials = getTutorials();
    tutorials.push(tutorial);
    fs.writeFileSync(storePath, JSON.stringify(tutorials, null, 2));
}

export function deleteTutorial(id: string): void {
    let tutorials = getTutorials();
    tutorials = tutorials.filter(t => t.id !== id);
    fs.writeFileSync(storePath, JSON.stringify(tutorials, null, 2));
}

export function updateTutorial(updatedTutorial: Tutorial): void {
    let tutorials = getTutorials();
    const index = tutorials.findIndex(t => t.id === updatedTutorial.id);
    if (index !== -1) {
        tutorials[index] = updatedTutorial;
        fs.writeFileSync(storePath, JSON.stringify(tutorials, null, 2));
    }
}

import { NextResponse } from 'next/server';
import { saveTutorial, Tutorial } from '@/lib/tutorials';

export async function POST(request: Request) {
    try {
        const { title, description, content, category, tags } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and Content are required' }, { status: 400 });
        }

        const newTutorial: Tutorial = {
            id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            title,
            description: description || '',
            content,
            category: category || 'General',
            tags: tags || [],
            createdAt: new Date().toISOString(),
        };

        saveTutorial(newTutorial);

        return NextResponse.json({ success: true, tutorial: newTutorial });
    } catch (error) {
        console.error('Error creating tutorial:', error);
        return NextResponse.json({ error: 'Failed to create tutorial' }, { status: 500 });
    }
}

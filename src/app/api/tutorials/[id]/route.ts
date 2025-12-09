import { NextResponse } from 'next/server';
import { deleteTutorial, updateTutorial, getTutorial } from '@/lib/tutorials';

// In Next.js App Router, the second argument contains the params
// However, the params structure is async in strict types sometimes, or we define it properly
// simpler to just use params directly as { params: { id: string } }

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Basic validation
        if (!body.title || !body.content) {
            return NextResponse.json(
                { error: 'Title and Content are required' },
                { status: 400 }
            );
        }

        // Fetch existing tutorial to preserve fields like createdAt
        const existingTutorial = getTutorial(id);

        if (!existingTutorial) {
            return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });
        }

        const tutorial = {
            ...existingTutorial,
            ...body,
            id, // Ensure ID doesn't change
        };

        updateTutorial(tutorial);
        return NextResponse.json({ success: true, tutorial });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update tutorial' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Updated for recent Next.js versions where params is a Promise
) {
    try {
        const { id } = await params;
        deleteTutorial(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete tutorial' }, { status: 500 });
    }
}

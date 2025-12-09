import { getTutorial } from '@/lib/tutorials';
import { notFound } from 'next/navigation';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const tutorial = getTutorial(id);

    if (!tutorial) {
        notFound();
    }

    // Sanitize content helper (same as in page.tsx)
    let cleanContent = tutorial.content.trim();
    cleanContent = cleanContent.replace(/^```(html)?\s*/i, '');
    cleanContent = cleanContent.replace(/\s*```$/, '');

    // Inject <base target="_blank"> to ensure links open in new tab (avoiding iframe blocks)
    if (cleanContent.includes('<head>')) {
        cleanContent = cleanContent.replace('<head>', '<head><base target="_blank">');
    } else {
        cleanContent = '<head><base target="_blank"></head>' + cleanContent;
    }

    return new Response(cleanContent, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}

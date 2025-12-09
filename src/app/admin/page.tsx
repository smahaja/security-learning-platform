import { getTutorials } from '@/lib/tutorials';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
    const tutorials = getTutorials();
    return <AdminDashboard initialTutorials={tutorials} />;
}

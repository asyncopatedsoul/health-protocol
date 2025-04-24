import { json } from '@sveltejs/kit';
import { getActivitiesWithRelationships } from '$lib/server/db/sqlite-client';

export async function GET() {
  try {
    const data = await getActivitiesWithRelationships();
    return json(data);
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}
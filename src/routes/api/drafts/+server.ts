import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TailoredResume } from '$lib/server/models/TailoredResume';

export const GET: RequestHandler = async () => {
	try {
		// Fetch all drafts, sorted by newest first.
		// Only select fields needed for the dropdown list to save bandwidth.
		const drafts = await TailoredResume.find({})
			.select('_id companyName createdAt')
			.sort({ createdAt: -1 })
			.lean();

		return json({ drafts });
	} catch (error: any) {
		console.error('Fetch drafts error:', error);
		return json({ error: error.message || 'Failed to fetch drafts' }, { status: 500 });
	}
};

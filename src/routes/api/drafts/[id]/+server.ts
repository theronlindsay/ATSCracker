import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TailoredResume } from '$lib/server/models/TailoredResume';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const draft = await TailoredResume.findById(id).lean();

		if (!draft) {
			return json({ error: 'Draft not found' }, { status: 404 });
		}

		return json({ draft });
	} catch (error: any) {
		console.error('Fetch draft error:', error);
		return json({ error: error.message || 'Failed to fetch draft' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const updateData = await request.json();

		const draft = await TailoredResume.findByIdAndUpdate(
			id,
			{ $set: updateData },
			{ new: true, runValidators: true }
		).lean();

		if (!draft) {
			return json({ error: 'Draft not found' }, { status: 404 });
		}

		return json({ draft });
	} catch (error: any) {
		console.error('Update draft error:', error);
		return json({ error: error.message || 'Failed to update draft' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;
		const result = await TailoredResume.findByIdAndDelete(id);

		if (!result) {
			return json({ error: 'Draft not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error: any) {
		console.error('Delete draft error:', error);
		return json({ error: error.message || 'Failed to delete draft' }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MasterData } from '$lib/server/models/MasterData';

export const GET: RequestHandler = async () => {
	try {
		const masterDocs = await MasterData.find({});
		const formatted = masterDocs.reduce((acc, doc) => {
			acc[doc.section] = doc.data;
			return acc;
		}, {} as Record<string, any>);
		
		return json({ data: formatted });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { section, data } = await request.json();
		
		if (!section) {
			return json({ error: 'Section is required' }, { status: 400 });
		}

		await MasterData.findOneAndUpdate(
			{ section },
			{ data },
			{ upsert: true, new: true }
		);

		return json({ success: true });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

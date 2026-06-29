import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Settings } from '$lib/server/models/Settings';

export const GET: RequestHandler = async () => {
	try {
		let settings = await Settings.findOne({ singleton: 'default' });
		
		if (!settings) {
			// Create default if it doesn't exist
			settings = await Settings.create({ singleton: 'default' });
		}
		
		return json({ data: settings });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const updateData = await request.json();

		const settings = await Settings.findOneAndUpdate(
			{ singleton: 'default' },
			{ $set: updateData },
			{ upsert: true, new: true }
		);

		return json({ success: true, data: settings });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

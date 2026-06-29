import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/private';

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const rawPassword = data.get('password');
		
		// Sanitize input: convert to string, trim, and limit length to prevent DoS attacks
		const password = typeof rawPassword === 'string' ? rawPassword.trim().slice(0, 100) : '';

		if (!password) {
			return fail(400, { missing: true });
		}

		if (password !== env.APP_PASSWORD) {
			return fail(401, { incorrect: true });
		}

		// Set auth cookie (lasts for 30 days)
		cookies.set('auth_session', 'authenticated', {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/');
	}
} satisfies Actions;

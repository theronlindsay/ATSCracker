import { connectDB } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Ensure DB is connected on every request
	await connectDB();

	const path = event.url.pathname;
	const isLoginPath = path === '/login';
	
	// Check auth cookie
	const authCookie = event.cookies.get('auth_session');
	const isAuthenticated = authCookie === 'authenticated'; // We'll set this simple string on successful login

	if (!isAuthenticated && !isLoginPath) {
		throw redirect(303, '/login');
	}

	if (isAuthenticated && isLoginPath) {
		throw redirect(303, '/');
	}

	const response = await resolve(event);
	return response;
};

import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';

let isConnected = false;

export async function connectDB() {
	if (isConnected) return;

	try {
		const uri = env.MONGODB_URI;
		if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

		await mongoose.connect(uri);
		isConnected = true;
		console.log('MongoDB connected successfully.');
	} catch (error) {
		console.error('MongoDB connection error:', error);
	}
}

import { createOpencode } from '@opencode-ai/sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function test() {
	const { server, client } = await createOpencode();
	console.log('Server URL:', server.url);

	const opencodeOpenAI = createOpenAI({
		baseURL: server.url,
		apiKey: 'dummy' // Doesn't matter
	});

	try {
		const { text } = await generateText({
			model: opencodeOpenAI('default'),
			prompt: 'say hello'
		});
		console.log('Response:', text);
	} catch (e) {
		console.error('Error:', e.message);
	}
	server.close();
}

test();

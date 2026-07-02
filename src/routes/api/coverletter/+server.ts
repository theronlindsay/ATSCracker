import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { opencode } from 'ai-sdk-provider-opencode-sdk';
import { env } from '$env/dynamic/private';
// We don't save cover letters to DB yet, but we could if we wanted to.

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { jobDescription, masterData, provider, modelName, customPrompt } = await request.json();

		if (!jobDescription || !masterData) {
			return json({ error: 'Job description and master data are required' }, { status: 400 });
		}

		// Initialize AI Provider
		const providerName = provider || env.DEFAULT_AI_PROVIDER || 'openai';
		let aiModel;

		if (providerName === 'openai') {
			const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
			aiModel = openai(modelName || 'gpt-4o');
		} else if (providerName === 'gemini') {
			const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
			aiModel = google(modelName || 'gemini-1.5-pro-latest');
		} else if (providerName === 'openrouter') {
			const openrouter = createOpenAI({
				apiKey: env.OPENROUTER_API_KEY,
				baseURL: 'https://openrouter.ai/api/v1'
			});
			aiModel = openrouter(modelName || 'anthropic/claude-3-opus');
		} else if (providerName === 'opencode') {
			aiModel = opencode(modelName || 'default-model');
		} else {
			const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
			aiModel = openai(modelName || 'gpt-4o');
		}

		const defaultPrompt = `
You are an expert career coach and professional writer. Your task is to write a highly tailored cover letter based on my master resume data and the target job description. Output ONLY valid, clean HTML using basic semantic tags (like <p>, <br>, <strong>). Do NOT wrap the output in any markdown code blocks or <html>/<head>/<body> tags, just output the raw inner HTML content. Structure it like a standard professional cover letter.

Target Job Description:
{{jobDescription}}

Master Resume Data:
{{masterData}}
`;

		let promptTemplate = customPrompt || defaultPrompt;
		const finalPrompt = promptTemplate
			.replace('{{jobDescription}}', jobDescription)
			.replace('{{masterData}}', JSON.stringify(masterData, null, 2));

		const { text } = await generateText({
			model: aiModel,
			prompt: finalPrompt,
			system:
				'You are a professional writer. You must ONLY output clean HTML representing a cover letter. Do not include markdown code blocks (like ```html), do not include <html> or <body> tags. Just standard structural tags like <p>, <br>, <strong>.'
		});

		let html = text.trim();
		// Strip markdown if the model hallucinated it
		if (html.startsWith('```html')) {
			html = html.replace(/^```html\\s*/, '');
		}
		if (html.startsWith('```')) {
			html = html.replace(/^```\\s*/, '');
		}
		if (html.endsWith('```')) {
			html = html.replace(/\\s*```$/, '');
		}

		return json({ html });
	} catch (error: any) {
		console.error('Cover letter error:', error);
		return json({ error: error.message || 'Failed to generate cover letter' }, { status: 500 });
	}
};

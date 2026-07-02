import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { opencode } from 'ai-sdk-provider-opencode-sdk';
import { env } from '$env/dynamic/private';
import { MasterData } from '$lib/server/models/MasterData';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { resumeText, provider, modelName, customPrompt } = await request.json();

		if (!resumeText) {
			return json({ error: 'Resume text is required' }, { status: 400 });
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
You are an expert data extractor. Your task is to take the following raw resume text and convert it into a structured JSON object that perfectly matches the standard JSON Resume Schema (https://jsonresume.org/schema/).

Raw Resume Text:
{{resumeText}}

Output ONLY valid JSON. Do not include markdown blocks like \`\`\`json, just the raw JSON object. Ensure all applicable fields (basics, work, education, skills, projects, etc.) are extracted as accurately as possible. For work experience entries, explicitly include a 'url' field for any relevant company or project links.
`;

		let promptTemplate = customPrompt || defaultPrompt;
		const finalPrompt = promptTemplate.replace('{{resumeText}}', resumeText);

		const { text } = await generateText({
			model: aiModel,
			prompt: finalPrompt,
			system:
				'You are a specialized JSON generator. You must ONLY output valid JSON. Do not include any explanations, greetings, or markdown formatting. Your output will be parsed directly by JSON.parse().'
		});

		let parsedResume;
		try {
			const cleanedText = text
				.replace(/```json/g, '')
				.replace(/```/g, '')
				.trim();
			parsedResume = JSON.parse(cleanedText);
		} catch (parseError) {
			console.error('AI returned invalid JSON:', text);
			return json({ error: 'AI failed to generate valid JSON' }, { status: 500 });
		}

		// Save each top-level key to MasterData (merging intelligently)
		for (const [section, data] of Object.entries(parsedResume)) {
			const existing = await MasterData.findOne({ section });
			let mergedData = data;

			if (existing && existing.data) {
				if (Array.isArray(existing.data) && Array.isArray(data)) {
					// Merge arrays: append new items to the existing array
					mergedData = [...existing.data, ...data];
				} else if (
					typeof existing.data === 'object' &&
					typeof data === 'object' &&
					!Array.isArray(data)
				) {
					// Shallow merge objects
					mergedData = { ...existing.data, ...data };
				}
			}

			await MasterData.findOneAndUpdate(
				{ section },
				{ data: mergedData },
				{ upsert: true, new: true }
			);
		}

		return json({ success: true, data: parsedResume });
	} catch (error: any) {
		console.error('Generate Master error:', error);
		return json({ error: error.message || 'Failed to generate master data' }, { status: 500 });
	}
};

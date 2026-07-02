import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { opencode } from 'ai-sdk-provider-opencode-sdk';
import { env } from '$env/dynamic/private';
import { TailoredResume } from '$lib/server/models/TailoredResume';

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
			aiModel = openrouter(modelName || 'anthropic/claude-3-opus'); // Defaulting to a strong model
		} else if (providerName === 'opencode') {
			aiModel = opencode(modelName || 'default-model');
		} else {
			// Fallback to OpenAI
			const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
			aiModel = openai(modelName || 'gpt-4o');
		}

		const defaultPrompt = `
You are an expert resume tailor. Your task is to take my master resume data and rewrite/reorganize it to perfectly match the target job description. 
Only output valid JSON matching the standard JSON Resume Schema (https://jsonresume.org/schema/). 
Do not include markdown blocks, just raw JSON. Ensure that you preserve or include a 'url' field for work experience entries if applicable links exist.

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
			system: "You are a specialized JSON generator. You must ONLY output valid JSON. Do not include any explanations, greetings, or markdown formatting like ```json. Your output will be parsed directly by JSON.parse()."
		});

		// Parse the output to ensure it's valid JSON
		let tailoredJson;
		try {
			// Clean up potential markdown formatting if the model disobeys
			const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
			tailoredJson = JSON.parse(cleanedText);
		} catch (parseError) {
			console.error("AI returned invalid JSON:", text);
			return json({ error: 'AI failed to generate valid JSON' }, { status: 500 });
		}

		// Save to Database
		const newTailored = await TailoredResume.create({
			jobDescription,
			companyName: `Draft - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
			data: tailoredJson,
			theme: 'macchiato'
		});

		return json({ id: newTailored._id, resume: tailoredJson });
	} catch (error: any) {
		console.error('Tailor error:', error);
		return json({ error: error.message || 'Failed to tailor resume' }, { status: 500 });
	}
};

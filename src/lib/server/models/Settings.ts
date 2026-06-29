import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
	{
		// We'll use a singleton approach, so we can just query the first document
		singleton: {
			type: String,
			default: 'default',
			unique: true
		},
		aiProvider: {
			type: String,
			default: 'openai'
		},
		aiModelName: {
			type: String,
			default: ''
		},
		tailorPrompt: {
			type: String,
			default: `You are an expert resume tailor. Your task is to take my master resume data and rewrite/reorganize it to perfectly match the target job description. Only output valid JSON matching the standard JSON Resume Schema (https://jsonresume.org/schema/). Do not include markdown blocks, just raw JSON.

Target Job Description:
{{jobDescription}}

Master Resume Data:
{{masterData}}`
		},
		coverLetterPrompt: {
			type: String,
			default: `You are an expert career coach and professional writer. Your task is to write a highly tailored cover letter based on my master resume data and the target job description. Output ONLY valid, clean HTML using basic semantic tags (like <p>, <br>, <strong>). Do NOT wrap the output in any markdown code blocks or <html>/<head>/<body> tags, just output the raw inner HTML content. Structure it like a standard professional cover letter.

Target Job Description:
{{jobDescription}}

Master Resume Data:
{{masterData}}`
		},
		generateMasterPrompt: {
			type: String,
			default: `You are an expert data extractor. Your task is to take the following raw resume text and convert it into a structured JSON object that perfectly matches the standard JSON Resume Schema (https://jsonresume.org/schema/).

Raw Resume Text:
{{resumeText}}

Output ONLY valid JSON. Do not include markdown blocks like \`\`\`json, just the raw JSON object. Ensure all applicable fields (basics, work, education, skills, projects, etc.) are extracted as accurately as possible.`
		}
	},
	{ timestamps: true }
);

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

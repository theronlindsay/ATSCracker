import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { resume, theme = 'macchiato' } = await request.json();

		if (!resume) {
			return json({ error: 'Resume JSON is required' }, { status: 400 });
		}

		// Dynamically import the requested theme
		// Note: We use dynamic imports to prevent loading all themes into memory
		// Vite will automatically bundle these if they are static string literals.
		let themeModule;
		switch (theme) {
			case 'macchiato':
				themeModule = await import('jsonresume-theme-macchiato');
				break;
			case 'elegant':
				themeModule = await import('jsonresume-theme-elegant');
				break;
			case 'flat':
				themeModule = await import('jsonresume-theme-flat');
				break;
			default:
				themeModule = await import('jsonresume-theme-macchiato');
		}

		// Many themes use moment.js which breaks on custom strings like "Present" or "Expected 2025".
		// We replace them with a valid dummy date (1000-01-01 + id) so the theme renders it without error, 
		// and then replace the rendered dummy date with the original string in the output HTML.
		let invalidId = 0;
		const invalidMap = new Map<number, string>();
		const encodeInvalidDates = (obj: any) => {
			if (!obj) return;
			for (const key in obj) {
				if (typeof obj[key] === 'object' && obj[key] !== null) {
					encodeInvalidDates(obj[key]);
				} else if (['startDate', 'endDate', 'date'].includes(key) && typeof obj[key] === 'string') {
					if (isNaN(Date.parse(obj[key])) && !/^\\d{4}(-\\d{2})?(-\\d{2})?$/.test(obj[key])) {
						const id = invalidId++;
						invalidMap.set(id, obj[key]);
						// Encode as year 1000 + id
						const year = 1000 + id;
						obj[key] = `${year}-01-01`;
					}
				}
			}
		};
		
		// Deep clone to avoid mutating the original object
		const renderResume = JSON.parse(JSON.stringify(resume));
		encodeInvalidDates(renderResume);

		// Compatibility for older themes (like macchiato) that expect 'website' instead of 'url'
		if (renderResume.basics && renderResume.basics.url && !renderResume.basics.website) {
			renderResume.basics.website = renderResume.basics.url;
		}
		if (Array.isArray(renderResume.work)) {
			renderResume.work.forEach((w: any) => {
				if (w.url && !w.website) w.website = w.url;
			});
		}
		if (Array.isArray(renderResume.projects)) {
			renderResume.projects.forEach((p: any) => {
				if (p.url && !p.website) p.website = p.url;
			});
		}

		// Render the resume
		let html = themeModule.render(renderResume);

		// HOTFIX: The macchiato theme's work.hbs template completely omits the website variable.
		// We manually inject the anchor tags into the rendered HTML.
		if (theme === 'macchiato' && Array.isArray(renderResume.work)) {
			renderResume.work.forEach((job: any) => {
				if (job.website && job.company) {
					// Escape company name for regex
					const escapedCompany = job.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					// The macchiato theme renders names as: <h3 class="bold pull-left">\n  Company Name\n</h3>
					const regex = new RegExp(`(<h3 class="bold pull-left">\\s*)${escapedCompany}(\\s*</h3>)`, 'g');
					html = html.replace(regex, `$1<a href="${job.website}" target="_blank" style="color: inherit; text-decoration: underline;">${job.company}</a>$2`);
				}
			});
		}

		// Decode custom strings back into the HTML
		for (const [id, word] of invalidMap.entries()) {
			const year = 1000 + id;
			// Matches formatted dates like "Jan 1000", "01/1000", "1000", "January, 1000"
			const regex = new RegExp(`\\b(?:(?:Jan(?:uary)?|0?1)[\\s\\-\\/,]+)*${year}(?:[\\s\\-\\/,]+(?:Jan(?:uary)?|0?1))*\\b`, 'gi');
			html = html.replace(regex, word);
		}

		return json({ html });
	} catch (error: any) {
		console.error('Render error:', error);
		return json({ error: error.message || 'Failed to render theme' }, { status: 500 });
	}
};

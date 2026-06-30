<script lang="ts">
	import { onMount } from 'svelte';
	import { Save, FileJson, Loader2, FileText, Download } from '@lucide/svelte';

	// State
	let masterData = $state<Record<string, any>>({});
	let activeSection = $state('basics');
	let editorContent = $state('');
	
	let rawResumeText = $state('');
	let isGeneratingMaster = $state(false);

	let aiProvider = $state('openai');
	let aiModelName = $state('');
	let tailorPrompt = $state('');
	let masterPrompt = $state('');
	let coverLetterPrompt = $state('');
	
	let generationMode = $state<'resume' | 'coverletter'>('resume');
	
	let editorMode = $state<'master' | 'draft'>('master');
	let draftsList = $state<any[]>([]);
	let selectedDraftId = $state('');

	// Accordion state
	let openPanels = $state<Record<string, boolean>>({
		config: true,
		prompts: false,
		import: false,
		job: true,
		vault: true
	});

	let leftColWidth = $state(320);
	let midColWidth = $state(400);

	let jobDescription = $state('');
	let selectedTheme = $state('macchiato');
	let selectedFont = $state('Outfit');
	
	let previewHtml = $state('');
	let isTailoring = $state(false);
	let isSaving = $state(false);
	
	let toastMessage = $state('');
	
	const SECTIONS = ['basics', 'work', 'education', 'skills', 'projects', 'awards', 'publications', 'languages', 'interests', 'references'];
	const THEMES = ['macchiato', 'elegant', 'flat'];
	const FONTS = ['Outfit', 'Inter', 'Roboto', 'Merriweather', 'Playfair Display'];

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => { toastMessage = ''; }, 3000);
	}

	onMount(async () => {
		// Load Settings
		try {
			const setRes = await fetch('/api/settings');
			if (setRes.ok) {
				const setJson = await setRes.json();
				if (setJson.data) {
					aiProvider = setJson.data.aiProvider || 'openai';
					aiModelName = setJson.data.aiModelName || '';
					tailorPrompt = setJson.data.tailorPrompt || '';
					masterPrompt = setJson.data.generateMasterPrompt || '';
					coverLetterPrompt = setJson.data.coverLetterPrompt || '';
				}
			}
		} catch(e) { console.error('Failed to load settings', e); }

		// Load Master Data
		try {
			const res = await fetch('/api/masterdata');
			if (res.ok) {
				const json = await res.json();
				masterData = json.data;
				if (!masterData[activeSection]) {
					masterData[activeSection] = {};
				}
				editorContent = JSON.stringify(masterData[activeSection], null, 2);
			}
		} catch(e) { console.error('Failed to load master data', e); }

		// Load Drafts
		await fetchDrafts();
	});

	async function fetchDrafts() {
		try {
			const res = await fetch('/api/drafts');
			if (res.ok) {
				const json = await res.json();
				draftsList = json.drafts;
			}
		} catch (e) {
			console.error('Failed to fetch drafts', e);
		}
	}

	// Save Settings Debounce
	let saveSettingsTimeout: ReturnType<typeof setTimeout>;
	function triggerSettingsSave() {
		clearTimeout(saveSettingsTimeout);
		saveSettingsTimeout = setTimeout(async () => {
			try {
				await fetch('/api/settings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						aiProvider,
						aiModelName,
						tailorPrompt,
						generateMasterPrompt: masterPrompt,
						coverLetterPrompt
					})
				});
				showToast('Settings saved');
			} catch (e) { console.error('Failed to save settings', e); }
		}, 1500);
	}

	function togglePanel(panel: string) {
		openPanels[panel] = !openPanels[panel];
	}

	// Select a section to edit
	function selectSection(sec: string) {
		activeSection = sec;
		editorMode = 'master'; // switch back to master mode
		if (!masterData[sec]) {
			masterData[sec] = {};
		}
		editorContent = JSON.stringify(masterData[sec], null, 2);
	}

	async function handleDraftSelect() {
		if (!selectedDraftId) return;
		try {
			const res = await fetch(`/api/drafts/${selectedDraftId}`);
			if (res.ok) {
				const json = await res.json();
				editorMode = 'draft';
				editorContent = JSON.stringify(json.draft.data, null, 2);
				await renderPreview(json.draft.data, selectedTheme);
			}
		} catch (e) {
			console.error('Failed to load draft', e);
		}
	}

	// Auto-save logic
	let saveTimeout: ReturnType<typeof setTimeout>;
	function handleEditorChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editorContent = target.value;
		
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			try {
				const parsed = JSON.parse(editorContent);
				isSaving = true;

				if (editorMode === 'master') {
					masterData[activeSection] = parsed;
					await fetch('/api/masterdata', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ section: activeSection, data: parsed })
					});
					showToast(`Saved ${activeSection}`);
				} else if (editorMode === 'draft' && selectedDraftId) {
					await fetch(`/api/drafts/${selectedDraftId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ data: parsed })
					});
					await renderPreview(parsed, selectedTheme);
					showToast('Saved Draft');
				}
				
				isSaving = false;
			} catch (err) {
				// Invalid JSON, don't save yet
			}
		}, 1000);
	}

	async function generateMasterData() {
		if (!rawResumeText) {
			alert('Please paste a raw resume first.');
			return;
		}

		isGeneratingMaster = true;
		try {
			const res = await fetch('/api/generate-master', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					resumeText: rawResumeText,
					provider: aiProvider,
					modelName: aiModelName,
					customPrompt: masterPrompt
				})
			});

			if (res.ok) {
				const result = await res.json();
				masterData = result.data;
				editorContent = JSON.stringify(masterData[activeSection] || {}, null, 2);
				showToast('Master data generated successfully!');
				rawResumeText = ''; // clear input
			} else {
				const err = await res.json();
				alert(err.error);
			}
		} catch (e) {
			console.error(e);
			alert('An error occurred during generation.');
		} finally {
			isGeneratingMaster = false;
		}
	}

	async function tailorResume() {
		if (!jobDescription) {
			alert('Please enter a job description first.');
			return;
		}
		
		isTailoring = true;
		try {
			const res = await fetch('/api/tailor', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jobDescription,
					masterData,
					provider: aiProvider,
					modelName: aiModelName,
					customPrompt: tailorPrompt
				})
			});
			
			if (res.ok) {
				const result = await res.json();
				await renderPreview(result.resume, selectedTheme);
				showToast('Resume tailored successfully!');
				await fetchDrafts();
				selectedDraftId = result.id;
				editorMode = 'draft';
				editorContent = JSON.stringify(result.resume, null, 2);
			} else {
				const err = await res.json();
				alert(err.error);
			}
		} catch (e) {
			console.error(e);
			alert('An error occurred during tailoring.');
		} finally {
			isTailoring = false;
		}
	}

	async function generateCoverLetter() {
		if (!jobDescription) {
			alert('Please enter a job description first.');
			return;
		}
		
		isTailoring = true;
		try {
			const res = await fetch('/api/coverletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jobDescription,
					masterData,
					provider: aiProvider,
					modelName: aiModelName,
					customPrompt: coverLetterPrompt
				})
			});
			
			if (res.ok) {
				const result = await res.json();
				// Wrap cover letter in a simple div for styling
				previewHtml = `<div class="cover-letter-preview" style="padding: 1in; font-family: inherit; line-height: 1.6;">${result.html}</div>`;
				showToast('Cover letter generated successfully!');
			} else {
				const err = await res.json();
				alert(err.error);
			}
		} catch (e) {
			console.error(e);
			alert('An error occurred during cover letter generation.');
		} finally {
			isTailoring = false;
		}
	}

	async function renderPreview(resumeData: any, themeName: string) {
		try {
			const res = await fetch('/api/render', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ resume: resumeData, theme: themeName })
			});
			if (res.ok) {
				const json = await res.json();
				previewHtml = json.html;
			}
		} catch (e) {
			console.error("Render failed", e);
		}
	}

	// Resizer Logic
	let isDragging = false;
	let currentResizer: 'left' | 'mid' | null = null;
	let startX = 0;
	let startWidth = 0;

	function startDrag(e: MouseEvent, resizer: 'left' | 'mid') {
		isDragging = true;
		currentResizer = resizer;
		startX = e.clientX;
		startWidth = resizer === 'left' ? leftColWidth : midColWidth;
		
		window.addEventListener('mousemove', onDrag);
		window.addEventListener('mouseup', stopDrag);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function onDrag(e: MouseEvent) {
		if (!isDragging) return;
		const delta = e.clientX - startX;
		if (currentResizer === 'left') {
			leftColWidth = Math.max(250, Math.min(startWidth + delta, 800));
		} else {
			midColWidth = Math.max(250, Math.min(startWidth + delta, 800));
		}
	}

	function stopDrag() {
		isDragging = false;
		currentResizer = null;
		window.removeEventListener('mousemove', onDrag);
		window.removeEventListener('mouseup', stopDrag);
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	function generatePdf() {
		// Print the iframe specifically, as printing the window won't print the iframe's full content properly
		const iframe = document.querySelector('.resume-iframe') as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			iframe.contentWindow.print();
		} else {
			window.print();
		}
	}
	
	// React to theme/font changes if we already have a preview
	// We'll skip complex reactive rerendering for this snippet, but user can re-click a button.
</script>

<div class="dashboard">
	{#if toastMessage}
		<div class="toast animate-slideIn">{toastMessage}</div>
	{/if}

	<!-- Left Column: Context & Files -->
	<div class="column left-col" style="width: {leftColWidth}px;">
		<div class="left-col-content">
			
			<!-- AI Configurator Accordion -->
			<div class="accordion-item" class:open={openPanels.config}>
				<button class="accordion-header" onclick={() => togglePanel('config')}>
					<h3>AI Configurator</h3>
					<span class="chevron">▼</span>
				</button>
				<div class="accordion-content">
					<div class="config-group">
						<select bind:value={aiProvider} onchange={triggerSettingsSave} class="ui-select full-width mb-1">
							<option value="openai">OpenAI</option>
							<option value="gemini">Gemini</option>
							<option value="openrouter">OpenRouter</option>
							<option value="opencode">OpenCode</option>
						</select>
						<input 
							type="text" 
							class="job-input sm-input" 
							bind:value={aiModelName} 
							oninput={triggerSettingsSave}
							placeholder="Custom model name (optional)" 
						/>
					</div>
				</div>
			</div>

			<!-- System Prompts Accordion -->
			<div class="accordion-item" class:open={openPanels.prompts}>
				<button class="accordion-header" onclick={() => togglePanel('prompts')}>
					<h3>System Prompts</h3>
					<span class="chevron">▼</span>
				</button>
				<div class="accordion-content">
					<label class="prompt-label">Tailor Resume Prompt</label>
					<textarea 
						class="job-input prompt-input" 
						bind:value={tailorPrompt} 
						oninput={triggerSettingsSave}
						spellcheck="false"
					></textarea>

					<label class="prompt-label mt-2">Cover Letter Prompt</label>
					<textarea 
						class="job-input prompt-input" 
						bind:value={coverLetterPrompt} 
						oninput={triggerSettingsSave}
						spellcheck="false"
					></textarea>
					
					<label class="prompt-label mt-2">Generate Source of Truth Prompt</label>
					<textarea 
						class="job-input prompt-input" 
						bind:value={masterPrompt} 
						oninput={triggerSettingsSave}
						spellcheck="false"
					></textarea>
				</div>
			</div>

			<!-- Import Existing Resume Accordion -->
			<div class="accordion-item" class:open={openPanels.import}>
				<button class="accordion-header" onclick={() => togglePanel('import')}>
					<h3>Import Existing Resume</h3>
					<span class="chevron">▼</span>
				</button>
				<div class="accordion-content">
					<textarea 
						class="job-input" 
						bind:value={rawResumeText} 
						placeholder="Paste your existing resume here to generate source of truth..."
					></textarea>
					<button class="btn-primary full-width mt-2" onclick={generateMasterData} disabled={isGeneratingMaster}>
						{#if isGeneratingMaster}
							<Loader2 size={16} class="spinner" /> Generating...
						{:else}
							Generate Source of Truth
						{/if}
					</button>
				</div>
			</div>

			<!-- Target Job Description Accordion -->
			<div class="accordion-item" class:open={openPanels.job}>
				<button class="accordion-header" onclick={() => togglePanel('job')}>
					<h3>Target Job Description</h3>
					<span class="chevron">▼</span>
				</button>
				<div class="accordion-content">
					<textarea 
						class="job-input" 
						bind:value={jobDescription} 
						placeholder="Paste job listing here..."
					></textarea>
				</div>
			</div>

			<!-- Master Data Vault Accordion -->
			<div class="accordion-item" class:open={openPanels.vault}>
				<button class="accordion-header" onclick={() => togglePanel('vault')}>
					<h3>Master Data Vault</h3>
					<span class="chevron">▼</span>
				</button>
				<div class="accordion-content">
					<ul class="file-list">
						{#each SECTIONS as section}
							<li>
								<button 
									class="file-btn" 
									class:active={activeSection === section}
									onclick={() => selectSection(section)}
								>
									<FileJson size={16} />
									<span>{section}.json</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>

		</div>
	</div>

	<!-- Resizer 1 -->
	<div class="resizer" onmousedown={(e) => startDrag(e, 'left')} role="separator" tabindex="0"></div>

	<!-- Middle Column: Editor -->
	<div class="column mid-col" style="width: {midColWidth}px;">
		<div class="mid-col-content">
			<div class="editor-header">
			<div class="editor-title">
				<FileText size={20} class="accent-icon" />
				<h2>
					{#if editorMode === 'master'}
						Editing: {activeSection}.json
					{:else}
						Editing: Tailored Draft
					{/if}
				</h2>
			</div>
			<div class="save-status">
				{#if isSaving}
					<Loader2 size={16} class="spinner" /> <span>Saving...</span>
				{:else}
					<Save size={16} /> <span>Saved</span>
				{/if}
			</div>
		</div>
			<textarea 
				class="json-editor" 
				value={editorContent}
				oninput={handleEditorChange}
				spellcheck="false"
			></textarea>
		</div>
	</div>

	<!-- Resizer 2 -->
	<div class="resizer" onmousedown={(e) => startDrag(e, 'mid')} role="separator" tabindex="0"></div>

	<!-- Right Column: Preview -->
	<div class="column right-col printable-area">
		<div class="preview-toolbar no-print">
			<div class="toolbar-group mode-toggle-group">
				<button 
					class="toggle-btn" 
					class:active={generationMode === 'resume'} 
					onclick={() => generationMode = 'resume'}
				>Resume</button>
				<button 
					class="toggle-btn" 
					class:active={generationMode === 'coverletter'} 
					onclick={() => generationMode = 'coverletter'}
				>Cover Letter</button>
			</div>

			<div class="toolbar-group">
				{#if generationMode === 'resume'}
					<select bind:value={selectedDraftId} onchange={handleDraftSelect} class="ui-select sm-select">
						<option value="">-- Select a Draft --</option>
						{#each draftsList as draft}
							<option value={draft._id}>{draft.companyName}</option>
						{/each}
					</select>

					<select bind:value={selectedTheme} class="ui-select sm-select">
						{#each THEMES as theme}
							<option value={theme}>{theme} theme</option>
						{/each}
					</select>
				{/if}
				
				<select bind:value={selectedFont} class="ui-select sm-select">
					{#each FONTS as font}
						<option value={font}>{font}</option>
					{/each}
				</select>
			</div>

			<div class="toolbar-group">
				{#if generationMode === 'resume'}
					<button class="btn-primary" onclick={tailorResume} disabled={isTailoring}>
						{#if isTailoring}
							<Loader2 size={16} class="spinner" /> Tailoring...
						{:else}
							Tailor Resume
						{/if}
					</button>
				{:else}
					<button class="btn-primary" onclick={generateCoverLetter} disabled={isTailoring}>
						{#if isTailoring}
							<Loader2 size={16} class="spinner" /> Generating...
						{:else}
							Generate Letter
						{/if}
					</button>
				{/if}
				<button class="btn-icon" title="Save as PDF" onclick={generatePdf}>
					<Download size={18} />
				</button>
			</div>
		</div>

		<div class="preview-container">
			{#if previewHtml}
				<div class="resume-wrapper">
					<iframe 
						title="Resume Preview"
						class="resume-iframe"
						srcdoc={`
							<style>
								/* Inject font override */
								body { font-family: '${selectedFont}', sans-serif !important; }
								
								${selectedTheme === 'macchiato' ? `
								/* Expand left sidebar in macchiato theme */
								.left-column { width: 220px !important; margin-right: 25px !important; }
								.info-tag-container .info-text { width: auto !important; }
								/* Prevent bullet points from splitting across columns */
								ul.two-column li { break-inside: avoid-column; page-break-inside: avoid; }
								
								/* Format education in left column */
								.left-column .education-container { text-align: left; }
								.left-column .education-container .pull-left, .left-column .education-container .pull-right { float: none !important; display: block; text-align: left; }
								.left-column .education-container h5.italic.pull-right { margin-top: 3px; margin-bottom: 6px; color: #777; }
								.left-column .education-container ul.two-column { column-count: 1 !important; -webkit-column-count: 1 !important; padding-left: 15px; margin-top: 10px; list-style-type: disc; }
								.left-column .education-container ul.two-column li { text-align: left; }
								` : ''}
								
								/* Inject visual page breaks for screen preview (US Letter: 8.5x11 in) */
								@media screen {
									html, body { 
										margin: 0; 
										padding: 0; 
										background: white;
									}
									/* This draws a subtle red dashed line every 11 inches to indicate page breaks */
									body::after {
										content: "";
										position: absolute;
										top: 0;
										left: 0;
										right: 0;
										bottom: 0;
										pointer-events: none;
										background-image: linear-gradient(to bottom, transparent calc(11in - 1px), red calc(11in - 1px), red 11in);
										background-size: 100% 11in;
										opacity: 0.3;
										z-index: 9999;
									}
								}
								@media print {
									@page {
										margin: 0;
									}
									body {
										-webkit-print-color-adjust: exact;
										print-color-adjust: exact;
									}
								}
							</style>
							${previewHtml}
							${selectedTheme === 'macchiato' ? `
							<script>
								// Move education to left sidebar
								const ed = document.querySelector('.education-container');
								const leftCol = document.querySelector('.left-column');
								if (ed && leftCol) {
									leftCol.appendChild(ed);
								}
							</script>
							` : ''}
						`}
						frameborder="0"
					></iframe>
				</div>
			{:else}
				<div class="empty-preview">
					<div class="placeholder-icon animate-pulse"></div>
					<p>Generate a tailored resume to see the preview.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.column {
		display: flex;
		flex-direction: column;
		height: 100%;
		flex-shrink: 0;
	}
	
	.resizer {
		width: 6px;
		background-color: var(--border-color);
		cursor: col-resize;
		transition: background-color 0.2s;
		z-index: 10;
	}
	
	.resizer:hover, .resizer:active {
		background-color: var(--accent-solid);
	}

	/* Left Col */
	.left-col {
		background: var(--bg-secondary);
	}
	
	/* Wrap the contents of resizable columns so we can scroll inside them */
	.left-col-content {
		padding: 1rem;
		gap: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* Accordions */
	.accordion-item {
		background: var(--bg-tertiary);
		border-radius: var(--radius);
		border: 1px solid var(--border-color);
		overflow: hidden;
	}

	.accordion-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--bg-tertiary);
		transition: background 0.2s;
	}
	.accordion-header:hover { background: var(--border-color); }
	
	.accordion-header h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.chevron {
		font-size: 0.75rem;
		color: var(--text-secondary);
		transition: transform 0.3s ease;
		transform: rotate(-90deg);
	}
	
	.accordion-item.open .chevron { transform: rotate(0deg); }
	
	.accordion-content {
		display: none;
		padding: 0 1rem 1rem 1rem;
	}
	
	.accordion-item.open .accordion-content {
		display: block;
	}

	.config-group { display: flex; flex-direction: column; gap: 0.5rem; }
	.mb-1 { margin-bottom: 0.25rem; }
	.sm-input { height: auto; padding: 0.35rem 0.75rem; font-size: 0.85rem; }
	
	.prompt-label {
		display: block;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	.prompt-input {
		height: 120px;
		font-size: 0.85rem;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}

	.job-input {
		width: 100%;
		height: 200px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 1rem;
		resize: none;
		font-size: 0.9rem;
	}
	.job-input:focus { border-color: var(--accent-solid); outline: none; }

	.file-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: calc(var(--radius) - 4px);
		color: var(--text-secondary);
		transition: all 0.2s;
	}
	.file-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
	.file-btn.active {
		background: rgba(139, 92, 246, 0.1);
		color: var(--accent-solid);
		border-left: 3px solid var(--accent-solid);
	}

	/* Middle Col */
	.mid-col {
		background: var(--bg-primary);
	}
	
	.mid-col-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: auto;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.editor-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.editor-title h2 { font-size: 1.1rem; }
	.accent-icon { color: var(--accent-solid); }

	.save-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.json-editor {
		flex: 1;
		width: 100%;
		background: var(--bg-primary);
		border: none;
		padding: 1.5rem;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.95rem;
		color: #e4e4e7;
		resize: none;
		outline: none;
	}

	/* Right Col */
	.right-col {
		flex: 1;
		min-width: 300px;
		background: var(--bg-secondary);
		position: relative;
	}

	.preview-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-tertiary);
		z-index: 10;
	}

	.toolbar-group { display: flex; gap: 0.75rem; align-items: center; }

	.ui-select {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		color: var(--text-primary);
		outline: none;
	}
	
	.sm-select { padding: 0.35rem 0.75rem; font-size: 0.85rem; }

	.mode-toggle-group {
		background: var(--bg-primary);
		border-radius: var(--radius);
		padding: 0.25rem;
		display: flex;
		border: 1px solid var(--border-color);
	}

	.toggle-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		padding: 0.35rem 0.75rem;
		border-radius: calc(var(--radius) - 2px);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn:hover {
		color: var(--text-primary);
	}

	.toggle-btn.active {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--accent-gradient);
		padding: 0.5rem 1.25rem;
		border-radius: var(--radius);
		font-weight: 500;
		color: white;
		transition: all 0.2s;
	}
	.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
	.btn-primary:disabled { opacity: 0.7; cursor: wait; }

	.full-width { width: 100%; justify-content: center; }
	.mt-2 { margin-top: 0.75rem; }

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		transition: all 0.2s;
	}
	.btn-icon:hover { border-color: var(--accent-solid); color: var(--accent-solid); }

	.preview-container {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		justify-content: center;
	}

	.resume-wrapper {
		width: 100%;
		max-width: 8.5in; /* US Letter width */
		background: white;
		box-shadow: 0 10px 30px rgba(0,0,0,0.3);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		/* Ensure it matches aspect ratio of pages */
		min-height: 11in; 
	}

	.resume-iframe {
		width: 100%;
		flex: 1;
		min-height: 11in;
		border: none;
		border-radius: 4px;
		background: white;
	}

	.empty-preview {
		margin-top: 20%;
		text-align: center;
		color: var(--text-secondary);
	}
	.placeholder-icon {
		width: 64px; height: 64px;
		border-radius: 50%;
		background: var(--bg-tertiary);
		margin: 0 auto 1.5rem;
	}

	.toast {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		background: var(--accent-gradient);
		color: white;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		font-weight: 500;
		box-shadow: 0 10px 25px rgba(0,0,0,0.5);
		z-index: 50;
	}

	.spinner { animation: spin 1s linear infinite; }
	@keyframes spin { 100% { transform: rotate(360deg); } }

	/* Print Styles */
	@media print {
		body { background: white; }
		.no-print { display: none !important; }
		.left-col, .mid-col { display: none !important; }
		.dashboard { display: block; height: auto; overflow: visible; }
		.right-col { width: 100%; border: none; padding: 0; background: white; }
		.preview-container { padding: 0; overflow: visible; display: block; }
		.resume-wrapper { max-width: 100%; box-shadow: none; border-radius: 0; }
		.resume-iframe { min-height: 100vh; height: auto; }
		@page { size: portrait; margin: 0; }
	}
</style>

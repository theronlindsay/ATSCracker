const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

// 1. Add state variables
content = content.replace(
	/let editorContent = \$state\(''\);/,
	`let editorContent = $state('');\n\n\tlet leftColWidth = $state(320);\n\tlet midColWidth = $state(400);`
);

// 2. Add functions
const functions = `
	// Resizer Logic
	let isDragging = false;
	let currentResizer = null; // 'left' | 'mid'
	let startX = 0;
	let startWidth = 0;

	function startDrag(e, resizer) {
		isDragging = true;
		currentResizer = resizer;
		startX = e.clientX;
		startWidth = resizer === 'left' ? leftColWidth : midColWidth;
		
		window.addEventListener('mousemove', onDrag);
		window.addEventListener('mouseup', stopDrag);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function onDrag(e) {
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
`;
content = content.replace(/\/\/ Layout managed by Bootstrap responsive grid/, functions);

// 3. Update HTML Columns
// Left
content = content.replace(
	/<div class="col-12 col-md-3 d-flex flex-column left-col border-end border-secondary" style="height: 100vh;">/,
	'<div class="col-12 d-flex flex-column left-col border-end border-secondary resizable-col" style="--desktop-width: {leftColWidth}px; height: 100vh;">'
);
// Mid
content = content.replace(
	/<div class="col-12 col-md-4 d-flex flex-column mid-col border-end border-secondary" style="height: 100vh;">/,
	'<!-- Resizer 1 -->\n\t<div class="resizer d-none d-md-block" onmousedown={(e) => startDrag(e, \'left\')} role="separator" tabindex="0"></div>\n\n\t<div class="col-12 d-flex flex-column mid-col border-end border-secondary resizable-col" style="--desktop-width: {midColWidth}px; height: 100vh;">'
);
// Right
content = content.replace(
	/<div class="col-12 col-md-5 d-flex flex-column right-col printable-area" style="height: 100vh; overflow-y: auto;">/,
	'<!-- Resizer 2 -->\n\t<div class="resizer d-none d-md-block" onmousedown={(e) => startDrag(e, \'mid\')} role="separator" tabindex="0"></div>\n\n\t<div class="col-12 d-flex flex-column right-col printable-area flex-grow-1" style="height: 100vh; overflow-y: auto; min-width: 0;">'
);

// 4. Update CSS
const css = `
	.dashboard {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.resizer {
		width: 6px;
		background-color: var(--border-color);
		cursor: col-resize;
		transition: background-color 0.2s;
		z-index: 10;
		flex-shrink: 0;
	}
	
	.resizer:hover, .resizer:active {
		background-color: var(--accent-solid);
	}

	@media (min-width: 768px) {
		.resizable-col {
			width: var(--desktop-width) !important;
			flex: 0 0 var(--desktop-width) !important;
		}
	}
`;
content = content.replace('</style>', css + '\n</style>');

fs.writeFileSync('src/routes/+page.svelte', content);

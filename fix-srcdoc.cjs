const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

const derivedStr = `
	let iframeSrcdoc = $derived(\`
		<style>
			/* Inject font override */
			body { font-family: '\${selectedFont}', sans-serif !important; }
			
			\${selectedTheme === 'macchiato' ? \\\`
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
			\\\` : ''}
			
			/* Inject visual page breaks for screen preview (US Letter: 8.5x11 in) */
			@media screen {
				html, body { margin: 0; padding: 0; background: white; }
				body::after {
					content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
					pointer-events: none;
					background-image: linear-gradient(to bottom, transparent calc(11in - 1px), red calc(11in - 1px), red 11in);
					background-size: 100% 11in; opacity: 0.3; z-index: 9999;
				}
			}
			@media print {
				@page { margin: 0; }
				body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			}
		</style>
		\${previewHtml}
		\${selectedTheme === 'macchiato' ? \\\`
		<script>
			// Move education to left sidebar
			const ed = document.querySelector('.education-container');
			const leftCol = document.querySelector('.left-column');
			if (ed && leftCol) {
				leftCol.appendChild(ed);
			}
		</script>
		\\\` : ''}
	\`);
`;

content = content.replace(
	"let previewHtml = $state('');",
	"let previewHtml = $state('');\n" + derivedStr
);

// Now remove the srcdoc from iframe
const oldSrcdocRegex = /srcdoc=\{\`[\s\S]*?`\}\n\t\t\t\t\t\t\tframeborder="0"/;
content = content.replace(oldSrcdocRegex, 'srcdoc={iframeSrcdoc}\n\t\t\t\t\t\t\tframeborder="0"');

fs.writeFileSync('src/routes/+page.svelte', content);

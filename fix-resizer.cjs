const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

// Replace both .resizer blocks with one that has height
content = content.replace(/\.resizer \{[\s\S]*?z-index: 10;\n\t\}/g, '');
content = content.replace(/\.resizer \{[\s\S]*?flex-shrink: 0;\n\t\}/g, '');

const newResizer = `
	.resizer {
		width: 6px;
		height: 100vh;
		background-color: var(--border-color);
		cursor: col-resize;
		transition: background-color 0.2s;
		z-index: 10;
		flex-shrink: 0;
	}
`;

content = content.replace('</style>', newResizer + '\n</style>');

fs.writeFileSync('src/routes/+page.svelte', content);

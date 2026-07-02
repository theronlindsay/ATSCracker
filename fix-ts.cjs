const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

content = content.replace(
	/let currentResizer = null; \/\/ 'left' \| 'mid'/,
	"let currentResizer: 'left' | 'mid' | null = null;"
);
content = content.replace(
	/function startDrag\(e, resizer\)/,
	"function startDrag(e: MouseEvent, resizer: 'left' | 'mid')"
);
content = content.replace(/function onDrag\(e\)/, 'function onDrag(e: MouseEvent)');

fs.writeFileSync('src/routes/+page.svelte', content);

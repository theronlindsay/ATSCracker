const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

// The file has \` where it should just have `
// We need to carefully replace \` inside the $derived block.
content = content.replace(/\\\`/g, '`');

fs.writeFileSync('src/routes/+page.svelte', content);

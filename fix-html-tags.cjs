const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

// The $derived block has <style> and <script> inside a string which crashes the Svelte parser.
content = content.replace(/<style>/g, '\\x3Cstyle\\x3E');
content = content.replace(/<\/style>/g, '\\x3C/style\\x3E');
content = content.replace(/<script>/g, '\\x3Cscript\\x3E');
content = content.replace(/<\\\/script>/g, '\\x3C/script\\x3E');

// Fix the original <script lang="ts"> which might have been accidentally replaced!
content = content.replace(/\\x3Cscript\\x3E lang="ts">/, '<script lang="ts">');

fs.writeFileSync('src/routes/+page.svelte', content);

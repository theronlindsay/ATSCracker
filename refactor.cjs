const fs = require('fs');
let content = fs.readFileSync('src/routes/+page.svelte', 'utf-8');

// Remove JS resizer variables
content = content.replace(
	/let leftColWidth = \$state\(320\);\n\s*let midColWidth = \$state\(400\);/,
	''
);

// Remove JS resizer logic
content = content.replace(
	/\/\/ Resizer Logic[\s\S]*?function stopDrag\(\) \{[\s\S]*?\}/,
	'// Layout managed by Bootstrap responsive grid'
);

// Update dashboard container
content = content.replace(
	'<div class="dashboard">',
	'<div class="container-fluid p-0 dashboard overflow-hidden h-100">\n\t<div class="row g-0 h-100 flex-column flex-md-row flex-nowrap flex-md-wrap" style="overflow-y: auto; overflow-x: hidden;">'
);

// Wrap end of dashboard
content = content.replace('</div>\n\n<style>', '\t</div>\n</div>\n\n<style>');

// Update left column
content = content.replace(
	/<div class="column left-col" style="width: \{leftColWidth\}px;">/,
	'<div class="col-12 col-md-3 d-flex flex-column left-col border-end border-secondary" style="height: 100vh;">'
);

// Update mid column
content = content.replace(
	/<div class="column mid-col" style="width: \{midColWidth\}px;">/,
	'<div class="col-12 col-md-4 d-flex flex-column mid-col border-end border-secondary" style="height: 100vh;">'
);

// Update right column
content = content.replace(
	/<div class="column right-col printable-area">/,
	'<div class="col-12 col-md-5 d-flex flex-column right-col printable-area" style="height: 100vh; overflow-y: auto;">'
);

// Remove resizers
content = content.replace(/<!-- Resizer 1 -->[\s\S]*?tabindex="0"><\/div>/, '');
content = content.replace(/<!-- Resizer 2 -->[\s\S]*?tabindex="0"><\/div>/, '');

// Update form inputs to use Bootstrap classes
content = content.replace(
	/class="ui-select/g,
	'class="form-select bg-dark text-light border-secondary'
);
content = content.replace(
	/class="job-input/g,
	'class="form-control bg-dark text-light border-secondary'
);
content = content.replace(
	/class="json-editor"/g,
	'class="form-control bg-dark text-light border-secondary json-editor"'
);

fs.writeFileSync('src/routes/+page.svelte', content);
console.log('Refactor complete.');

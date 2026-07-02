import theme from 'jsonresume-theme-macchiato';
const resume1 = {
	basics: { name: 'John Doe' },
	work: [{ company: 'Acme', position: 'CEO', startDate: '2020-01-01' }]
};
const resume2 = {
	basics: { name: 'John Doe' },
	work: [{ company: 'Acme', position: 'CEO', startDate: '2020-01-01', endDate: 'Present' }]
};

console.log('No endDate:', theme.render(resume1).includes('Present'));
console.log('endDate Present:', theme.render(resume2).includes('Invalid date'));

const year = 1000;
const regex = new RegExp(`\\b(?:(?:Jan(?:uary)?|0?1)[\\s\\-\\/,]+)*${year}(?:[\\s\\-\\/,]+(?:Jan(?:uary)?|0?1))*\\b`, 'gi');

const tests = [
  "Jan 1000",
  "January 1000",
  "1000-01-01",
  "01/1000",
  "1000/01",
  "1000",
  "Jan 1000 - Jan 1001",
  "January, 1000"
];

for (const t of tests) {
  console.log(`${t} ->`, t.replace(regex, "Present"));
}

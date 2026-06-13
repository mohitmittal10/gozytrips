const SQLI_PATTERN =
  /(?:--|\/\*|\*\/|;\s*(?:select|insert|update|delete|drop|alter|truncate|union|exec(?:ute)?|create)\b|union\s+select|information_schema|xp_cmdshell|'\s*(?:or|and)\s*['"(]?\w+['")\s]*=\s*['"(]?\w+|"\s*(?:or|and)\s*["'(]?\w+["')\s]*=\s*["'(]?\w+)/i;
const NOSQLI_PATTERN =
  /(?:^|[\s{[(,])\$(?:where|gt|gte|lt|lte|ne|eq|in|nin|regex|expr|function|accumulator)\b|["']\$(?:where|gt|gte|lt|lte|ne|regex|expr)["']\s*:/i;

function sanitizeForCrmNotes(text) {
  let sanitized = text
    .replace(/"/g, "'")       // double quotes -> single quote
    .replace(/;/g, ",")       // semicolon -> comma
    .replace(/=/g, "-")       // equals -> hyphen
    .replace(/\*/g, "-")      // asterisk -> hyphen
    .replace(/_/g, "-")       // underscore -> hyphen
    .replace(/\[/g, "(")      // open bracket -> open parenthesis
    .replace(/\]/g, ")")      // close bracket -> close parenthesis
    .replace(/\{/g, "(")      // open brace -> open parenthesis
    .replace(/\}/g, ")")      // close brace -> close parenthesis
    .replace(/</g, "(")       // open angle bracket -> open parenthesis
    .replace(/>/g, ")")       // close angle bracket -> close parenthesis
    .replace(/\\/g, "/");     // backslash -> forward slash

  // Do standard replacement of comments and union select
  sanitized = sanitized
    .replace(/\/\*/g, "/")
    .replace(/\*\//g, "/")
    .replace(/union\s+select/gi, "union and select");

  // Collapse multiple hyphens into a single hyphen to prevent SQL comments (--)
  sanitized = sanitized.replace(/-{2,}/g, "-");

  // Allow: Letters, marks, numbers, whitespace, and: . , ' ’ : / ( ) # & ! ? % + - @
  const forbiddenCharRegex = /[^\p{L}\p{M}\p{N}\s.,'’:\/()#&!?%+\-@]/gu;
  return sanitized.replace(forbiddenCharRegex, "");
}

// Test cases
const testEmails = [
  "Hi, here is your update.\n\n---\nBest regards",
  "It's or we can update select values; let's see.",
  "Cost: $500, which is standard.",
  "Let's check: union select info",
  "The hotel is /* premium */ and costs $eq to others",
];

testEmails.forEach((email, i) => {
  const clean = sanitizeForCrmNotes(email);
  const sqli = SQLI_PATTERN.test(clean);
  const nosqli = NOSQLI_PATTERN.test(clean);
  console.log(`Test ${i + 1}:`);
  console.log(`  Raw  : ${JSON.stringify(email)}`);
  console.log(`  Clean: ${JSON.stringify(clean)}`);
  console.log(`  SQLI : ${sqli}`);
  console.log(`  NOSQL: ${nosqli}`);
  if (sqli || nosqli) {
    console.log("  FAILED!");
  } else {
    console.log("  PASSED");
  }
});

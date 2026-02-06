const natural = require('natural');
const pool = require('../db');

// We use TF-IDF to find the most "defining" words in a question
// But for short text, simple Noun extraction + Frequency is often better.
// Let's use a hybrid: Stopword removal + Porter Stemmer + prioritized list.

const tokenizer = new natural.WordTokenizer();
const nounInflector = new natural.NounInflector();

// Common educational stopwords to ignore
const STOP_WORDS = new Set([
    "what", "is", "the", "of", "and", "a", "an", "to", "in", "for", "with", "on", "at",
    "by", "from", "up", "about", "into", "over", "after", "explain", "describe", "calculate",
    "find", "write", "code", "implement", "function", "following", "which", "how", "why",
    "define", "identify", "list", "compare", "contrast", "does", "do", "are", "using",
    "example", "best", "worst", "case", "primary", "main", "fundamental", "characteristic",
    "method", "term", "statement", "true", "false", "output", "program", "value", "variable"
]);

// Map specific keywords to broader subjects (Rule-based Fallback for very common terms)
const DOMAIN_MAP = {
    "loop": "Programming",
    "array": "Data Structures",
    "list": "Data Structures",
    "tree": "Data Structures",
    "graph": "Data Structures",
    "sort": "Algorithms",
    "search": "Algorithms",
    "complexity": "Complexity",
    "recursion": "Recursion",
    "database": "Databases",
    "sql": "Databases",
    "react": "Web Development",
    "node": "Web Development",
    "physic": "Physics",
    "velocity": "Physics",
    "derivative": "Calculus",
    "integral": "Calculus"
};

async function getOrInsertTopic(topicName) {
    if (!topicName) topicName = "General";

    // Normalize: Capitalize first letter
    topicName = topicName.charAt(0).toUpperCase() + topicName.slice(1).toLowerCase();

    // Check DB
    const check = await pool.query('SELECT id FROM topics WHERE name = $1', [topicName]);
    if (check.rows.length > 0) return check.rows[0].id;

    // Insert new (Use a localized ID generation or rely on Serial if we had it. 
    // Since we defined ID as INT manually in migration, we need to find max ID.
    const maxRes = await pool.query('SELECT MAX(id) as max_id FROM topics');
    const newId = (maxRes.rows[0].max_id || 0) + 1;

    await pool.query('INSERT INTO topics (id, name) VALUES ($1, $2)', [newId, topicName]);
    return newId;
}

async function generateTopic(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());

    // 1. Filter Stopwords
    const filtered = tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2);

    // 2. Look for Domain Map hits (High Confidence)
    for (const word of filtered) {
        // Check exact or stemmed
        if (DOMAIN_MAP[word]) return await getOrInsertTopic(DOMAIN_MAP[word]);
        const singular = nounInflector.singularize(word);
        if (DOMAIN_MAP[singular]) return await getOrInsertTopic(DOMAIN_MAP[singular]);
    }

    // 3. Fallback: Extraction of most significant Noun
    // In a real short question, the "subject" is often the last heavy noun or the first.
    // E.g. "What is the capital of France?" -> France.
    // "Solve this equation" -> Equation.

    if (filtered.length > 0) {
        // Heuristic: Use the longest word as it's likely the most specific technical term
        const longest = filtered.reduce((a, b) => a.length > b.length ? a : b);
        return await getOrInsertTopic(longest);
    }

    return await getOrInsertTopic("General");
}

module.exports = { generateTopic };

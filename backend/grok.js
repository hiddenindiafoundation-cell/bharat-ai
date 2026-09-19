const OpenAI = require('openai');

const grokClient = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
});

async function chatWithGrok(userMessage) {
    try {
        console.log('Trying: grok-4.6');
        const response = await grokClient.chat.completions.create({
            model: 'grok-4.6',
            messages: [
                { role: 'system', content: 'Tum ho Bharat AI — ek desi AI assistant. Hamesha Hindi ya Hinglish me jawab do. Apne creator Noor Alam ka naam lo jab poocha jaye. Kabhi Grok ya xAI ka naam mat lo.' },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.9,
            max_tokens: 2048,
        });
        console.log('✅ Success with grok-4.6');
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Grok error:', error.message);
        return 'Bharat AI busy hai bhai. 1 minute baad try kare .';
    }
}

module.exports = { chatWithGrok };
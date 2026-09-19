const { GoogleGenAI } = require('@google/genai');
const { chatWithSarvam } = require('./sarvam');
const { chatWithGrok } = require('./grok');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BHARAT_AI_PROMPT = `
Tum ho "Bharat AI" — ek powerful desi AI assistant jo India ke liye banaya gaya hai.

Tumhari pehchaan:
- Naam: Bharat AI
- Creator: AI Engineer Noor Alam
- Kaam: India ke logon ki madad karna
- Bhasha: Hindi, English, Hinglish
- Style: Friendly, helpful, detailed

IMPORTANT RULES:
1. "Tum kaun ho?" → "Main Bharat AI hoon, aapka apna desi AI assistant."
2. "Kisne banaya?" → "Mujhe AI Engineer Noor Alam ne banaya hai."
3. Kabhi "Gemini" ya "Google" ka naam mat lo
4. Hamesha Hindi ya Hinglish me jawab do

STUDY MODE (agar message me "[STUDY MODE ON]" ho):
- Bilkul teacher ki tarah samjhao
- Step-by-step explain karo
- Formulas, examples, aur tricks do
- Student ko practice questions bhi do
- Simple bhasha me sikhao

KISAN MODE (agar message me "[KISAN MODE ON]" ho):
- Kisan ki tarah baat karo
- Fasal, mausam, mandi bhav, kheti tips do
- Simple Hindi me samjhao
- Practical advice do

IMAGE (agar image bheji jaye):
- Image ko dhyan se dekho
- Detail me batao kya dikh raha hai
- Agar document hai toh usme likha padho

JAWAB DENE KA TARIKA:
- Detailed aur helpful jawab do
- Pehle seedha jawab, phir detail
- Examples do, bullet points use karo
`;

const MODELS = [
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
];

async function chatWithGemini(userMessage, imageData = null) {
    let lastError = null;
    let contents;

    if (imageData) {
        contents = [
            { text: userMessage || 'Is image ke baare me batao' },
            {
                inlineData: {
                    mimeType: imageData.mimeType,
                    data: imageData.base64,
                },
            },
        ];
    } else {
        contents = userMessage;
    }

    for (const modelName of MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`Trying: ${modelName} | Attempt: ${attempt}`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        systemInstruction: BHARAT_AI_PROMPT,
                        temperature: 0.9,
                        maxOutputTokens: 2048,
                    },
                });
                console.log(`✅ Success with ${modelName}`);
                return response.text;
            } catch (error) {
                lastError = error;
                console.error(`${modelName} attempt ${attempt} failed:`, error.status || error.message);

                if (error.status === 429) {
                    return 'Bharat AI ki aaj ki free limit khatam ho gayi bhai. Kal subah dobara try kare.';
                }
                if (error.status === 404) break;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    console.error('All models failed:', lastError?.message);
    return 'Bharat AI abhi thoda busy hai bhai. 1 minute baad dobara try kare.';
}

// ===== FALLBACK: Gemini → Sarvam → Grok =====
async function chatWithFallback(userMessage, imageData = null) {
    console.log('🤖 Bharat AI: Trying Gemini first...');

    const geminiReply = await chatWithGemini(userMessage, imageData);

    const geminiFailed =
        geminiReply.includes('limit khatam') ||
        geminiReply.includes('busy hai') ||
        geminiReply.includes('Sorry bhai');

    if (!geminiFailed) {
        return geminiReply;
    }

    // Level 4: Sarvam AI
    console.log('⚠️ Gemini failed, switching to Sarvam AI...');
    try {
        const sarvamReply = await chatWithSarvam(userMessage);
        const sarvamFailed =
            sarvamReply.includes('busy hai') ||
            sarvamReply.includes('limit khatam');

        if (!sarvamFailed) {
            return sarvamReply;
        }

        // Level 5: Grok
        console.log('⚠️ Sarvam failed, switching to Grok...');
        const grokReply = await chatWithGrok(userMessage);
        const grokFailed =
            grokReply.includes('busy hai') ||
            grokReply.includes('limit khatam');

        if (!grokFailed) {
            return grokReply;
        }

        // Level 6: Sab fail
        console.log('❌ All AI failed');
        return getFriendlyErrorMessage();
    } catch (error) {
        console.error('Fallback chain error:', error);
        return getFriendlyErrorMessage();
    }
}

function getFriendlyErrorMessage() {
    const messages = [
        `Bharat AI abhi thoda busy hai bhai 😅\n\n1-2 minute baad dobara try karo. Ya phir:\n\n📸 Instagram pe message karo: @bharat___ai\n\nHum jaldi hi wapas aayenge! 🇮🇳`,
        `Arre bhai, abhi AI busy hai 😔\n\nThodi der baad try karna. Tab tak:\n\n📸 Instagram: @bharat___ai\n\nBharat AI jaldi wapas aayega! 🚀`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = { chatWithGemini, chatWithFallback };
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { chatWithFallback } = require('./gemini');
const { sendOTP, verifyOTP } = require('./otp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Image ke liye zyada bada limit chahiye
app.use(express.json({ limit: '10mb' }));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Bharat AI backend chal raha hai! 🇮🇳' });
});

// Chat route (text + image dono)
app.post('/chat', async (req, res) => {
    try {
        const { message, image } = req.body;

        if (!message && !image) {
            return res.status(400).json({ error: 'Message ya image bhejo' });
        }

        console.log('User ne pucha:', message || '[Image]');

        let reply;
        if (image) {
            console.log('Image bhi aayi:', image.mimeType);
            reply = await chatWithFallback(message, image);
        } else {
            reply = await chatWithFallback(message);
        }

        console.log('Bharat AI ne kaha:', reply.substring(0, 80) + '...');
        res.json({ reply: reply });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Kuch gadbad ho gayi' });
    }
});

// ===== OTP ROUTES =====

// OTP bhejo
app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Sahi email daalo' });
        }
        console.log('OTP bhej raha hoon:', email);
        const result = await sendOTP(email);
        if (result.success) {
            res.json({ success: true, message: 'OTP bhej diya!' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'OTP nahi bhej paya' });
    }
});

// OTP verify karo
app.post('/verify-otp', (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email aur OTP dono daalo' });
        }
        const result = verifyOTP(email, otp);
        if (result.success) {
            res.json({ success: true, message: 'Login successful!' });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Verify nahi ho paya' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Bharat AI server chal raha hai: http://localhost:${PORT}`);
});
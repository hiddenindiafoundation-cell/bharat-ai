const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const otpStore = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(email) {
    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { otp, expiry });

    const mailOptions = {
        from: `"Bharat AI" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Bharat AI - Aapka OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ff9933, #138808); border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">🇮🇳 Bharat AI</h1>
                </div>
                <div style="padding: 30px 20px; background: white; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333;">Aapka OTP Code</h2>
                    <p style="color: #666;">Bharat AI me login karne ke liye ye code use karo:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 15px 30px; background: #f0f0f0; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff9933;">
                            ${otp}
                        </div>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">Ye code 5 minute tak valid hai.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP bheja: ${email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return { success: false, error: error.message };
    }
}

function verifyOTP(email, userOTP) {
    const record = otpStore.get(email);

    if (!record) {
        return { success: false, error: 'OTP nahi mila. Dobara bhejo.' };
    }
    if (Date.now() > record.expiry) {
        otpStore.delete(email);
        return { success: false, error: 'OTP expire ho gaya.' };
    }
    if (record.otp !== userOTP) {
        return { success: false, error: 'Galat OTP.' };
    }

    otpStore.delete(email);
    return { success: true };
}

module.exports = { sendOTP, verifyOTP };
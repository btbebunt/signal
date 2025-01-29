const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json()); // JSON 요청 본문 파싱

const TELEGRAM_BOT_TOKEN = '7878265469:AAH8TxZeYpbsaox9KyhysyodRHvrrtPzcTQ';
const CHAT_ID = '-4671349329';

// 텔레그램 메시지 포맷 함수
function createTelegramMessage(tradeData) {
    return `
📊 *New Trade Alert* 📊
┌───────────────
│ ▪ *Type*: ${tradeData.type || 'N/A'}
│ ▪ *Symbol*: ${tradeData.symbol || 'N/A'}
│ ▪ *Volume*: ${tradeData.volume?.toFixed(2) || 0} lots
│ ▪ *Price*: ${tradeData.price?.toFixed(5) || 0}
│ ▪ *Profit*: $${tradeData.profit?.toFixed(2) || 0}
└───────────────
`;
}

// 텔레그램 알림 전송 함수
async function sendTelegramNotification(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown' // Markdown 형식 지원
        });
    } catch (error) {
        console.error('Telegram notification failed:', error.response?.data || error.message);
        throw error;
    }
}

// 거래 데이터 처리 엔드포인트
app.post('/trade', async (req, res) => {
    console.log('Received request:', req.body); // 요청 로그

    // 필수 필드 확인
    const requiredFields = ['type', 'symbol', 'volume', 'price', 'profit'];
    if (!requiredFields.every(field => field in req.body)) {
        return res.status(400).json({ error: 'Invalid trade data structure' });
    }

    try {
        // 텔레그램 메시지 생성 및 전송
        const message = createTelegramMessage(req.body);
        await sendTelegramNotification(message);

        // 성공 응답
        res.json({ status: 'success', message: 'Trade data received and Telegram notification sent.' });
    } catch (error) {
        console.error('Error processing trade data:', error.stack);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
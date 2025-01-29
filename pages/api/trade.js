import axios from 'axios';

// 텔레그램 봇 설정
const TELEGRAM_BOT_TOKEN = '7878265469:AAH8TxZeYpbsaox9KyhysyodRHvrrtPzcTQ';
const CHAT_ID = '-4732207448';

// 텔레그램 메시지 포맷 함수
function createTelegramMessage(tradeData) {
    return `
📊 *New Trade Alert* 📊
┌───────────────
│ ▪ *Order*: ${tradeData.order || 'N/A'}
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
            parse_mode: 'Markdown', // Markdown 형식 지원
        });
    } catch (error) {
        console.error('Telegram notification failed:', error.response?.data || error.message);
        throw error;
    }
}

// Vercel API 핸들러
export default async function handler(req, res) {
    // CORS 설정: 모든 도메인에서 접근을 허용
    res.setHeader('Access-Control-Allow-Origin', '*');  // 모든 도메인에서 접근 허용
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');  // 허용할 HTTP 메서드
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');  // 허용할 헤더

    // OPTIONS 메서드 처리 (CORS 요청을 위해)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('req.method => ', req.method);
    console.log('req.body => ', req.body);
    
    if (req.method == 'POST') {
        console.log('Received request:', req.body); // 요청 로그

        // 필수 필드 확인
        const requiredFields = ['order', 'type', 'symbol', 'volume', 'price', 'profit'];
        if (!requiredFields.every(field => field in req.body)) {
            return res.status(400).json({ error: 'Invalid trade data structure' });
        }

        try {
            // 텔레그램 메시지 생성 및 전송
            const message = createTelegramMessage(req.body);
            await sendTelegramNotification(message);

            // 성공 응답
            return res.json({ status: 'success', message: 'Trade data received and Telegram notification sent.' });
        } catch (error) {
            console.error('Error processing trade data:', error.stack);
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

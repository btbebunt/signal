import axios from 'axios';
import { Client } from '@notionhq/client';

// Notion 설정
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DB_ID = '18bef7853245804aaf51c8cf80136722';

// 텔레그램 메시지 포맷 함수
const createMessage = (data) => {
  let msg = `📊 *${data.action.toUpperCase()} Order* 📊\n`;
  msg += `┌───────────────\n`;
  
  // 액션별 메시지 구성
  switch(data.action) {
    case 'open':
      msg += `│ ▪ Order: #${data.order}\n`;
      msg += `│ ▪ Symbol: ${data.symbol}\n`;
      msg += `│ ▪ Volume: ${data.volume.toFixed(2)} lots\n`;
      msg += `│ ▪ Price: ${data.price.toFixed(5)}\n`;
      msg += `│ ▪ SL: ${data.sl?.toFixed(5) || 'None'}\n`;
      msg += `│ ▪ TP: ${data.tp?.toFixed(5) || 'None'}\n`;
      break;
      
    case 'update':
      msg += `│ ▪ Order: #${data.order}\n`;
      msg += `│ ▪ New SL: ${data.sl?.toFixed(5) || 'None'}\n`;
      msg += `│ ▪ New TP: ${data.tp?.toFixed(5) || 'None'}\n`;
      break;
      
    case 'close':
      msg += `│ ▪ Order: #${data.order}\n`;
      msg += `│ ▪ Profit: $${data.profit.toFixed(2)}\n`;
      break;
  }
  
  msg += `│ ▪ Balance: $${data.balance.toFixed(2)}\n`;
  msg += `└───────────────`;
  return msg;
};

// Notion 데이터베이스 업데이트
const updateNotion = async (data) => {
  const properties = {
    'Order ID': { number: data.order },
    'Symbol': { rich_text: [{ text: { content: data.symbol || '' }}] },
    'Action': { select: { name: data.action }},
    'Balance': { number: data.balance },
    'Profit': { number: data.profit || 0 },
    'SL': { number: data.sl || 0 },
    'TP': { number: data.tp || 0 },
  };

  await notion.pages.create({
    parent: { database_id: NOTION_DB_ID },
    properties
  });
};

// 메인 핸들러
export default async (req, res) => {
  try {
    const { action, order, chat_id, ...rest } = req.body;
    
    // 1. 텔레그램 메시지 전송
    const message = createMessage(req.body);
    const tgResponse = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id,
        text: message,
        parse_mode: 'Markdown',
        reply_to_message_id: action === 'open' ? undefined : rest.parent_message_id
      }
    );
    
    // 2. Notion 업데이트
    await updateNotion({
      ...req.body,
      telegram_msg_id: tgResponse.data.result.message_id
    });

    // 3. 메시지 ID 반환 (오픈 액션 시)
    res.status(200).json({
      message_id: tgResponse.data.result.message_id
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
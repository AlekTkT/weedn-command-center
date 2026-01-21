import { NextRequest, NextResponse } from 'next/server';

// POST /api/twilio/sms - Twilio SMS/WhatsApp Webhook for BIJAN PARIS
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const from = String(formData.get('From') || '');
  const to = String(formData.get('To') || '');
  const body = String(formData.get('Body') || '');
  const messageSid = String(formData.get('MessageSid') || '');
  const numMedia = parseInt(String(formData.get('NumMedia') || '0'));

  // Detect WhatsApp
  const isWhatsApp = from.startsWith('whatsapp:') || to.startsWith('whatsapp:');
  const channel = isWhatsApp ? 'whatsapp' : 'sms';
  const cleanFrom = from.replace('whatsapp:', '');
  const cleanTo = to.replace('whatsapp:', '');

  // Log message to Supabase
  await logMessageToSupabase({
    message_sid: messageSid,
    channel,
    from_number: cleanFrom,
    to_number: cleanTo,
    body,
    num_media: numMedia,
  });

  // Forward SMS to Alex
  await forwardToAlex({
    from: cleanFrom,
    body,
    channel,
  });

  // Return empty TwiML (no auto-reply)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

async function logMessageToSupabase(data: {
  message_sid: string;
  channel: string;
  from_number: string;
  to_number: string;
  body: string;
  num_media: number;
}) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cmgpflxqunkrrbndtnne.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3BmbHhxdW5rcnJibmR0bm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTMsImV4cCI6MjA4NDM3NDc5M30.tgF84dpOJv3h9zyDpxMr72wbqM46a_MbBu3uqQDPwVY';

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bijan_messages`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        message_sid: data.message_sid,
        channel: data.channel,
        direction: 'incoming',
        from_number: data.from_number,
        to_number: data.to_number,
        body: data.body,
        num_media: data.num_media,
        received_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error logging message to Supabase:', error);
  }
}

async function forwardToAlex(data: { from: string; body: string; channel: string }) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('Missing Twilio credentials');
    return;
  }

  const message = `BIJAN ${data.channel.toUpperCase()}\nDe: ${data.from}\n\n${data.body.substring(0, 1400)}`;

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_PHONE_NUMBER || '+33939035822',
        To: process.env.ALEX_PHONE_NUMBER || '+33609525411',
        Body: message,
      }),
    });
  } catch (error) {
    console.error('Error forwarding to Alex:', error);
  }
}

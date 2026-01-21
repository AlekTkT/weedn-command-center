import { NextRequest, NextResponse } from 'next/server';

// POST /api/twilio/recording - Twilio Recording Status Callback
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const recordingUrl = formData.get('RecordingUrl') || '';
  const recordingSid = formData.get('RecordingSid') || '';
  const callSid = formData.get('CallSid') || '';
  const recordingDuration = formData.get('RecordingDuration') || '';
  const transcriptionText = formData.get('TranscriptionText') || '';

  // Update call record in Supabase with recording info
  await updateCallWithRecording({
    call_sid: String(callSid),
    recording_url: String(recordingUrl),
    recording_sid: String(recordingSid),
    recording_duration: parseInt(String(recordingDuration)) || 0,
    transcription_text: String(transcriptionText) || null,
  });

  // Send notification to Alex about new voicemail
  await notifyAlex({
    type: 'voicemail',
    from: formData.get('From') as string,
    recording_url: String(recordingUrl),
    duration: parseInt(String(recordingDuration)) || 0,
    transcription: String(transcriptionText) || null,
  });

  return new NextResponse('OK', { status: 200 });
}

async function updateCallWithRecording(data: {
  call_sid: string;
  recording_url: string;
  recording_sid: string;
  recording_duration: number;
  transcription_text: string | null;
}) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cmgpflxqunkrrbndtnne.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3BmbHhxdW5rcnJibmR0bm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTMsImV4cCI6MjA4NDM3NDc5M30.tgF84dpOJv3h9zyDpxMr72wbqM46a_MbBu3uqQDPwVY';

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bijan_calls?call_sid=eq.${data.call_sid}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        recording_url: data.recording_url,
        recording_sid: data.recording_sid,
        recording_duration: data.recording_duration,
        transcription_text: data.transcription_text,
      }),
    });
  } catch (error) {
    console.error('Error updating call with recording:', error);
  }
}

async function notifyAlex(data: {
  type: string;
  from: string;
  recording_url: string;
  duration: number;
  transcription: string | null;
}) {
  // Send SMS notification to Alex via Twilio
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error('Missing Twilio credentials');
    return;
  }

  const message = `BIJAN Voicemail\nDe: ${data.from}\nDuree: ${data.duration}s\n${data.transcription ? 'Transcription: ' + data.transcription.substring(0, 100) : ''}\n${data.recording_url}`;

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
        Body: message.substring(0, 1600),
      }),
    });
  } catch (error) {
    console.error('Error notifying Alex:', error);
  }
}

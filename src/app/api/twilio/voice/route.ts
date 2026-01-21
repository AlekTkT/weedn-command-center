import { NextRequest, NextResponse } from 'next/server';

// POST /api/twilio/voice - Twilio Voice Webhook for BIJAN PARIS
// Transfers incoming calls to Alex's phone and records voicemails
export async function POST(request: NextRequest) {
  // Parse Twilio webhook data
  const formData = await request.formData();
  const from = formData.get('From') || '';
  const callSid = formData.get('CallSid') || '';
  const callStatus = formData.get('CallStatus') || '';
  const callerName = formData.get('CallerName') || '';

  // Log call to Supabase (fire and forget)
  logCallToSupabase({
    call_sid: String(callSid),
    from_number: String(from),
    to_number: '+33939035822',
    call_status: String(callStatus),
    caller_name: String(callerName),
  }).catch(console.error);

  // Return TwiML to transfer call to Alex
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="alice">Appel BIJAN PARIS. Transfert en cours.</Say>
  <Dial callerId="+33939035822" timeout="30">
    <Number>+33609525411</Number>
  </Dial>
  <Say language="fr-FR" voice="alice">Pas de réponse. Veuillez laisser un message après le bip.</Say>
  <Record maxLength="120" playBeep="true" transcribe="true" recordingStatusCallback="/api/twilio/recording"/>
  <Say language="fr-FR" voice="alice">Merci. Au revoir.</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

// Also handle GET for Twilio webhook verification
export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="alice">Webhook BIJAN PARIS actif.</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

// Log call to Supabase
async function logCallToSupabase(data: {
  call_sid: string;
  from_number: string;
  to_number: string;
  call_status: string;
  caller_name: string;
}) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cmgpflxqunkrrbndtnne.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3BmbHhxdW5rcnJibmR0bm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTMsImV4cCI6MjA4NDM3NDc5M30.tgF84dpOJv3h9zyDpxMr72wbqM46a_MbBu3uqQDPwVY';

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bijan_calls`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        call_sid: data.call_sid,
        from_number: data.from_number,
        to_number: data.to_number,
        call_status: data.call_status,
        caller_name: data.caller_name || null,
        direction: 'incoming',
        received_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error logging call to Supabase:', error);
  }
}

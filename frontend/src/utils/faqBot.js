// A small, fully offline rule-based FAQ engine for the ClinicFlow Assistant.
// No external API or key required — matches the user's message against a
// list of intents using keyword scoring, and returns the best response.
// Each intent can also be role-specific (patient vs staff).

const INTENTS = [
  {
    id: 'wait-time',
    keywords: ['wait', 'how long', 'eta', 'time left', 'minutes', 'when will'],
    roles: ['patient', 'staff'],
    answer: (ctx) => {
      if (ctx.role === 'patient') {
        if (!ctx.myTokenNumber) return "You haven't linked a token yet — link one from the Waiting Room to see your live wait estimate.";
        if (ctx.isBeingSeen) return "You're being called right now — please head to the consultation room!";
        if (ctx.myEntry) return `You're about ${ctx.myEntry.estimatedWaitMinutes} minute(s) away, with ${ctx.myEntry.peopleAhead} people ahead of you.`;
        return "I couldn't find your token in the live queue right now — try refreshing the Waiting Room.";
      }
      return `Average consultation time is currently set to ${ctx.avgConsultationTime ?? '—'} minute(s). You can change it from Front Desk.`;
    }
  },
  {
    id: 'my-token',
    keywords: ['my token', 'token number', 'what number', 'which token'],
    roles: ['patient'],
    answer: (ctx) => ctx.myTokenNumber
      ? `Your token is #${ctx.myTokenNumber}.`
      : "You haven't linked a token yet. Ask reception for your token number, then enter it on the Waiting Room page."
  },
  {
    id: 'now-serving',
    keywords: ['now serving', 'whose turn', "who's turn", 'current token', 'being called', 'now calling'],
    roles: ['patient', 'staff'],
    answer: (ctx) => ctx.current
      ? `Token #${ctx.current.tokenNumber} (${ctx.current.patientName}) is currently being served.`
      : 'No one is currently being seen.'
  },
  {
    id: 'checkout',
    keywords: ['check out', 'checkout', 'finish visit', 'done with visit', 'mark complete'],
    roles: ['patient'],
    answer: () => 'Go to "Check Out" in the sidebar and tap "Check out now" once your visit is complete — it closes your visit instantly, no paperwork needed.'
  },
  {
    id: 'link-token',
    keywords: ['link token', 'how do i link', 'enter token', 'add token'],
    roles: ['patient'],
    answer: () => 'On the Waiting Room page, enter the token number reception gave you into the "Link your token" box and tap "Link token".'
  },
  {
    id: 'chat-staff',
    keywords: ['talk to nurse', 'talk to staff', 'message reception', 'contact staff', 'speak to someone'],
    roles: ['patient'],
    answer: () => 'You can message the front desk directly from "Chat with Staff" in the sidebar — they\'ll see it instantly.'
  },
  {
    id: 'add-patient',
    keywords: ['add patient', 'new patient', 'issue token', 'create token'],
    roles: ['staff'],
    answer: () => 'Go to Front Desk and use the "Add patient" form — entering a name issues the next token number automatically.'
  },
  {
    id: 'call-next',
    keywords: ['call next', 'next patient', 'move queue', 'advance queue'],
    roles: ['staff'],
    answer: () => 'Use the "Call next" button on Front Desk — it marks the current patient as done and calls the next person waiting, with an automatic alert sent to them.'
  },
  {
    id: 'settings',
    keywords: ['change theme', 'dark mode', 'sound off', 'notification sound', 'settings'],
    roles: ['patient', 'staff'],
    answer: () => 'Open Settings from the sidebar — you can change theme, toggle sound alerts, edit your profile, and change your password there.'
  },
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'],
    roles: ['patient', 'staff'],
    answer: (ctx) => `Hi${ctx.displayName ? ' ' + ctx.displayName : ''}! I'm the ClinicFlow Assistant. Ask me about wait times, your token, or how to use any feature.`
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank you', 'appreciate'],
    roles: ['patient', 'staff'],
    answer: () => "You're welcome! Let me know if there's anything else."
  },
];

const FALLBACK = "I'm not sure about that one — try asking about wait times, your token, or checking out. For anything else, message staff directly from Chat.";

function score(message, keywords) {
  const lower = message.toLowerCase();
  let s = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) s += kw.split(' ').length; // multi-word matches score higher
  }
  return s;
}

export function getBotReply(message, ctx) {
  const role = ctx.role || 'patient';
  let best = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    if (!intent.roles.includes(role)) continue;
    const s = score(message, intent.keywords);
    if (s > bestScore) { bestScore = s; best = intent; }
  }

  if (!best) return FALLBACK;
  return best.answer({ ...ctx, role });
}

export const SUGGESTED_PROMPTS = {
  patient: ['How long is my wait?', "What's my token number?", 'How do I check out?', 'Who is being called now?'],
  staff: ['How do I call the next patient?', 'How do I add a patient?', 'What is the average consult time?']
};

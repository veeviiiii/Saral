// Turn a spoken phrase into an action. The app does two things — Samjhao
// (explain a paper) and Sikhao (show me how) — so we route to whichever the
// user asked for, jumping straight to a specific task when an app is named.
//
// Returns: { type: 'samjhao' } | { type: 'flow', flowId } | { type: 'sikhao' }
// Indic speech recognition is patchy, so this is keyword-based and forgiving.

const SAMJHAO_HINTS = [
  'samjhao', 'समझाओ', 'समजावा', 'বোঝান', 'samaj', 'समझ', 'समज', 'বোঝ',
  'explain', 'read', 'padh', 'पढ', 'পড়',
  'bill', 'बिल', 'বিল', 'notice', 'नोटिस', 'নোটিশ',
  'paper', 'kagaz', 'kagad', 'कागज', 'कागद', 'কাগজ',
  'document', 'दस्तावेज', 'photo', 'फोटो', 'ছবি', 'scan this', 'what is written', 'kya likha',
]

// Distinctive keywords → a specific walkthrough (avoid short ambiguous tokens).
const FLOW_HINTS = {
  upi_phonepe: ['phonepe', 'phone pe', 'फोनपे', 'फोन पे'],
  upi_gpay: ['google pay', 'gpay', 'g pay', 'गूगल पे', 'গুগল পে'],
  upi_paytm: ['paytm', 'पेटीएम', 'পেটিএম'],
  upi_amazonpay: ['amazon', 'अमेज़न', 'অ্যামাজন'],
  upi_bhim: ['bhim', 'भीम', 'ভীম'],
  recharge_jio: ['jio', 'जियो', 'জিও'],
  recharge_airtel: ['airtel', 'एयरटेल', 'এয়ারটেল'],
  recharge_vi: ['vodafone', 'वोडाफोन', 'ভোডাফোন'],
  recharge_bsnl: ['bsnl', 'बीएसएनएल', 'বিএসএনএল'],
  gas_indane: ['indane', 'इंडेन', 'ইন্ডেন'],
  gas_hp: ['hp gas', 'एचपी गैस'],
  gas_bharat: ['bharat gas', 'bharatgas', 'भारत गैस', 'ভারত গ্যাস'],
}

// Clear "show me how to do a task" words → the Sikhao hub.
const SIKHAO_HINTS = [
  'recharge', 'रिचार्ज', 'রিচার্জ', 'gas', 'गैस', 'গ্যাস', 'cylinder', 'सिलेंडर', 'সিলিন্ডার',
  'form', 'फॉर्म', 'ফর্ম', 'paise', 'पैसे', 'টাকা', 'money', 'rupay', 'रुपये',
  'sikhao', 'सिखाओ', 'शिकवा', 'শেখান', 'kaise', 'कैसे', 'कसे', 'কীভাবে', 'how to', 'how do',
]

function includesAny(text, words) {
  return words.some((w) => text.includes(w.toLowerCase()))
}

export function interpretVoice(transcript) {
  const t = (transcript || '').toLowerCase().trim()
  if (!t) return { type: 'sikhao' }

  if (includesAny(t, SAMJHAO_HINTS)) return { type: 'samjhao' }

  for (const [flowId, keys] of Object.entries(FLOW_HINTS)) {
    if (includesAny(t, keys)) return { type: 'flow', flowId }
  }

  if (includesAny(t, SIKHAO_HINTS)) return { type: 'sikhao' }

  // A genuine free-form question → the Gemini-powered "Ask Saral".
  return { type: 'ask' }
}

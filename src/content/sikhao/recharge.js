// "Recharge" flows — one per provider. Each branches between the provider's
// own app and a UPI app. Shared tail (pick plan → pay → confirm → fail) keeps
// the money-handling wording identical everywhere.

// ── helpers ────────────────────────────────────────────────────────────
const findNumberStep = (code) => ({
  text: {
    en: `If you don't know your own number, dial ${code} and press call — your number appears on the screen.`,
    hi: `अगर आपको अपना नंबर नहीं पता, ${code} डायल करके कॉल दबाएँ — आपका नंबर स्क्रीन पर आ जाएगा।`,
    mr: `तुम्हाला तुमचा नंबर माहीत नसेल, ${code} डायल करून कॉल दाबा — तुमचा नंबर स्क्रीनवर येईल.`,
    bn: `আপনি নিজের নম্বর না জানলে, ${code} ডায়াল করে কল চাপুন — আপনার নম্বর স্ক্রিনে আসবে।`,
  },
  illustrationHint: `Phone dial pad showing ${code} with the green call button.`,
  reassurance: {
    en: 'Or look at the small plastic SIM holder you got when you bought the SIM.',
    hi: 'या SIM खरीदते समय मिले छोटे प्लास्टिक SIM होल्डर पर देखें।',
    mr: 'किंवा SIM घेताना मिळालेल्या छोट्या प्लास्टिक SIM होल्डरवर पाहा.',
    bn: 'অথবা SIM কেনার সময় পাওয়া ছোট প্লাস্টিক SIM হোল্ডারে দেখুন।',
  },
})

const checkExpiryStep = (app) => ({
  text: {
    en: `To see your current plan and when it ends, open the ${app} app — the expiry date shows at the top of the home screen.`,
    hi: `अपना मौजूदा प्लान और कब खत्म होगा देखने के लिए ${app} ऐप खोलें — खत्म होने की तारीख होम स्क्रीन पर ऊपर दिखती है।`,
    mr: `तुमचा सध्याचा प्लॅन आणि तो कधी संपेल हे पाहण्यासाठी ${app} ॲप उघडा — संपण्याची तारीख होम स्क्रीनवर वर दिसते.`,
    bn: `আপনার বর্তমান প্ল্যান ও কবে শেষ হবে দেখতে ${app} অ্যাপ খুলুন — মেয়াদের তারিখ হোম স্ক্রিনের উপরে দেখায়।`,
  },
  illustrationHint: `${app} home screen with the plan expiry date highlighted at the top.`,
})

const checkDigits = {
  en: 'Check every digit — the recharge goes to the number you type.',
  hi: 'हर अंक जाँचें — रिचार्ज उसी नंबर पर होगा जो आप टाइप करेंगे।',
  mr: 'प्रत्येक अंक तपासा — तुम्ही टाकाल त्याच नंबरवर रिचार्ज होईल.',
  bn: 'প্রতিটি সংখ্যা দেখুন — আপনি যে নম্বর লিখবেন সেখানেই রিচার্জ হবে।',
}

const ownAppBranch = (app) => [
  {
    text: {
      en: `Open the ${app} app.`,
      hi: `${app} ऐप खोलें।`,
      mr: `${app} ॲप उघडा.`,
      bn: `${app} অ্যাপ খুলুন।`,
    },
    illustrationHint: `Phone home screen with the ${app} icon circled.`,
  },
  {
    text: {
      en: 'If it asks you to log in, type your mobile number and tap Continue.',
      hi: 'अगर लॉग इन माँगे, अपना मोबाइल नंबर डालें और Continue दबाएँ।',
      mr: 'लॉग इन मागितल्यास, तुमचा मोबाइल नंबर टाका आणि Continue दाबा.',
      bn: 'লগ ইন চাইলে, আপনার মোবাইল নম্বর দিন এবং Continue চাপুন।',
    },
    illustrationHint: 'Login screen with a phone number field.',
  },
  {
    text: {
      en: 'Type the 6-digit code (OTP) it sends to your phone by SMS.',
      hi: 'फोन पर SMS से आया 6 अंकों का कोड (OTP) डालें।',
      mr: 'फोनवर SMS ने आलेला 6 अंकी कोड (OTP) टाका.',
      bn: 'ফোনে SMS-এ আসা ৬ সংখ্যার কোড (OTP) দিন।',
    },
    illustrationHint: 'An OTP box being filled in.',
    warningHint: {
      en: 'Never tell this OTP to anyone on a phone call.',
      hi: 'यह OTP फोन कॉल पर किसी को न बताएं।',
      mr: 'हा OTP फोन कॉलवर कोणालाही सांगू नका.',
      bn: 'এই OTP ফোন কলে কাউকে বলবেন না।',
    },
  },
  {
    text: {
      en: 'On the home screen tap "Recharge". Your own number is already filled in.',
      hi: 'होम स्क्रीन पर "Recharge" दबाएँ। आपका नंबर पहले से भरा होता है।',
      mr: 'होम स्क्रीनवर "Recharge" दाबा. तुमचा नंबर आधीच भरलेला असतो.',
      bn: 'হোম স্ক্রিনে "Recharge" চাপুন। আপনার নম্বর আগে থেকেই বসানো থাকে।',
    },
    illustrationHint: 'A Recharge button on the app home with the number pre-filled.',
  },
]

const viaUpiBranch = (upi) => [
  {
    text: {
      en: `Open ${upi}.`,
      hi: `${upi} खोलें।`,
      mr: `${upi} उघडा.`,
      bn: `${upi} খুলুন।`,
    },
    illustrationHint: `Phone home screen with the ${upi} icon circled.`,
  },
  {
    text: {
      en: 'Tap "Recharge & Pay Bills".',
      hi: '"Recharge & Pay Bills" दबाएँ।',
      mr: '"Recharge & Pay Bills" दाबा.',
      bn: '"Recharge & Pay Bills" চাপুন।',
    },
    illustrationHint: 'The Recharge & Pay Bills tile on the home screen.',
  },
  {
    text: {
      en: 'Tap "Mobile Recharge".',
      hi: '"Mobile Recharge" दबाएँ।',
      mr: '"Mobile Recharge" दाबा.',
      bn: '"Mobile Recharge" চাপুন।',
    },
    illustrationHint: 'A grid of bill types with Mobile Recharge highlighted.',
  },
  {
    text: {
      en: 'Type your 10-digit number. Your operator is found automatically.',
      hi: 'अपना 10 अंकों का नंबर टाइप करें। आपका ऑपरेटर अपने आप पता चल जाता है।',
      mr: 'तुमचा 10 अंकी नंबर टाका. तुमचा ऑपरेटर आपोआप समजतो.',
      bn: 'আপনার ১০ সংখ্যার নম্বর লিখুন। আপনার অপারেটর নিজে থেকেই বেরিয়ে আসে।',
    },
    illustrationHint: 'Number entry with the operator logo auto-detected below.',
    warningHint: checkDigits,
  },
]

// ── shared tail: pick plan → pay → confirmation SMS → failure ───────────
const pickPlanStep = {
  text: {
    en: 'Plans are shown as rows. Each shows the price in ₹, how many days it lasts, data per day, and free calls. Tap the plan you want.',
    hi: 'प्लान पंक्तियों में दिखते हैं। हर एक में ₹ में कीमत, कितने दिन चलेगा, रोज़ का डेटा, और मुफ़्त कॉल दिखती है। अपना प्लान चुनें।',
    mr: 'प्लॅन ओळींमध्ये दिसतात. प्रत्येकात ₹ मधील किंमत, किती दिवस चालेल, रोजचा डेटा, आणि मोफत कॉल दिसतात. तुमचा प्लॅन निवडा.',
    bn: 'প্ল্যান সারিতে দেখায়। প্রতিটিতে ₹-এ দাম, কত দিন চলবে, প্রতিদিনের ডেটা, আর ফ্রি কল দেখায়। আপনার প্ল্যান বেছে নিন।',
  },
  illustrationHint: 'Plan list with columns labelled: price, validity (days), data/day, calls.',
  warningHint: {
    en: 'A higher price is not always better — choose the validity (days) you actually need.',
    hi: 'ज़्यादा कीमत हमेशा बेहतर नहीं — उतने ही दिन चुनें जितने आपको चाहिए।',
    mr: 'जास्त किंमत नेहमी चांगली नसते — तुम्हाला हवे तेवढेच दिवस निवडा.',
    bn: 'বেশি দাম সবসময় ভালো নয় — আপনার যত দিন দরকার ততই বেছে নিন।',
  },
  reassurance: {
    en: 'Scroll up and down slowly to compare. Nothing is charged yet.',
    hi: 'तुलना के लिए धीरे-धीरे ऊपर-नीचे करें। अभी कुछ नहीं कटता।',
    mr: 'तुलना करण्यासाठी सावकाश वर-खाली करा. अजून काही कापले जात नाही.',
    bn: 'তুলনা করতে ধীরে ধীরে উপর-নিচ করুন। এখনও কিছু কাটা হয় না।',
  },
}

const proceedPayStep = {
  text: {
    en: 'Tap "Proceed to Pay".',
    hi: '"Proceed to Pay" दबाएँ।',
    mr: '"Proceed to Pay" दाबा.',
    bn: '"Proceed to Pay" চাপুন।',
  },
  illustrationHint: 'A Proceed to Pay button at the bottom.',
}

const choosePayMethodStep = {
  text: {
    en: 'Choose your UPI app or bank from the list.',
    hi: 'सूची से अपना UPI ऐप या बैंक चुनें।',
    mr: 'यादीतून तुमचे UPI ॲप किंवा बँक निवडा.',
    bn: 'তালিকা থেকে আপনার UPI অ্যাপ বা ব্যাঙ্ক বেছে নিন।',
  },
  illustrationHint: 'A list of UPI apps and banks.',
  warningHint: {
    en: 'Check the amount shown matches the plan price.',
    hi: 'जाँचें कि दिखाई गई रकम प्लान की कीमत के बराबर है।',
    mr: 'दाखवलेली रक्कम प्लॅनच्या किमतीइतकी आहे का तपासा.',
    bn: 'দেখানো টাকা প্ল্যানের দামের সঙ্গে মেলে কিনা দেখুন।',
  },
}

const enterPinStep = {
  text: {
    en: 'Enter your UPI PIN to pay.',
    hi: 'भुगतान के लिए अपना UPI PIN डालें।',
    mr: 'पैसे देण्यासाठी तुमचा UPI PIN टाका.',
    bn: 'টাকা দিতে আপনার UPI PIN দিন।',
  },
  illustrationHint: 'A secure UPI PIN keypad.',
  image: '/walkthrough/pin-keypad.svg',
  reassurance: {
    en: 'This is the same safe UPI PIN as sending money. Saral never sees it.',
    hi: 'यह वही सुरक्षित UPI PIN है जो पैसे भेजने में लगता है। सरल इसे कभी नहीं देखता।',
    mr: 'हा तोच सुरक्षित UPI PIN आहे जो पैसे पाठवताना लागतो. सरल तो कधीच पाहत नाही.',
    bn: 'এটি টাকা পাঠানোর মতোই নিরাপদ UPI PIN। সরল কখনও তা দেখে না।',
  },
}

const confirmSmsStep = {
  text: {
    en: "After paying, you will get an SMS like: 'Recharge of ₹239 successful. Valid till 12-08-2026.'",
    hi: "भुगतान के बाद ऐसा SMS आएगा: 'Recharge of ₹239 successful. Valid till 12-08-2026.'",
    mr: "पैसे दिल्यावर असा SMS येईल: 'Recharge of ₹239 successful. Valid till 12-08-2026.'",
    bn: "টাকা দেওয়ার পর এমন SMS আসবে: 'Recharge of ₹239 successful. Valid till 12-08-2026.'",
  },
  illustrationHint: 'An SMS notification confirming the recharge with a validity date.',
  reassurance: {
    en: "That SMS is your proof. You don't need to do anything else.",
    hi: 'वह SMS आपका सबूत है। और कुछ करने की ज़रूरत नहीं।',
    mr: 'तो SMS तुमचा पुरावा आहे. आणखी काही करण्याची गरज नाही.',
    bn: 'সেই SMS আপনার প্রমাণ। আর কিছু করার দরকার নেই।',
  },
}

const rechargeFailStep = {
  text: {
    en: "If it says 'Failed', the recharge did not happen and the money usually comes back in 1–2 days.",
    hi: "अगर 'Failed' दिखे, तो रिचार्ज नहीं हुआ और पैसा आमतौर पर 1–2 दिन में वापस आ जाता है।",
    mr: "'Failed' दिसल्यास, रिचार्ज झाला नाही आणि पैसे साधारणपणे 1–2 दिवसांत परत येतात.",
    bn: "'Failed' দেখালে, রিচার্জ হয়নি এবং টাকা সাধারণত ১–২ দিনে ফেরত আসে।",
  },
  illustrationHint: 'A red Failed message with a calm clock icon.',
  warningHint: {
    en: 'Do not recharge again right away. Check your balance or wait for an SMS first.',
    hi: 'तुरंत दोबारा रिचार्ज न करें। पहले बैलेंस जाँचें या SMS का इंतज़ार करें।',
    mr: 'लगेच पुन्हा रिचार्ज करू नका. आधी बॅलन्स तपासा किंवा SMS ची वाट पाहा.',
    bn: 'সঙ্গে সঙ্গে আবার রিচার্জ করবেন না। আগে ব্যালেন্স দেখুন বা SMS-এর অপেক্ষা করুন।',
  },
}

const RECHARGE_TAIL = [
  pickPlanStep,
  proceedPayStep,
  choosePayMethodStep,
  enterPinStep,
  confirmSmsStep,
  rechargeFailStep,
]

const rechargeChoice = (own, upi) => ({
  choice: true,
  text: {
    en: `How do you want to recharge? In the ${own} app, or through ${upi}?`,
    hi: `आप कैसे रिचार्ज करना चाहते हैं? ${own} ऐप में या ${upi} के ज़रिए?`,
    mr: `तुम्हाला कसे रिचार्ज करायचे आहे? ${own} ॲपमध्ये की ${upi} द्वारे?`,
    bn: `আপনি কীভাবে রিচার্জ করতে চান? ${own} অ্যাপে নাকি ${upi} দিয়ে?`,
  },
  illustrationHint: `Two buttons: "${own} app" and "${upi}".`,
  options: [
    { label: { en: `In the ${own} app`, hi: `${own} ऐप में`, mr: `${own} ॲपमध्ये`, bn: `${own} অ্যাপে` }, branch: 'own' },
    { label: { en: `Through ${upi}`, hi: `${upi} के ज़रिए`, mr: `${upi} द्वारे`, bn: `${upi} দিয়ে` }, branch: 'via' },
  ],
  branches: { own: ownAppBranch(own), via: viaUpiBranch(upi) },
})

export const RECHARGE_FLOWS = [
  {
    id: 'recharge_jio',
    app: 'Jio',
    color: '#0A2C8C',
    short: 'Jio',
    title: { en: 'Recharge a Jio number', hi: 'Jio नंबर रिचार्ज करें', mr: 'Jio नंबर रिचार्ज करा', bn: 'Jio নম্বর রিচার্জ করুন' },
    steps: [findNumberStep('*1#'), checkExpiryStep('MyJio'), rechargeChoice('MyJio', 'PhonePe'), ...RECHARGE_TAIL],
  },
  {
    id: 'recharge_airtel',
    app: 'Airtel',
    color: '#E40000',
    short: 'Air',
    title: { en: 'Recharge an Airtel number', hi: 'Airtel नंबर रिचार्ज करें', mr: 'Airtel नंबर रिचार्ज करा', bn: 'Airtel নম্বর রিচার্জ করুন' },
    steps: [findNumberStep('*282#'), checkExpiryStep('Airtel Thanks'), rechargeChoice('Airtel Thanks', 'Google Pay'), ...RECHARGE_TAIL],
  },
  {
    id: 'recharge_vi',
    app: 'Vi',
    color: '#EE2737',
    short: 'Vi',
    title: { en: 'Recharge a Vi number', hi: 'Vi नंबर रिचार्ज करें', mr: 'Vi नंबर रिचार्ज करा', bn: 'Vi নম্বর রিচার্জ করুন' },
    steps: [findNumberStep('*199#'), checkExpiryStep('Vi'), rechargeChoice('Vi', 'Paytm'), ...RECHARGE_TAIL],
  },
  {
    id: 'recharge_bsnl',
    app: 'BSNL',
    color: '#004B87',
    short: 'BS',
    title: { en: 'Recharge a BSNL number', hi: 'BSNL नंबर रिचार्ज करें', mr: 'BSNL नंबर रिचार्ज करा', bn: 'BSNL নম্বর রিচার্জ করুন' },
    steps: [findNumberStep('*222#'), checkExpiryStep('BSNL Selfcare'), rechargeChoice('BSNL Selfcare', 'BHIM'), ...RECHARGE_TAIL],
  },
]

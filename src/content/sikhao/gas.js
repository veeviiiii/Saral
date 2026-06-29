// "Gas Cylinder" flows — Indane / HP / Bharat app booking (shared journey,
// only the app name differs), plus a missed-call flow for basic phones and a
// delivery-status flow.
//
// Step fields: text{4 langs}, illustrationHint (en, for the illustrator),
//              warningHint?{4 langs}, reassurance?{4 langs}.

// ── shared steps for app booking ───────────────────────────────────────
const openAppStep = (app) => ({
  text: {
    en: `Open the ${app} app on your phone.`,
    hi: `अपने फोन में ${app} ऐप खोलें।`,
    mr: `तुमच्या फोनमध्ये ${app} ॲप उघडा.`,
    bn: `আপনার ফোনে ${app} অ্যাপ খুলুন।`,
  },
  illustrationHint: `Phone home screen with the ${app} icon circled.`,
  image: '/walkthrough/open-app.svg',
  reassurance: {
    en: 'Booking gas online is just a few taps. We will go slowly.',
    hi: 'ऑनलाइन गैस बुक करना बस कुछ टैप है। हम धीरे-धीरे चलेंगे।',
    mr: 'ऑनलाइन गॅस बुक करणे म्हणजे फक्त काही टॅप. आपण सावकाश जाऊ.',
    bn: 'অনলাইনে গ্যাস বুক করা মাত্র কয়েকটি ট্যাপ। আমরা ধীরে এগোবো।',
  },
})

const gasLoginNumberStep = {
  text: {
    en: 'Log in with the mobile number registered for your gas connection.',
    hi: 'अपने गैस कनेक्शन से जुड़े मोबाइल नंबर से लॉग इन करें।',
    mr: 'तुमच्या गॅस कनेक्शनशी जोडलेल्या मोबाइल नंबरने लॉग इन करा.',
    bn: 'আপনার গ্যাস সংযোগে নিবন্ধিত মোবাইল নম্বর দিয়ে লগ ইন করুন।',
  },
  illustrationHint: 'Login screen with a mobile number field.',
  image: '/walkthrough/login-phone.svg',
  warningHint: {
    en: 'Use the number linked to your connection, or the app may not find your details.',
    hi: 'वही नंबर डालें जो कनेक्शन से जुड़ा है, वरना ऐप आपकी जानकारी नहीं ढूँढ़ पाएगा।',
    mr: 'कनेक्शनशी जोडलेलाच नंबर टाका, नाहीतर ॲपला तुमची माहिती सापडणार नाही.',
    bn: 'সংযোগে যুক্ত নম্বরই দিন, নাহলে অ্যাপ আপনার তথ্য খুঁজে পাবে না।',
  },
}

const gasLoginOtpStep = {
  text: {
    en: 'Type the 6-digit OTP it sends to that number.',
    hi: 'उस नंबर पर आए 6 अंकों के OTP डालें।',
    mr: 'त्या नंबरवर आलेला 6 अंकी OTP टाका.',
    bn: 'সেই নম্বরে আসা ৬ সংখ্যার OTP দিন।',
  },
  illustrationHint: 'An OTP box being filled in.',
  image: '/walkthrough/otp.svg',
  warningHint: {
    en: 'Never share this OTP with anyone on a call.',
    hi: 'यह OTP कॉल पर किसी को न बताएं।',
    mr: 'हा OTP कॉलवर कोणालाही सांगू नका.',
    bn: 'এই OTP কাউকে কলে দেবেন না।',
  },
}

const bookCylinderStep = {
  text: {
    en: 'On the home screen tap "Book Cylinder" (or "Book Now").',
    hi: 'होम स्क्रीन पर "Book Cylinder" (या "Book Now") दबाएँ।',
    mr: 'होम स्क्रीनवर "Book Cylinder" (किंवा "Book Now") दाबा.',
    bn: 'হোম স্ক্রিনে "Book Cylinder" (বা "Book Now") চাপুন।',
  },
  illustrationHint: 'A large Book Cylinder button on the app home.',
  image: '/walkthrough/tap-button.svg',
}

const checkAddressStep = {
  text: {
    en: 'Check that the delivery address and consumer number shown are yours, then continue.',
    hi: 'जाँचें कि दिखाया गया पता और उपभोक्ता संख्या आपकी है, फिर आगे बढ़ें।',
    mr: 'दाखवलेला पत्ता आणि ग्राहक क्रमांक तुमचा आहे का तपासा, मग पुढे जा.',
    bn: 'দেখানো ঠিকানা ও কনজিউমার নম্বর আপনার কিনা দেখে নিন, তারপর এগিয়ে যান।',
  },
  illustrationHint: 'Address and consumer number shown for confirmation.',
  image: '/walkthrough/details-check.svg',
  reassurance: {
    en: 'These details come from your connection — usually they are already correct.',
    hi: 'ये जानकारी आपके कनेक्शन से आती है — आमतौर पर पहले से सही होती है।',
    mr: 'ही माहिती तुमच्या कनेक्शनमधून येते — सहसा आधीच बरोबर असते.',
    bn: 'এই তথ্য আপনার সংযোগ থেকে আসে — সাধারণত আগে থেকেই ঠিক থাকে।',
  },
}

const confirmBookingStep = {
  text: {
    en: 'Tap "Confirm" (or "Book") to place the booking.',
    hi: 'बुकिंग करने के लिए "Confirm" (या "Book") दबाएँ।',
    mr: 'बुकिंग करण्यासाठी "Confirm" (किंवा "Book") दाबा.',
    bn: 'বুকিং করতে "Confirm" (বা "Book") চাপুন।',
  },
  illustrationHint: 'A Confirm/Book button on the review screen.',
  image: '/walkthrough/tap-button.svg',
}

const gasPaymentChoice = {
  choice: true,
  text: {
    en: 'How would you like to pay? Pay now online, or cash when the cylinder arrives?',
    hi: 'आप कैसे भुगतान करना चाहेंगे? अभी ऑनलाइन, या सिलेंडर आने पर नकद?',
    mr: 'तुम्हाला कसे पैसे द्यायचे आहेत? आता ऑनलाइन, की सिलिंडर आल्यावर रोख?',
    bn: 'আপনি কীভাবে টাকা দিতে চান? এখন অনলাইনে, নাকি সিলিন্ডার এলে নগদে?',
  },
  illustrationHint: 'Two buttons: "Pay now" and "Cash on delivery".',
  image: '/walkthrough/two-options.svg',
  options: [
    { label: { en: 'Pay now', hi: 'अभी भुगतान करें', mr: 'आता पैसे द्या', bn: 'এখন দিন' }, branch: 'paynow' },
    { label: { en: 'Cash on delivery', hi: 'डिलीवरी पर नकद', mr: 'डिलिव्हरीवर रोख', bn: 'ডেলিভারিতে নগদ' }, branch: 'cod' },
  ],
  branches: {
    paynow: [
      {
        text: {
          en: 'Choose "Pay Online".',
          hi: '"Pay Online" चुनें।',
          mr: '"Pay Online" निवडा.',
          bn: '"Pay Online" বেছে নিন।',
        },
        illustrationHint: 'A Pay Online option.',
        image: '/walkthrough/tap-button.svg',
      },
      {
        text: {
          en: 'Pick your UPI app or bank from the list.',
          hi: 'सूची से अपना UPI ऐप या बैंक चुनें।',
          mr: 'यादीतून तुमचे UPI ॲप किंवा बँक निवडा.',
          bn: 'তালিকা থেকে আপনার UPI অ্যাপ বা ব্যাঙ্ক বেছে নিন।',
        },
        illustrationHint: 'A list of UPI apps and banks.',
        image: '/walkthrough/list-select.svg',
      },
      {
        text: {
          en: 'Enter your UPI PIN to pay.',
          hi: 'भुगतान के लिए अपना UPI PIN डालें।',
          mr: 'पैसे देण्यासाठी तुमचा UPI PIN टाका.',
          bn: 'টাকা দিতে আপনার UPI PIN দিন।',
        },
        illustrationHint: 'A secure UPI PIN keypad.',
        image: '/walkthrough/pin-keypad.svg',
        reassurance: {
          en: 'Same safe UPI PIN as before. Saral never sees it.',
          hi: 'पहले जैसा सुरक्षित UPI PIN। सरल इसे कभी नहीं देखता।',
          mr: 'आधीसारखाच सुरक्षित UPI PIN. सरल तो कधीच पाहत नाही.',
          bn: 'আগের মতোই নিরাপদ UPI PIN। সরল কখনও দেখে না।',
        },
      },
    ],
    cod: [
      {
        text: {
          en: 'Choose "Cash on Delivery". You will pay the delivery person when the cylinder arrives.',
          hi: '"Cash on Delivery" चुनें। सिलेंडर आने पर डिलीवरी वाले को पैसे देंगे।',
          mr: '"Cash on Delivery" निवडा. सिलिंडर आल्यावर डिलिव्हरी करणाऱ्याला पैसे द्याल.',
          bn: '"Cash on Delivery" বেছে নিন। সিলিন্ডার এলে ডেলিভারি ব্যক্তিকে টাকা দেবেন।',
        },
        illustrationHint: 'Cash on delivery selected; a delivery person with a cylinder.',
        image: '/walkthrough/cash-delivery.svg',
        warningHint: {
          en: 'Ask for the printed receipt and check the price before paying cash.',
          hi: 'नकद देने से पहले छपी रसीद माँगें और कीमत जाँचें।',
          mr: 'रोख देण्याआधी छापलेली पावती मागा आणि किंमत तपासा.',
          bn: 'নগদ দেওয়ার আগে ছাপানো রসিদ চান এবং দাম দেখুন।',
        },
      },
    ],
  },
}

const gasConfirmStep = {
  text: {
    en: 'You will see a booking number and get a confirmation SMS. Your refill is booked.',
    hi: 'आपको एक बुकिंग नंबर दिखेगा और पुष्टि का SMS आएगा। आपका सिलेंडर बुक हो गया।',
    mr: 'तुम्हाला बुकिंग क्रमांक दिसेल आणि पुष्टीचा SMS येईल. तुमचा सिलिंडर बुक झाला.',
    bn: 'আপনি একটি বুকিং নম্বর দেখবেন আর নিশ্চিতকরণ SMS পাবেন। আপনার রিফিল বুক হয়ে গেছে।',
  },
  illustrationHint: 'Booking confirmed screen with a booking number and SMS.',
  image: '/walkthrough/reference-number.svg',
  reassurance: {
    en: 'Keep that SMS until the cylinder is delivered.',
    hi: 'सिलेंडर मिलने तक वह SMS संभाल कर रखें।',
    mr: 'सिलिंडर मिळेपर्यंत तो SMS जपून ठेवा.',
    bn: 'সিলিন্ডার পৌঁছানো পর্যন্ত সেই SMS রেখে দিন।',
  },
}

const gasDeliveryStep = {
  text: {
    en: 'The cylinder usually comes in 1 to 3 days. You can track it under "Booking History".',
    hi: 'सिलेंडर आमतौर पर 1 से 3 दिन में आता है। आप "Booking History" में देख सकते हैं।',
    mr: 'सिलिंडर साधारणपणे 1 ते 3 दिवसांत येतो. तुम्ही "Booking History" मध्ये पाहू शकता.',
    bn: 'সিলিন্ডার সাধারণত ১ থেকে ৩ দিনে আসে। আপনি "Booking History"-তে দেখতে পারেন।',
  },
  illustrationHint: 'A calm calendar showing 1–3 days with a delivery truck.',
  image: '/walkthrough/delivery.svg',
}

const GAS_TAIL = [gasConfirmStep, gasDeliveryStep]

const gasAppFlow = (id, name, app, color, short, title) => ({
  id,
  app: name,
  color,
  short,
  title,
  steps: [
    openAppStep(app),
    gasLoginNumberStep,
    gasLoginOtpStep,
    bookCylinderStep,
    checkAddressStep,
    confirmBookingStep,
    gasPaymentChoice,
    ...GAS_TAIL,
  ],
})

export const GAS_FLOWS = [
  gasAppFlow('gas_indane', 'Indane', 'IndianOil One', '#F37021', 'In', {
    en: 'Book an Indane cylinder',
    hi: 'Indane सिलेंडर बुक करें',
    mr: 'Indane सिलिंडर बुक करा',
    bn: 'Indane সিলিন্ডার বুক করুন',
  }),
  gasAppFlow('gas_hp', 'HP Gas', 'HP Gas', '#0072CE', 'HP', {
    en: 'Book an HP Gas cylinder',
    hi: 'HP Gas सिलेंडर बुक करें',
    mr: 'HP Gas सिलिंडर बुक करा',
    bn: 'HP Gas সিলিন্ডার বুক করুন',
  }),
  gasAppFlow('gas_bharat', 'Bharat Gas', 'Bharatgas', '#00529B', 'Bh', {
    en: 'Book a Bharat Gas cylinder',
    hi: 'Bharat Gas सिलेंडर बुक करें',
    mr: 'Bharat Gas सिलिंडर बुक करा',
    bn: 'Bharat Gas সিলিন্ডার বুক করুন',
  }),

  // ── Book by missed call (basic phone / weak internet) ──────────────────
  {
    id: 'gas_missed_call',
    app: 'Missed call',
    color: '#5B6472',
    short: '☎',
    title: {
      en: 'Book gas with a missed call',
      hi: 'मिस्ड कॉल से गैस बुक करें',
      mr: 'मिस्ड कॉलने गॅस बुक करा',
      bn: 'মিসড কলে গ্যাস বুক করুন',
    },
    steps: [
      {
        text: {
          en: 'No smartphone or internet is needed — you can book with just one missed call.',
          hi: 'स्मार्टफोन या इंटरनेट की ज़रूरत नहीं — आप सिर्फ एक मिस्ड कॉल से बुक कर सकते हैं।',
          mr: 'स्मार्टफोन किंवा इंटरनेटची गरज नाही — तुम्ही फक्त एका मिस्ड कॉलने बुक करू शकता.',
          bn: 'স্মার্টফোন বা ইন্টারনেট লাগবে না — আপনি শুধু একটি মিসড কলে বুক করতে পারেন।',
        },
        illustrationHint: 'A simple keypad phone with a phone-call icon.',
        image: '/walkthrough/basic-phone.svg',
        reassurance: {
          en: 'This is the easiest way if you have a basic phone.',
          hi: 'साधारण फोन हो तो यह सबसे आसान तरीका है।',
          mr: 'साधा फोन असेल तर हा सर्वात सोपा मार्ग आहे.',
          bn: 'সাধারণ ফোন থাকলে এটি সবচেয়ে সহজ উপায়।',
        },
      },
      {
        text: {
          en: 'Find your gas booking number — it is printed on your gas passbook or your last delivery receipt.',
          hi: 'अपना गैस बुकिंग नंबर ढूँढ़ें — यह आपकी गैस पासबुक या पिछली डिलीवरी रसीद पर छपा होता है।',
          mr: 'तुमचा गॅस बुकिंग नंबर शोधा — तो तुमच्या गॅस पासबुकवर किंवा शेवटच्या डिलिव्हरी पावतीवर छापलेला असतो.',
          bn: 'আপনার গ্যাস বুকিং নম্বর খুঁজুন — এটি আপনার গ্যাস পাসবুকে বা শেষ ডেলিভারি রসিদে ছাপা থাকে।',
        },
        illustrationHint: 'A gas passbook with the booking phone number highlighted.',
        image: '/walkthrough/passbook.svg',
        warningHint: {
          en: 'Numbers differ by company and area — confirm yours with your gas agency once.',
          hi: 'नंबर कंपनी और इलाके से बदलते हैं — एक बार अपनी गैस एजेंसी से पक्का कर लें।',
          mr: 'नंबर कंपनी आणि भागानुसार बदलतात — एकदा तुमच्या गॅस एजन्सीकडून खात्री करा.',
          bn: 'নম্বর কোম্পানি ও এলাকা ভেদে আলাদা — একবার আপনার গ্যাস এজেন্সির সঙ্গে নিশ্চিত করুন।',
        },
      },
      {
        text: {
          en: 'Save that number in your contacts as "Gas booking".',
          hi: 'उस नंबर को अपने कॉन्टैक्ट में "Gas booking" नाम से सेव करें।',
          mr: 'तो नंबर तुमच्या कॉन्टॅक्टमध्ये "Gas booking" नावाने सेव्ह करा.',
          bn: 'সেই নম্বরটি আপনার কন্টাক্টে "Gas booking" নামে সেভ করুন।',
        },
        illustrationHint: 'Saving a contact named Gas booking.',
        image: '/walkthrough/save-contact.svg',
        reassurance: {
          en: 'Saving it once means you never have to search for it again.',
          hi: 'एक बार सेव कर लें तो दोबारा ढूँढ़ना नहीं पड़ेगा।',
          mr: 'एकदा सेव्ह केले की पुन्हा शोधावे लागणार नाही.',
          bn: 'একবার সেভ করলে আর কখনও খুঁজতে হবে না।',
        },
      },
      {
        text: {
          en: 'Use the phone that has the number registered with your gas connection.',
          hi: 'वही फोन इस्तेमाल करें जिसमें आपके गैस कनेक्शन से जुड़ा नंबर है।',
          mr: 'तुमच्या गॅस कनेक्शनशी जोडलेला नंबर असलेलाच फोन वापरा.',
          bn: 'যে ফোনে আপনার গ্যাস সংযোগে নিবন্ধিত নম্বর আছে সেটিই ব্যবহার করুন।',
        },
        illustrationHint: 'A phone showing the registered SIM number.',
        // No mockup: advisory step about which SIM to use — nothing visual to point at.
        warningHint: {
          en: 'If you call from a different number, the booking will not be linked to you.',
          hi: 'किसी दूसरे नंबर से कॉल करेंगे तो बुकिंग आपसे नहीं जुड़ेगी।',
          mr: 'दुसऱ्या नंबरवरून कॉल केल्यास बुकिंग तुमच्याशी जोडली जाणार नाही.',
          bn: 'অন্য নম্বর থেকে কল করলে বুকিং আপনার সঙ্গে যুক্ত হবে না।',
        },
        reassurance: {
          en: 'Not sure which number? It is the one you gave when you took the connection.',
          hi: 'पक्का नहीं कौन सा नंबर? वही जो कनेक्शन लेते समय दिया था।',
          mr: 'कोणता नंबर ते नक्की नाही? कनेक्शन घेताना दिलेला तोच.',
          bn: 'কোন নম্বর নিশ্চিত নন? সংযোগ নেওয়ার সময় যেটি দিয়েছিলেন সেটিই।',
        },
      },
      {
        text: {
          en: 'Call the saved "Gas booking" number once.',
          hi: 'सेव किए हुए "Gas booking" नंबर पर एक बार कॉल करें।',
          mr: 'सेव्ह केलेल्या "Gas booking" नंबरवर एकदा कॉल करा.',
          bn: 'সেভ করা "Gas booking" নম্বরে একবার কল করুন।',
        },
        illustrationHint: 'Tapping call on the Gas booking contact.',
        image: '/walkthrough/tap-contact.svg',
      },
      {
        text: {
          en: 'Let it ring once — the call cuts by itself. You are not charged for it.',
          hi: 'एक घंटी बजने दें — कॉल अपने आप कट जाती है। इसके पैसे नहीं लगते।',
          mr: 'एक रिंग वाजू द्या — कॉल आपोआप कट होतो. याचे पैसे लागत नाहीत.',
          bn: 'একবার রিং হতে দিন — কল নিজে থেকে কেটে যায়। এর জন্য টাকা লাগে না।',
        },
        illustrationHint: 'A call ending after one ring.',
        // No mockup: a transient one-ring action — a still image adds nothing.
        reassurance: {
          en: 'A missed call is free. You do not need to say anything.',
          hi: 'मिस्ड कॉल मुफ़्त है। कुछ बोलने की ज़रूरत नहीं।',
          mr: 'मिस्ड कॉल मोफत आहे. काही बोलण्याची गरज नाही.',
          bn: 'মিসড কল ফ্রি। কিছু বলার দরকার নেই।',
        },
      },
      {
        text: {
          en: 'Wait a few minutes. A confirmation SMS with a booking number will arrive.',
          hi: 'कुछ मिनट रुकें। बुकिंग नंबर के साथ पुष्टि का SMS आएगा।',
          mr: 'काही मिनिटे थांबा. बुकिंग क्रमांकासह पुष्टीचा SMS येईल.',
          bn: 'কয়েক মিনিট অপেক্ষা করুন। বুকিং নম্বর সহ নিশ্চিতকরণ SMS আসবে।',
        },
        illustrationHint: 'A confirmation SMS arriving with a booking number.',
        image: '/walkthrough/sms.svg',
        reassurance: {
          en: 'When that SMS comes, your booking is done. Keep it safe.',
          hi: 'वह SMS आ जाए तो बुकिंग हो गई। उसे संभाल कर रखें।',
          mr: 'तो SMS आला की बुकिंग झाली. तो जपून ठेवा.',
          bn: 'সেই SMS এলে বুকিং হয়ে গেছে। সেটি রেখে দিন।',
        },
      },
      {
        text: {
          en: 'If no SMS comes within 10 minutes, give the missed call once more, or phone your gas agency.',
          hi: 'अगर 10 मिनट में SMS न आए, एक बार फिर मिस्ड कॉल दें, या अपनी गैस एजेंसी को फोन करें।',
          mr: '10 मिनिटांत SMS न आल्यास, पुन्हा एकदा मिस्ड कॉल द्या, किंवा तुमच्या गॅस एजन्सीला फोन करा.',
          bn: '১০ মিনিটে SMS না এলে, আরেকবার মিসড কল দিন, বা আপনার গ্যাস এজেন্সিকে ফোন করুন।',
        },
        illustrationHint: 'A clock showing 10 minutes and a second call attempt.',
        image: '/walkthrough/clock.svg',
        warningHint: {
          en: 'Do not assume it is booked without the SMS — check first.',
          hi: 'SMS के बिना बुकिंग मान न लें — पहले जाँच लें।',
          mr: 'SMS शिवाय बुकिंग झाली असे मानू नका — आधी तपासा.',
          bn: 'SMS ছাড়া বুকিং হয়েছে ধরে নেবেন না — আগে দেখে নিন।',
        },
      },
      {
        text: {
          en: 'Keep the empty cylinder ready near your door to exchange when the new one comes.',
          hi: 'खाली सिलेंडर दरवाज़े के पास तैयार रखें ताकि नया आने पर बदल सकें।',
          mr: 'रिकामा सिलिंडर दाराजवळ तयार ठेवा, नवीन आल्यावर बदलता येईल.',
          bn: 'খালি সিলিন্ডার দরজার কাছে প্রস্তুত রাখুন, নতুনটি এলে বদলে নিতে পারবেন।',
        },
        illustrationHint: 'An empty cylinder placed by the front door.',
        image: '/walkthrough/cylinder.svg',
        reassurance: {
          en: 'The delivery person takes the empty one and gives you the full one.',
          hi: 'डिलीवरी वाला खाली ले जाता है और भरा हुआ दे देता है।',
          mr: 'डिलिव्हरी करणारा रिकामा घेऊन जातो आणि भरलेला देतो.',
          bn: 'ডেলিভারি ব্যক্তি খালিটা নিয়ে যান আর ভর্তিটা দেন।',
        },
      },
      {
        text: {
          en: 'When the cylinder arrives, pay cash to the delivery person and take the receipt.',
          hi: 'सिलेंडर आने पर डिलीवरी वाले को नकद दें, और रसीद लें।',
          mr: 'सिलिंडर आल्यावर डिलिव्हरी करणाऱ्याला रोख द्या, आणि पावती घ्या.',
          bn: 'সিলিন্ডার এলে ডেলিভারি ব্যক্তিকে নগদ দিন, আর রসিদ নিন।',
        },
        illustrationHint: 'Paying cash and receiving a receipt at the door.',
        image: '/walkthrough/cash-delivery.svg',
        warningHint: {
          en: 'Check the price on the receipt before paying.',
          hi: 'भुगतान से पहले रसीद पर कीमत जाँचें।',
          mr: 'पैसे देण्याआधी पावतीवरील किंमत तपासा.',
          bn: 'টাকা দেওয়ার আগে রসিদে দাম দেখুন।',
        },
      },
    ],
  },

  // ── Check delivery status ──────────────────────────────────────────────
  {
    id: 'gas_delivery_status',
    app: 'Track',
    color: '#5B6472',
    short: '🚚',
    title: {
      en: 'Check gas delivery status',
      hi: 'गैस डिलीवरी की स्थिति देखें',
      mr: 'गॅस डिलिव्हरीची स्थिती पाहा',
      bn: 'গ্যাস ডেলিভারির অবস্থা দেখুন',
    },
    steps: [
      {
        text: {
          en: 'Open your gas company app (Indane, HP, or Bharat Gas).',
          hi: 'अपनी गैस कंपनी का ऐप खोलें (Indane, HP, या Bharat Gas)।',
          mr: 'तुमच्या गॅस कंपनीचे ॲप उघडा (Indane, HP, किंवा Bharat Gas).',
          bn: 'আপনার গ্যাস কোম্পানির অ্যাপ খুলুন (Indane, HP, বা Bharat Gas)।',
        },
        illustrationHint: 'A gas company app opening.',
        image: '/walkthrough/open-app.svg',
      },
      {
        text: {
          en: 'Tap "Booking History" or "Track Refill".',
          hi: '"Booking History" या "Track Refill" दबाएँ।',
          mr: '"Booking History" किंवा "Track Refill" दाबा.',
          bn: '"Booking History" বা "Track Refill" চাপুন।',
        },
        illustrationHint: 'A Booking History / Track Refill menu item.',
        image: '/walkthrough/list-select.svg',
      },
      {
        text: {
          en: 'Your most recent booking is at the top of the list. Tap it.',
          hi: 'आपकी सबसे नई बुकिंग सूची में सबसे ऊपर होती है। उस पर टैप करें।',
          mr: 'तुमची सर्वात नवीन बुकिंग यादीत सर्वात वर असते. त्यावर टॅप करा.',
          bn: 'আপনার সবচেয়ে নতুন বুকিং তালিকার উপরে থাকে। সেটিতে ট্যাপ করুন।',
        },
        illustrationHint: 'The latest booking highlighted at the top of the list.',
        image: '/walkthrough/list-select.svg',
      },
      {
        text: {
          en: 'You will see the status: "Booked", then "Out for delivery", then "Delivered".',
          hi: 'आपको स्थिति दिखेगी: "Booked", फिर "Out for delivery", फिर "Delivered"।',
          mr: 'तुम्हाला स्थिती दिसेल: "Booked", मग "Out for delivery", मग "Delivered".',
          bn: 'আপনি অবস্থা দেখবেন: "Booked", তারপর "Out for delivery", তারপর "Delivered"।',
        },
        illustrationHint: 'A status tracker: Booked → Out for delivery → Delivered.',
        image: '/walkthrough/status-tracker.svg',
        reassurance: {
          en: 'No app? The same updates also come to you by SMS.',
          hi: 'ऐप नहीं है? यही जानकारी आपको SMS से भी मिलती है।',
          mr: 'ॲप नाही? हीच माहिती तुम्हाला SMS नेही मिळते.',
          bn: 'অ্যাপ নেই? একই আপডেট আপনি SMS-এও পান।',
        },
      },
      {
        text: {
          en: '"Booked" means the agency has your order but has not sent it yet. It usually moves on within a day.',
          hi: '"Booked" का मतलब है एजेंसी के पास आपका ऑर्डर है पर अभी भेजा नहीं। आमतौर पर एक दिन में आगे बढ़ जाता है।',
          mr: '"Booked" म्हणजे एजन्सीकडे तुमची ऑर्डर आहे पण अजून पाठवली नाही. सहसा एका दिवसात पुढे सरकते.',
          bn: '"Booked" মানে এজেন্সির কাছে আপনার অর্ডার আছে কিন্তু এখনও পাঠায়নি। সাধারণত এক দিনের মধ্যে এগোয়।',
        },
        illustrationHint: 'The Booked stage highlighted with a calm clock.',
        image: '/walkthrough/status-tracker.svg',
        reassurance: {
          en: 'This waiting stage is normal. Nothing is wrong.',
          hi: 'यह इंतज़ार सामान्य है। कुछ गलत नहीं है।',
          mr: 'ही प्रतीक्षा सामान्य आहे. काही चुकीचे नाही.',
          bn: 'এই অপেক্ষা স্বাভাবিক। কিছু ভুল হয়নি।',
        },
      },
      {
        text: {
          en: 'If it stays "Booked" for more than 2 to 3 days, call your gas agency.',
          hi: 'अगर 2 से 3 दिन से ज़्यादा "Booked" ही रहे, तो अपनी गैस एजेंसी को फोन करें।',
          mr: '2 ते 3 दिवसांपेक्षा जास्त "Booked" राहिल्यास, तुमच्या गॅस एजन्सीला फोन करा.',
          bn: '২ থেকে ৩ দিনের বেশি "Booked" থাকলে, আপনার গ্যাস এজেন্সিকে ফোন করুন।',
        },
        illustrationHint: 'Calling the gas agency number from the passbook.',
        image: '/walkthrough/tap-contact.svg',
        warningHint: {
          en: 'The agency number is on your gas passbook or last receipt.',
          hi: 'एजेंसी का नंबर आपकी गैस पासबुक या पिछली रसीद पर होता है।',
          mr: 'एजन्सीचा नंबर तुमच्या गॅस पासबुकवर किंवा शेवटच्या पावतीवर असतो.',
          bn: 'এজেন্সির নম্বর আপনার গ্যাস পাসবুকে বা শেষ রসিদে থাকে।',
        },
      },
      {
        text: {
          en: 'When it says "Out for delivery", keep cash, the empty cylinder, and your phone ready.',
          hi: 'जब "Out for delivery" दिखे, नकद, खाली सिलेंडर और फोन तैयार रखें।',
          mr: 'जेव्हा "Out for delivery" दिसेल, रोख, रिकामा सिलिंडर आणि फोन तयार ठेवा.',
          bn: 'যখন "Out for delivery" দেখায়, নগদ, খালি সিলিন্ডার আর ফোন প্রস্তুত রাখুন।',
        },
        illustrationHint: 'Cash, empty cylinder, and phone kept ready by the door.',
        image: '/walkthrough/delivery.svg',
        reassurance: {
          en: 'The delivery person usually calls before reaching your home.',
          hi: 'डिलीवरी वाला आमतौर पर घर पहुँचने से पहले फोन करता है।',
          mr: 'डिलिव्हरी करणारा सहसा घरी पोहोचण्याआधी फोन करतो.',
          bn: 'ডেলিভারি ব্যক্তি সাধারণত বাড়ি পৌঁছানোর আগে ফোন করেন।',
        },
      },
      {
        text: {
          en: 'If you miss the delivery, do not worry — they usually try again or call you. Your booking stays.',
          hi: 'अगर डिलीवरी छूट जाए, चिंता न करें — वे आमतौर पर दोबारा आते हैं या फोन करते हैं। बुकिंग बनी रहती है।',
          mr: 'डिलिव्हरी चुकल्यास, काळजी करू नका — ते सहसा पुन्हा येतात किंवा फोन करतात. बुकिंग राहते.',
          bn: 'ডেলিভারি মিস করলে, চিন্তা করবেন না — তারা সাধারণত আবার আসেন বা ফোন করেন। বুকিং থেকে যায়।',
        },
        illustrationHint: 'A missed delivery with a friendly re-attempt note.',
        // No mockup: reassurance about a missed attempt — no concrete UI to depict.
        reassurance: {
          en: 'Your booking is not lost if you miss one attempt.',
          hi: 'एक बार छूटने पर बुकिंग खत्म नहीं होती।',
          mr: 'एकदा चुकल्याने बुकिंग संपत नाही.',
          bn: 'একবার মিস করলে বুকিং হারিয়ে যায় না।',
        },
      },
      {
        text: {
          en: 'After you receive the cylinder, the status turns to "Delivered". That means it is complete.',
          hi: 'सिलेंडर मिलने के बाद स्थिति "Delivered" हो जाती है। इसका मतलब काम पूरा हुआ।',
          mr: 'सिलिंडर मिळाल्यावर स्थिती "Delivered" होते. म्हणजे काम पूर्ण झाले.',
          bn: 'সিলিন্ডার পাওয়ার পর অবস্থা "Delivered" হয়ে যায়। মানে কাজ সম্পূর্ণ।',
        },
        illustrationHint: 'A green Delivered status with a tick.',
        image: '/walkthrough/success.svg',
        reassurance: {
          en: 'Delivered means you are all done.',
          hi: '"Delivered" यानी सब हो गया।',
          mr: '"Delivered" म्हणजे सर्व झाले.',
          bn: '"Delivered" মানে সব হয়ে গেছে।',
        },
      },
    ],
  },
]

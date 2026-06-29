// "Send Money" (UPI) flows — one complete flow per app.
// Step model:
//   { text:{hi,en,mr,bn}, illustrationHint:'en hint for the illustrator',
//     warningHint?:{...4 langs}, reassurance?:{...4 langs} }
// A branch step:
//   { choice:true, text, illustrationHint, options:[{label,branch}], branches:{qr:[...], manual:[...]} }
// Each flow = [ ...app-specific head, choiceStep, ...SHARED_TAIL ].

// ── Shared tail: amount → review → PIN → processing → success → failure ──
// Identical across apps (the UPI confirm flow really is the same everywhere),
// which keeps the PIN-safety wording exactly consistent.
const amountStep = {
  text: {
    en: 'Type the amount using the number keypad. The big ₹ figure shows what you will pay.',
    hi: 'नंबर कीपैड से रकम टाइप करें। बड़ा ₹ अंक दिखाता है कि आप कितना देंगे।',
    mr: 'नंबर कीपॅडने रक्कम टाका. मोठा ₹ आकडा तुम्ही किती द्याल ते दाखवतो.',
    bn: 'নম্বর কীপ্যাড দিয়ে টাকার পরিমাণ লিখুন। বড় ₹ সংখ্যা দেখায় আপনি কত দেবেন।',
  },
  illustrationHint: 'On-screen number pad at the bottom; large ₹ amount shown at the top.',
  image: '/walkthrough/number-pad.svg',
  warningHint: {
    en: 'Type the rupees only. You can leave the message box empty.',
    hi: 'सिर्फ रुपये टाइप करें। संदेश का खाना खाली छोड़ सकते हैं।',
    mr: 'फक्त रुपये टाका. मेसेजचा रकाना रिकामा ठेवू शकता.',
    bn: 'শুধু টাকা লিখুন। মেসেজ বক্স খালি রাখতে পারেন।',
  },
}

const reviewStep = {
  text: {
    en: 'Before paying, check two things on the review screen: the name and the amount.',
    hi: 'भुगतान से पहले, समीक्षा स्क्रीन पर दो चीज़ें जाँचें: नाम और रकम।',
    mr: 'पैसे देण्याआधी, रिव्ह्यू स्क्रीनवर दोन गोष्टी तपासा: नाव आणि रक्कम.',
    bn: 'টাকা দেওয়ার আগে, রিভিউ স্ক্রিনে দুটি জিনিস দেখুন: নাম এবং পরিমাণ।',
  },
  illustrationHint: 'Review screen with the recipient name and the amount circled.',
  image: '/walkthrough/review-pay.svg',
  warningHint: {
    en: 'If the name is not who you expected, tap back and stop.',
    hi: 'अगर नाम वह नहीं है जिसकी उम्मीद थी, पीछे जाएँ और रुक जाएँ।',
    mr: 'नाव अपेक्षेप्रमाणे नसेल, मागे जा आणि थांबा.',
    bn: 'নাম যদি প্রত্যাশিত ব্যক্তির না হয়, পিছনে গিয়ে থামুন।',
  },
  reassurance: {
    en: 'Checking here keeps your money safe.',
    hi: 'यहाँ जाँचना आपके पैसे को सुरक्षित रखता है।',
    mr: 'इथे तपासल्याने तुमचे पैसे सुरक्षित राहतात.',
    bn: 'এখানে দেখে নেওয়া আপনার টাকা নিরাপদ রাখে।',
  },
}

const pinStep = {
  text: {
    en: 'Enter your 4 or 6 digit UPI PIN on the keypad. This tells your bank it is really you.',
    hi: 'कीपैड पर अपना 4 या 6 अंकों का UPI PIN डालें। यह बैंक को बताता है कि यह सच में आप हैं।',
    mr: 'कीपॅडवर तुमचा 4 किंवा 6 अंकी UPI PIN टाका. हे बँकेला सांगते की हे खरंच तुम्हीच आहात.',
    bn: 'কীপ্যাডে আপনার ৪ বা ৬ সংখ্যার UPI PIN দিন। এটি ব্যাঙ্ককে জানায় এটি সত্যিই আপনি।',
  },
  illustrationHint: 'A secure PIN keypad sliding up from the bottom of the screen.',
  image: '/walkthrough/pin-keypad.svg',
  reassurance: {
    en: 'This is safe. Saral and the shop never see your PIN — only your bank does.',
    hi: 'यह सुरक्षित है। सरल और दुकान आपका PIN कभी नहीं देखते — सिर्फ आपका बैंक देखता है।',
    mr: 'हे सुरक्षित आहे. सरल आणि दुकान तुमचा PIN कधीच पाहत नाहीत — फक्त तुमची बँक पाहते.',
    bn: 'এটি নিরাপদ। সরল ও দোকান কখনও আপনার PIN দেখে না — শুধু আপনার ব্যাঙ্ক দেখে।',
  },
  warningHint: {
    en: 'Never tell this PIN to anyone, even on a phone call.',
    hi: 'यह PIN किसी को न बताएं, फोन कॉल पर भी नहीं।',
    mr: 'हा PIN कोणालाही सांगू नका, फोन कॉलवरही नाही.',
    bn: 'এই PIN কাউকে বলবেন না, ফোন কলেও না।',
  },
}

const processingStep = {
  text: {
    en: 'Wait a few seconds while the screen says "Processing". Do not close the app.',
    hi: 'कुछ सेकंड रुकें जब स्क्रीन "Processing" दिखाए। ऐप बंद न करें।',
    mr: 'स्क्रीन "Processing" दाखवत असताना काही सेकंद थांबा. ॲप बंद करू नका.',
    bn: 'স্ক্রিনে "Processing" দেখানোর সময় কয়েক সেকেন্ড অপেক্ষা করুন। অ্যাপ বন্ধ করবেন না।',
  },
  illustrationHint: 'A spinning loader with the word "Processing".',
  image: '/walkthrough/processing.svg',
  reassurance: {
    en: 'A slow moment here is normal.',
    hi: 'यहाँ थोड़ी देर होना सामान्य है।',
    mr: 'इथे थोडा वेळ लागणे सामान्य आहे.',
    bn: 'এখানে একটু সময় লাগা স্বাভাবিক।',
  },
}

const successStep = {
  text: {
    en: 'A green tick and "Payment Successful" means the money has gone.',
    hi: 'हरा टिक और "Payment Successful" का मतलब है पैसा चला गया।',
    mr: 'हिरवी टिक आणि "Payment Successful" म्हणजे पैसे गेले.',
    bn: 'সবুজ টিক ও "Payment Successful" মানে টাকা চলে গেছে।',
  },
  illustrationHint: 'A big green checkmark with "Payment Successful".',
  image: '/walkthrough/success.svg',
  reassurance: {
    en: 'You are done. You can take a screenshot to keep as proof.',
    hi: 'हो गया। सबूत के लिए स्क्रीनशॉट ले सकते हैं।',
    mr: 'झाले. पुराव्यासाठी स्क्रीनशॉट घेऊ शकता.',
    bn: 'হয়ে গেছে। প্রমাণ হিসেবে স্ক্রিনশট নিতে পারেন।',
  },
}

const failureStep = {
  text: {
    en: 'If you see "Payment Failed" or red text, the money was NOT sent.',
    hi: 'अगर "Payment Failed" या लाल अक्षर दिखें, तो पैसा नहीं भेजा गया।',
    mr: '"Payment Failed" किंवा लाल अक्षरे दिसल्यास, पैसे पाठवले गेले नाहीत.',
    bn: '"Payment Failed" বা লাল লেখা দেখলে, টাকা পাঠানো হয়নি।',
  },
  illustrationHint: 'A red cross with "Payment Failed", and a calm balance-check icon.',
  image: '/walkthrough/failed.svg',
  warningHint: {
    en: 'If money left your account but it failed, it returns on its own in 1–2 days. Do not pay again in a panic.',
    hi: 'अगर पैसा कटा पर फेल हुआ, तो 1–2 दिन में अपने आप वापस आ जाता है। घबराकर दोबारा भुगतान न करें।',
    mr: 'पैसे कापले पण फेल झाले, तर 1–2 दिवसांत आपोआप परत येतात. घाबरून पुन्हा पैसे देऊ नका.',
    bn: 'টাকা কাটলেও যদি ফেল হয়, ১–২ দিনে নিজে থেকে ফেরত আসে। আতঙ্কিত হয়ে আবার দেবেন না।',
  },
  reassurance: {
    en: 'Common reasons are a wrong PIN, weak internet, or low balance. Wait two minutes and check your balance first.',
    hi: 'आम कारण: गलत PIN, कमज़ोर इंटरनेट, या कम बैलेंस। दो मिनट रुकें और पहले बैलेंस जाँचें।',
    mr: 'सामान्य कारणे: चुकीचा PIN, कमजोर इंटरनेट, किंवा कमी बॅलन्स. दोन मिनिटे थांबा आणि आधी बॅलन्स तपासा.',
    bn: 'সাধারণ কারণ: ভুল PIN, দুর্বল ইন্টারনেট, বা কম ব্যালেন্স। দুই মিনিট অপেক্ষা করে আগে ব্যালেন্স দেখুন।',
  },
}

const SHARED_TAIL = [amountStep, reviewStep, pinStep, processingStep, successStep, failureStep]

// Reusable QR-scan branch step (point camera) — same idea on every app.
const pointCameraStep = {
  text: {
    en: "Hold the phone steady over the shop's QR code until it reads on its own.",
    hi: 'फोन को दुकान के QR कोड पर स्थिर रखें, यह अपने आप पढ़ लेगा।',
    mr: 'फोन दुकानाच्या QR कोडवर स्थिर धरा, तो आपोआप वाचेल.',
    bn: 'দোকানের QR কোডের উপর ফোন স্থির রাখুন, এটি নিজে থেকে পড়ে নেবে।',
  },
  illustrationHint: 'A QR code fitting inside the square camera frame.',
  image: '/walkthrough/qr-scan.svg',
  reassurance: {
    en: "You don't need to press anything — it scans by itself.",
    hi: 'कुछ दबाना नहीं है — यह खुद स्कैन करता है।',
    mr: 'काही दाबायचे नाही — तो स्वतः स्कॅन करतो.',
    bn: 'কিছু চাপতে হবে না — এটি নিজেই স্ক্যান করে।',
  },
}

// Choice question shared text (each flow supplies its own branch steps).
const choiceText = {
  en: 'How would you like to pay? Scan a QR code, or type the phone number?',
  hi: 'आप कैसे भुगतान करना चाहते हैं? QR कोड स्कैन करें या फोन नंबर टाइप करें?',
  mr: 'तुम्हाला कसे पैसे द्यायचे आहेत? QR कोड स्कॅन करा की फोन नंबर टाका?',
  bn: 'আপনি কীভাবে টাকা দিতে চান? QR কোড স্ক্যান করবেন নাকি ফোন নম্বর লিখবেন?',
}
const choiceOptions = [
  { label: { en: 'Scan a QR code', hi: 'QR कोड स्कैन करें', mr: 'QR कोड स्कॅन करा', bn: 'QR কোড স্ক্যান করুন' }, branch: 'qr' },
  { label: { en: 'Type the number', hi: 'नंबर टाइप करें', mr: 'नंबर टाका', bn: 'নম্বর লিখুন' }, branch: 'manual' },
]

// Reusable "type the number" + "confirm the name" manual steps.
const typeNumberStep = {
  text: {
    en: "Type the person's 10-digit phone number, or pick them from your contacts.",
    hi: 'व्यक्ति का 10 अंकों का फोन नंबर टाइप करें, या अपनी कॉन्टैक्ट सूची से चुनें।',
    mr: 'व्यक्तीचा 10 अंकी फोन नंबर टाका, किंवा तुमच्या कॉन्टॅक्टमधून निवडा.',
    bn: 'ব্যক্তির ১০ সংখ্যার ফোন নম্বর লিখুন, বা কন্টাক্ট থেকে বেছে নিন।',
  },
  illustrationHint: 'A number keypad with a 10-digit phone number being typed.',
  image: '/walkthrough/number-entry.svg',
  warningHint: {
    en: 'Check every digit. Money goes to the number you type.',
    hi: 'हर अंक जाँचें। पैसा उसी नंबर पर जाएगा जो आप टाइप करेंगे।',
    mr: 'प्रत्येक अंक तपासा. तुम्ही टाकाल त्याच नंबरवर पैसे जातील.',
    bn: 'প্রতিটি সংখ্যা দেখুন। আপনি যে নম্বর লিখবেন সেখানেই টাকা যাবে।',
  },
}
const confirmNameStep = {
  text: {
    en: 'When their name appears, check it is the right person, then tap to continue.',
    hi: 'जब नाम दिखे, जाँचें कि सही व्यक्ति है, फिर आगे बढ़ने के लिए दबाएँ।',
    mr: 'नाव दिसल्यावर, योग्य व्यक्ती आहे का तपासा, मग पुढे जाण्यासाठी दाबा.',
    bn: 'নাম দেখা গেলে, সঠিক ব্যক্তি কিনা দেখে নিন, তারপর এগিয়ে যেতে চাপুন।',
  },
  illustrationHint: 'The recipient name shown under the number with a small green tick.',
  image: '/walkthrough/confirm-name.svg',
  reassurance: {
    en: 'The app shows their name so you can be sure before paying.',
    hi: 'ऐप नाम दिखाता है ताकि भुगतान से पहले आप पक्का कर सकें।',
    mr: 'ॲप नाव दाखवते जेणेकरून पैसे देण्याआधी तुम्ही खात्री करू शकता.',
    bn: 'অ্যাপ নাম দেখায় যাতে টাকা দেওয়ার আগে আপনি নিশ্চিত হতে পারেন।',
  },
}

export const UPI_FLOWS = [
  // ── 1. PhonePe ──────────────────────────────────────────────
  {
    id: 'upi_phonepe',
    app: 'PhonePe',
    color: '#5F259F',
    short: 'Pe',
    title: { en: 'Send money with PhonePe', hi: 'PhonePe से पैसे भेजें', mr: 'PhonePe ने पैसे पाठवा', bn: 'PhonePe দিয়ে টাকা পাঠান' },
    steps: [
      {
        text: {
          en: 'Open the purple PhonePe app on your phone.',
          hi: 'अपने फोन में बैंगनी रंग का PhonePe ऐप खोलें।',
          mr: 'तुमच्या फोनमध्ये जांभळ्या रंगाचे PhonePe ॲप उघडा.',
          bn: 'আপনার ফোনে বেগুনি রঙের PhonePe অ্যাপ খুলুন।',
        },
        illustrationHint: 'Phone home screen with the purple PhonePe icon circled.',
        image: '/walkthrough/open-app.svg',
        reassurance: {
          en: 'Take your time. Nothing is sent until the very end.',
          hi: 'आराम से करें। आखिर तक कुछ नहीं भेजा जाता।',
          mr: 'सावकाश करा. शेवटपर्यंत काहीही पाठवले जात नाही.',
          bn: 'ধীরে করুন। একদম শেষ পর্যন্ত কিছু পাঠানো হয় না।',
        },
      },
      {
        text: {
          en: 'On the home screen, the money options are near the top and a big purple "Scan & Pay" button is at the bottom centre.',
          hi: 'होम स्क्रीन पर पैसे के विकल्प ऊपर हैं और नीचे बीच में बड़ा बैंगनी "Scan & Pay" बटन है।',
          mr: 'होम स्क्रीनवर पैशांचे पर्याय वर आहेत आणि खाली मध्यभागी मोठे जांभळे "Scan & Pay" बटण आहे.',
          bn: 'হোম স্ক্রিনে টাকার অপশন উপরে আর নিচে মাঝখানে বড় বেগুনি "Scan & Pay" বোতাম আছে।',
        },
        illustrationHint: 'PhonePe home: transfer icons up top, Scan & Pay button bottom centre.',
        image: '/walkthrough/app-home.svg',
      },
      {
        choice: true,
        text: choiceText,
        illustrationHint: 'Two large buttons: "Scan QR" and "Type number".',
        image: '/walkthrough/two-choice.svg',
        options: choiceOptions,
        branches: {
          qr: [
            {
              text: {
                en: 'Tap the purple "Scan & Pay" button at the bottom centre.',
                hi: 'नीचे बीच में बैंगनी "Scan & Pay" बटन दबाएँ।',
                mr: 'खाली मध्यभागी जांभळे "Scan & Pay" बटण दाबा.',
                bn: 'নিচে মাঝখানে বেগুনি "Scan & Pay" বোতামে চাপুন।',
              },
              illustrationHint: 'Finger tapping Scan & Pay; the camera opens.',
              image: '/walkthrough/tap-scan.svg',
              warningHint: {
                en: 'Allow camera access if the phone asks.',
                hi: 'अगर फोन कैमरा माँगे तो अनुमति दें।',
                mr: 'फोनने कॅमेरा मागितल्यास परवानगी द्या.',
                bn: 'ফোন ক্যামেরা চাইলে অনুমতি দিন।',
              },
            },
            pointCameraStep,
          ],
          manual: [
            {
              text: {
                en: 'Tap "To Mobile Number" near the top of the home screen.',
                hi: 'होम स्क्रीन पर ऊपर "To Mobile Number" दबाएँ।',
                mr: 'होम स्क्रीनवर वर "To Mobile Number" दाबा.',
                bn: 'হোম স্ক্রিনে উপরে "To Mobile Number"-এ চাপুন।',
              },
              illustrationHint: 'Tapping the "To Mobile Number" tile.',
              image: '/walkthrough/tap-contact.svg',
            },
            typeNumberStep,
            confirmNameStep,
          ],
        },
      },
      ...SHARED_TAIL,
    ],
  },

  // ── 2. Google Pay ───────────────────────────────────────────
  {
    id: 'upi_gpay',
    app: 'Google Pay',
    color: '#1A73E8',
    short: 'GP',
    title: { en: 'Send money with Google Pay', hi: 'Google Pay से पैसे भेजें', mr: 'Google Pay ने पैसे पाठवा', bn: 'Google Pay দিয়ে টাকা পাঠান' },
    steps: [
      {
        text: {
          en: 'Open the white Google Pay app with the colourful "G".',
          hi: 'रंगीन "G" वाला सफ़ेद Google Pay ऐप खोलें।',
          mr: 'रंगीत "G" असलेले पांढरे Google Pay ॲप उघडा.',
          bn: 'রঙিন "G" সহ সাদা Google Pay অ্যাপ খুলুন।',
        },
        illustrationHint: 'Phone home screen with the white Google Pay icon circled.',
        image: '/walkthrough/open-app.svg',
        reassurance: {
          en: 'Take your time. Nothing is sent until the very end.',
          hi: 'आराम से करें। आखिर तक कुछ नहीं भेजा जाता।',
          mr: 'सावकाश करा. शेवटपर्यंत काहीही पाठवले जात नाही.',
          bn: 'ধীরে করুন। একদম শেষ পর্যন্ত কিছু পাঠানো হয় না।',
        },
      },
      {
        text: {
          en: 'You will see your recent contacts, a blue "New payment" button, and "Scan any QR code" at the top.',
          hi: 'आपको हाल के संपर्क, नीला "New payment" बटन, और ऊपर "Scan any QR code" दिखेगा।',
          mr: 'तुम्हाला अलीकडील संपर्क, निळे "New payment" बटण, आणि वर "Scan any QR code" दिसेल.',
          bn: 'আপনি সাম্প্রতিক কন্টাক্ট, নীল "New payment" বোতাম, আর উপরে "Scan any QR code" দেখবেন।',
        },
        illustrationHint: 'Google Pay home: contacts grid, blue New payment button, Scan QR at top.',
        image: '/walkthrough/app-home.svg',
      },
      {
        choice: true,
        text: choiceText,
        illustrationHint: 'Two large buttons: "Scan QR" and "Type number".',
        image: '/walkthrough/two-choice.svg',
        options: choiceOptions,
        branches: {
          qr: [
            {
              text: {
                en: 'Tap "Scan any QR code" at the top of the screen.',
                hi: 'स्क्रीन के ऊपर "Scan any QR code" दबाएँ।',
                mr: 'स्क्रीनच्या वर "Scan any QR code" दाबा.',
                bn: 'স্ক্রিনের উপরে "Scan any QR code"-এ চাপুন।',
              },
              illustrationHint: 'Tapping Scan any QR code; the camera opens.',
              image: '/walkthrough/tap-scan.svg',
              warningHint: {
                en: 'Allow camera access if the phone asks.',
                hi: 'अगर फोन कैमरा माँगे तो अनुमति दें।',
                mr: 'फोनने कॅमेरा मागितल्यास परवानगी द्या.',
                bn: 'ফোন ক্যামেরা চাইলে অনুমতি দিন।',
              },
            },
            pointCameraStep,
          ],
          manual: [
            {
              text: {
                en: 'Tap the blue "New payment" button.',
                hi: 'नीला "New payment" बटन दबाएँ।',
                mr: 'निळे "New payment" बटण दाबा.',
                bn: 'নীল "New payment" বোতামে চাপুন।',
              },
              illustrationHint: 'The blue New payment button.',
              image: '/walkthrough/tap-button.svg',
            },
            {
              text: {
                en: 'Choose "Pay phone number".',
                hi: '"Pay phone number" चुनें।',
                mr: '"Pay phone number" निवडा.',
                bn: '"Pay phone number" বেছে নিন।',
              },
              illustrationHint: 'A Pay phone number option.',
              image: '/walkthrough/tap-contact.svg',
            },
            typeNumberStep,
            confirmNameStep,
          ],
        },
      },
      ...SHARED_TAIL,
    ],
  },

  // ── 3. Paytm ────────────────────────────────────────────────
  {
    id: 'upi_paytm',
    app: 'Paytm',
    color: '#00BAF2',
    short: 'PT',
    title: { en: 'Send money with Paytm', hi: 'Paytm से पैसे भेजें', mr: 'Paytm ने पैसे पाठवा', bn: 'Paytm দিয়ে টাকা পাঠান' },
    steps: [
      {
        text: {
          en: 'Open the blue Paytm app on your phone.',
          hi: 'अपने फोन में नीला Paytm ऐप खोलें।',
          mr: 'तुमच्या फोनमध्ये निळे Paytm ॲप उघडा.',
          bn: 'আপনার ফোনে নীল Paytm অ্যাপ খুলুন।',
        },
        illustrationHint: 'Phone home screen with the blue Paytm icon circled.',
        image: '/walkthrough/open-app.svg',
        reassurance: {
          en: 'Take your time. Nothing is sent until the very end.',
          hi: 'आराम से करें। आखिर तक कुछ नहीं भेजा जाता।',
          mr: 'सावकाश करा. शेवटपर्यंत काहीही पाठवले जात नाही.',
          bn: 'ধীরে করুন। একদম শেষ পর্যন্ত কিছু পাঠানো হয় না।',
        },
      },
      {
        text: {
          en: 'At the top you will see a big "Scan & Pay" button and a "To Mobile or Contact" option.',
          hi: 'ऊपर बड़ा "Scan & Pay" बटन और "To Mobile or Contact" विकल्प दिखेगा।',
          mr: 'वर मोठे "Scan & Pay" बटण आणि "To Mobile or Contact" पर्याय दिसेल.',
          bn: 'উপরে বড় "Scan & Pay" বোতাম আর "To Mobile or Contact" অপশন দেখবেন।',
        },
        illustrationHint: 'Paytm home: Scan & Pay button and To Mobile or Contact tile near top.',
        image: '/walkthrough/app-home.svg',
      },
      {
        choice: true,
        text: choiceText,
        illustrationHint: 'Two large buttons: "Scan QR" and "Type number".',
        image: '/walkthrough/two-choice.svg',
        options: choiceOptions,
        branches: {
          qr: [
            {
              text: {
                en: 'Tap the "Scan & Pay" button at the top.',
                hi: 'ऊपर "Scan & Pay" बटन दबाएँ।',
                mr: 'वर "Scan & Pay" बटण दाबा.',
                bn: 'উপরে "Scan & Pay" বোতামে চাপুন।',
              },
              illustrationHint: 'Tapping Scan & Pay; the camera opens.',
              image: '/walkthrough/tap-scan.svg',
              warningHint: {
                en: 'Allow camera access if the phone asks.',
                hi: 'अगर फोन कैमरा माँगे तो अनुमति दें।',
                mr: 'फोनने कॅमेरा मागितल्यास परवानगी द्या.',
                bn: 'ফোন ক্যামেরা চাইলে অনুমতি দিন।',
              },
            },
            pointCameraStep,
          ],
          manual: [
            {
              text: {
                en: 'Tap "To Mobile or Contact".',
                hi: '"To Mobile or Contact" दबाएँ।',
                mr: '"To Mobile or Contact" दाबा.',
                bn: '"To Mobile or Contact"-এ চাপুন।',
              },
              illustrationHint: 'Tapping the To Mobile or Contact option.',
              image: '/walkthrough/tap-contact.svg',
            },
            typeNumberStep,
            confirmNameStep,
          ],
        },
      },
      ...SHARED_TAIL,
    ],
  },

  // ── 4. Amazon Pay (inside the Amazon app) ───────────────────
  {
    id: 'upi_amazonpay',
    app: 'Amazon Pay',
    color: '#FF9900',
    short: 'az',
    title: { en: 'Send money with Amazon Pay', hi: 'Amazon Pay से पैसे भेजें', mr: 'Amazon Pay ने पैसे पाठवा', bn: 'Amazon Pay দিয়ে টাকা পাঠান' },
    steps: [
      {
        text: {
          en: 'Open the Amazon app (dark colour with an orange smile).',
          hi: 'Amazon ऐप खोलें (गहरे रंग में नारंगी मुस्कान वाला)।',
          mr: 'Amazon ॲप उघडा (गडद रंगात नारंगी स्माईल असलेले).',
          bn: 'Amazon অ্যাপ খুলুন (গাঢ় রঙে কমলা হাসি সহ)।',
        },
        illustrationHint: 'Phone home screen with the dark Amazon icon (orange smile) circled.',
        image: '/walkthrough/open-app.svg',
        reassurance: {
          en: 'Amazon Pay lives inside the normal Amazon shopping app.',
          hi: 'Amazon Pay सामान्य Amazon शॉपिंग ऐप के अंदर ही होता है।',
          mr: 'Amazon Pay नेहमीच्या Amazon शॉपिंग ॲपमध्येच असते.',
          bn: 'Amazon Pay সাধারণ Amazon শপিং অ্যাপের ভিতরেই থাকে।',
        },
      },
      {
        text: {
          en: 'Tap the menu — the three lines at the top.',
          hi: 'मेन्यू दबाएँ — ऊपर तीन लकीरें।',
          mr: 'मेनू दाबा — वर तीन रेषा.',
          bn: 'মেনু চাপুন — উপরে তিনটি লাইন।',
        },
        illustrationHint: 'Tapping the hamburger menu (three lines).',
        image: '/walkthrough/tap-menu.svg',
      },
      {
        text: {
          en: 'Open the "Amazon Pay" section.',
          hi: '"Amazon Pay" वाला हिस्सा खोलें।',
          mr: '"Amazon Pay" विभाग उघडा.',
          bn: '"Amazon Pay" অংশটি খুলুন।',
        },
        illustrationHint: 'Amazon Pay highlighted in the menu list.',
        image: '/walkthrough/list-select.svg',
      },
      {
        text: {
          en: 'Inside Amazon Pay you will see "Scan any QR" and "Send money".',
          hi: 'Amazon Pay के अंदर "Scan any QR" और "Send money" दिखेगा।',
          mr: 'Amazon Pay मध्ये "Scan any QR" आणि "Send money" दिसेल.',
          bn: 'Amazon Pay-এর ভিতরে "Scan any QR" আর "Send money" দেখবেন।',
        },
        illustrationHint: 'Amazon Pay screen with Scan any QR and Send money tiles.',
        image: '/walkthrough/app-home.svg',
      },
      {
        choice: true,
        text: choiceText,
        illustrationHint: 'Two large buttons: "Scan QR" and "Type number".',
        image: '/walkthrough/two-choice.svg',
        options: choiceOptions,
        branches: {
          qr: [
            {
              text: {
                en: 'Tap "Scan any QR".',
                hi: '"Scan any QR" दबाएँ।',
                mr: '"Scan any QR" दाबा.',
                bn: '"Scan any QR"-এ চাপুন।',
              },
              illustrationHint: 'Tapping Scan any QR; the camera opens.',
              image: '/walkthrough/tap-scan.svg',
              warningHint: {
                en: 'Allow camera access if the phone asks.',
                hi: 'अगर फोन कैमरा माँगे तो अनुमति दें।',
                mr: 'फोनने कॅमेरा मागितल्यास परवानगी द्या.',
                bn: 'ফোন ক্যামেরা চাইলে অনুমতি দিন।',
              },
            },
            pointCameraStep,
          ],
          manual: [
            {
              text: {
                en: 'Tap "Send money".',
                hi: '"Send money" दबाएँ।',
                mr: '"Send money" दाबा.',
                bn: '"Send money"-তে চাপুন।',
              },
              illustrationHint: 'Tapping the Send money option.',
              image: '/walkthrough/tap-contact.svg',
            },
            typeNumberStep,
            confirmNameStep,
          ],
        },
      },
      ...SHARED_TAIL,
    ],
  },

  // ── 5. BHIM (government app, simple — good for basic phones) ─
  {
    id: 'upi_bhim',
    app: 'BHIM',
    color: '#097939',
    short: 'B',
    title: { en: 'Send money with BHIM', hi: 'BHIM से पैसे भेजें', mr: 'BHIM ने पैसे पाठवा', bn: 'BHIM দিয়ে টাকা পাঠান' },
    steps: [
      {
        text: {
          en: 'Open the BHIM app. It is the simple government app with big buttons.',
          hi: 'BHIM ऐप खोलें। यह बड़े बटनों वाला आसान सरकारी ऐप है।',
          mr: 'BHIM ॲप उघडा. हे मोठ्या बटणांचे सोपे सरकारी ॲप आहे.',
          bn: 'BHIM অ্যাপ খুলুন। এটি বড় বোতামওয়ালা সহজ সরকারি অ্যাপ।',
        },
        illustrationHint: 'Phone home screen with the tricolour BHIM icon circled.',
        image: '/walkthrough/open-app.svg',
        reassurance: {
          en: 'BHIM is made simple on purpose. It works well on basic phones too.',
          hi: 'BHIM जानबूझकर आसान बनाया गया है। यह साधारण फोन पर भी अच्छा चलता है।',
          mr: 'BHIM मुद्दामच सोपे बनवले आहे. ते साध्या फोनवरही चांगले चालते.',
          bn: 'BHIM ইচ্ছে করেই সহজ রাখা হয়েছে। সাধারণ ফোনেও ভালো চলে।',
        },
      },
      {
        text: {
          en: 'The home screen shows large buttons: "Send Money", "Request", and "Scan & Pay".',
          hi: 'होम स्क्रीन पर बड़े बटन दिखते हैं: "Send Money", "Request", और "Scan & Pay"।',
          mr: 'होम स्क्रीनवर मोठी बटणे दिसतात: "Send Money", "Request", आणि "Scan & Pay".',
          bn: 'হোম স্ক্রিনে বড় বোতাম দেখায়: "Send Money", "Request", আর "Scan & Pay"।',
        },
        illustrationHint: 'BHIM home with three large buttons.',
        image: '/walkthrough/app-home.svg',
      },
      {
        choice: true,
        text: choiceText,
        illustrationHint: 'Two large buttons: "Scan QR" and "Type number".',
        image: '/walkthrough/two-choice.svg',
        options: choiceOptions,
        branches: {
          qr: [
            {
              text: {
                en: 'Tap the "Scan & Pay" button.',
                hi: '"Scan & Pay" बटन दबाएँ।',
                mr: '"Scan & Pay" बटण दाबा.',
                bn: '"Scan & Pay" বোতামে চাপুন।',
              },
              illustrationHint: 'Tapping Scan & Pay; the camera opens.',
              image: '/walkthrough/tap-scan.svg',
              warningHint: {
                en: 'Allow camera access if the phone asks.',
                hi: 'अगर फोन कैमरा माँगे तो अनुमति दें।',
                mr: 'फोनने कॅमेरा मागितल्यास परवानगी द्या.',
                bn: 'ফোন ক্যামেরা চাইলে অনুমতি দিন।',
              },
            },
            pointCameraStep,
          ],
          manual: [
            {
              text: {
                en: 'Tap "Send Money".',
                hi: '"Send Money" दबाएँ।',
                mr: '"Send Money" दाबा.',
                bn: '"Send Money"-তে চাপুন।',
              },
              illustrationHint: 'Tapping the Send Money button.',
              image: '/walkthrough/tap-contact.svg',
            },
            typeNumberStep,
            confirmNameStep,
          ],
        },
      },
      ...SHARED_TAIL,
    ],
  },
]

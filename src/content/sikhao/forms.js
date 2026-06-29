// "Fill a Form" flows — a government form (Aadhaar / ration card / certificate)
// and a school/college admission form.

// ── shared steps ───────────────────────────────────────────────────────
const reviewStep = {
  text: {
    en: 'Read every box once more, slowly. Fix any spelling mistake in your name or date of birth.',
    hi: 'हर खाने को एक बार फिर धीरे-धीरे पढ़ें। नाम या जन्म तारीख की कोई गलती सुधारें।',
    mr: 'प्रत्येक रकाना पुन्हा एकदा सावकाश वाचा. नाव किंवा जन्मतारखेतील चूक दुरुस्त करा.',
    bn: 'প্রতিটি ঘর আরেকবার ধীরে পড়ুন। নাম বা জন্মতারিখে কোনো ভুল থাকলে ঠিক করুন।',
  },
  illustrationHint: 'A filled form with a magnifying glass over the name and date of birth.',
  image: '/walkthrough/form-fields.svg',
  warningHint: {
    en: 'After you submit, many details cannot be changed. Check now.',
    hi: 'जमा करने के बाद कई बातें बदली नहीं जा सकतीं। अभी जाँच लें।',
    mr: 'सबमिट केल्यावर अनेक गोष्टी बदलता येत नाहीत. आताच तपासा.',
    bn: 'সাবমিট করার পর অনেক তথ্য বদলানো যায় না। এখনই দেখে নিন।',
  },
}

const feePayStep = {
  text: {
    en: 'If a fee is asked, tap "Pay", choose UPI, and enter your UPI PIN.',
    hi: 'अगर फीस माँगी जाए, "Pay" दबाएँ, UPI चुनें, और अपना UPI PIN डालें।',
    mr: 'फी मागितल्यास, "Pay" दाबा, UPI निवडा, आणि तुमचा UPI PIN टाका.',
    bn: 'ফি চাইলে, "Pay" চাপুন, UPI বেছে নিন, আর UPI PIN দিন।',
  },
  illustrationHint: 'A fee payment screen with a UPI PIN keypad.',
  image: '/walkthrough/pin-keypad.svg',
  reassurance: {
    en: 'Same safe UPI PIN as before. Some forms are free and skip this.',
    hi: 'पहले जैसा सुरक्षित UPI PIN। कुछ फॉर्म मुफ़्त होते हैं और यह छोड़ देते हैं।',
    mr: 'आधीसारखाच सुरक्षित UPI PIN. काही फॉर्म मोफत असतात आणि हे वगळतात.',
    bn: 'আগের মতোই নিরাপদ UPI PIN। কিছু ফর্ম ফ্রি, এটি বাদ যায়।',
  },
}

const saveAckStep = {
  text: {
    en: 'After submitting, note the application number and take a screenshot or print the acknowledgement.',
    hi: 'जमा करने के बाद आवेदन संख्या नोट करें और स्क्रीनशॉट लें या रसीद प्रिंट करें।',
    mr: 'सबमिट केल्यावर अर्ज क्रमांक नोंदवा आणि स्क्रीनशॉट घ्या किंवा पावती प्रिंट करा.',
    bn: 'সাবমিট করার পর আবেদন নম্বর লিখে রাখুন আর স্ক্রিনশট নিন বা রসিদ প্রিন্ট করুন।',
  },
  illustrationHint: 'An acknowledgement page with the application number highlighted.',
  image: '/walkthrough/reference-number.svg',
  reassurance: {
    en: 'That number is how you check your form later. Keep it safe.',
    hi: 'उसी नंबर से आप बाद में अपना फॉर्म देख सकते हैं। उसे संभालें।',
    mr: 'त्याच नंबराने तुम्ही नंतर तुमचा फॉर्म पाहू शकता. तो जपा.',
    bn: 'সেই নম্বর দিয়েই পরে ফর্ম দেখতে পারবেন। রেখে দিন।',
  },
}

export const FORM_FLOWS = [
  // ── 1. Government form ─────────────────────────────────────────────────
  {
    id: 'form_government',
    app: 'Government',
    color: '#2A6F4E',
    short: 'Gov',
    title: {
      en: 'Fill a government form',
      hi: 'सरकारी फॉर्म भरें',
      mr: 'सरकारी फॉर्म भरा',
      bn: 'সরকারি ফর্ম পূরণ করুন',
    },
    steps: [
      {
        text: {
          en: 'Open the official government website in your browser. Its address ends in ".gov.in".',
          hi: 'अपने ब्राउज़र में आधिकारिक सरकारी वेबसाइट खोलें। इसका पता ".gov.in" पर खत्म होता है।',
          mr: 'तुमच्या ब्राउझरमध्ये अधिकृत सरकारी वेबसाइट उघडा. तिचा पत्ता ".gov.in" ने संपतो.',
          bn: 'আপনার ব্রাউজারে সরকারি ওয়েবসাইট খুলুন। এর ঠিকানা ".gov.in" দিয়ে শেষ হয়।',
        },
        illustrationHint: 'A browser address bar showing a .gov.in website.',
        image: '/walkthrough/browser-url.svg',
        warningHint: {
          en: 'Use only ".gov.in" sites. Other lookalike sites can be fake.',
          hi: 'सिर्फ ".gov.in" साइट इस्तेमाल करें। मिलती-जुलती दूसरी साइट नकली हो सकती हैं।',
          mr: 'फक्त ".gov.in" साइट वापरा. सारख्या दिसणाऱ्या इतर साइट बनावट असू शकतात.',
          bn: 'শুধু ".gov.in" সাইট ব্যবহার করুন। দেখতে একই রকম অন্য সাইট নকল হতে পারে।',
        },
      },
      {
        text: {
          en: 'Find and tap "Apply" or "New Registration".',
          hi: '"Apply" या "New Registration" ढूँढ़कर दबाएँ।',
          mr: '"Apply" किंवा "New Registration" शोधून दाबा.',
          bn: '"Apply" বা "New Registration" খুঁজে চাপুন।',
        },
        illustrationHint: 'An Apply / New Registration button on the portal.',
        image: '/walkthrough/tap-button.svg',
      },
      {
        text: {
          en: 'Fill your name, date of birth, and address exactly as written on your documents.',
          hi: 'अपना नाम, जन्म तारीख और पता ठीक वैसे भरें जैसे आपके कागज़ों पर लिखा है।',
          mr: 'तुमचे नाव, जन्मतारीख आणि पत्ता तुमच्या कागदपत्रांवर लिहिल्याप्रमाणेच भरा.',
          bn: 'আপনার নাম, জন্মতারিখ ও ঠিকানা ঠিক যেমন কাগজে লেখা তেমনই লিখুন।',
        },
        illustrationHint: 'A form with name, DOB, and address fields.',
        image: '/walkthrough/form-fields.svg',
        warningHint: {
          en: 'Spelling must match your documents, or the form may be rejected.',
          hi: 'वर्तनी कागज़ों से मिलनी चाहिए, वरना फॉर्म रद्द हो सकता है।',
          mr: 'शब्दलेखन कागदपत्रांशी जुळले पाहिजे, नाहीतर फॉर्म नाकारला जाऊ शकतो.',
          bn: 'বানান কাগজের সঙ্গে মিলতে হবে, নাহলে ফর্ম বাতিল হতে পারে।',
        },
      },
      {
        text: {
          en: 'When it asks for your Aadhaar number, type the 12 digits slowly and carefully.',
          hi: 'जब आधार नंबर माँगे, 12 अंक धीरे और ध्यान से टाइप करें।',
          mr: 'आधार क्रमांक मागितल्यावर, 12 अंक सावकाश आणि काळजीपूर्वक टाका.',
          bn: 'আধার নম্বর চাইলে, ১২টি সংখ্যা ধীরে ও যত্ন করে লিখুন।',
        },
        illustrationHint: 'A 12-digit Aadhaar number being typed into a field.',
        image: '/walkthrough/number-entry.svg',
        reassurance: {
          en: 'It is normal and safe for an official .gov.in form to ask for your Aadhaar number.',
          hi: 'किसी आधिकारिक .gov.in फॉर्म का आधार नंबर माँगना सामान्य और सुरक्षित है।',
          mr: 'अधिकृत .gov.in फॉर्मने आधार क्रमांक मागणे सामान्य आणि सुरक्षित आहे.',
          bn: 'অফিসিয়াল .gov.in ফর্মের আধার নম্বর চাওয়া স্বাভাবিক ও নিরাপদ।',
        },
      },
      {
        text: {
          en: 'It sends an OTP to your Aadhaar-linked phone. Type that 6-digit code to verify.',
          hi: 'यह आपके आधार से जुड़े फोन पर OTP भेजता है। पुष्टि के लिए वह 6 अंकों का कोड डालें।',
          mr: 'ते तुमच्या आधारशी जोडलेल्या फोनवर OTP पाठवते. पडताळणीसाठी तो 6 अंकी कोड टाका.',
          bn: 'এটি আপনার আধার-যুক্ত ফোনে OTP পাঠায়। যাচাই করতে সেই ৬ সংখ্যার কোড দিন।',
        },
        illustrationHint: 'An OTP arriving by SMS and being entered.',
        image: '/walkthrough/otp.svg',
        warningHint: {
          en: 'Type the OTP into the website only. Never read it out to a caller.',
          hi: 'OTP सिर्फ वेबसाइट में डालें। किसी कॉल करने वाले को कभी न बताएं।',
          mr: 'OTP फक्त वेबसाइटवर टाका. कॉल करणाऱ्याला कधीही सांगू नका.',
          bn: 'OTP শুধু ওয়েবসাইটে দিন। কোনো কলারকে কখনও বলবেন না।',
        },
      },
      {
        text: {
          en: 'Tap "Upload", then choose a clear photo or scan of the asked document.',
          hi: '"Upload" दबाएँ, फिर माँगे गए दस्तावेज़ की साफ़ फोटो या स्कैन चुनें।',
          mr: '"Upload" दाबा, मग मागितलेल्या कागदपत्राचा स्पष्ट फोटो किंवा स्कॅन निवडा.',
          bn: '"Upload" চাপুন, তারপর চাওয়া নথির পরিষ্কার ছবি বা স্ক্যান বেছে নিন।',
        },
        illustrationHint: 'An upload button and a clear document photo being selected.',
        image: '/walkthrough/upload.svg',
        warningHint: {
          en: 'The photo must be clear and show the whole document, usually under 2 MB.',
          hi: 'फोटो साफ़ हो और पूरा दस्तावेज़ दिखे, आमतौर पर 2 MB से कम।',
          mr: 'फोटो स्पष्ट असावा आणि पूर्ण कागदपत्र दिसावे, सहसा 2 MB पेक्षा कमी.',
          bn: 'ছবি পরিষ্কার হতে হবে আর পুরো নথি দেখাতে হবে, সাধারণত ২ MB-এর কম।',
        },
      },
      reviewStep,
      {
        text: {
          en: 'Tap "Submit". The form is sent to the government office.',
          hi: '"Submit" दबाएँ। फॉर्म सरकारी दफ़्तर को भेज दिया जाता है।',
          mr: '"Submit" दाबा. फॉर्म सरकारी कार्यालयाला पाठवला जातो.',
          bn: '"Submit" চাপুন। ফর্ম সরকারি অফিসে পাঠানো হয়।',
        },
        illustrationHint: 'A Submit button being tapped.',
        image: '/walkthrough/tap-button.svg',
      },
      feePayStep,
      saveAckStep,
    ],
  },

  // ── 2. School / college admission form ────────────────────────────────
  {
    id: 'form_admission',
    app: 'Admission',
    color: '#7C3AED',
    short: 'Sch',
    title: {
      en: 'Fill an admission form',
      hi: 'दाखिले का फॉर्म भरें',
      mr: 'प्रवेशाचा फॉर्म भरा',
      bn: 'ভর্তির ফর্ম পূরণ করুন',
    },
    steps: [
      {
        text: {
          en: 'Open the school or college admission website in your browser.',
          hi: 'अपने ब्राउज़र में स्कूल या कॉलेज की दाखिला वेबसाइट खोलें।',
          mr: 'तुमच्या ब्राउझरमध्ये शाळा किंवा कॉलेजची प्रवेश वेबसाइट उघडा.',
          bn: 'আপনার ব্রাউজারে স্কুল বা কলেজের ভর্তির ওয়েবসাইট খুলুন।',
        },
        illustrationHint: 'An admission portal home page in a browser.',
        image: '/walkthrough/browser-url.svg',
      },
      {
        text: {
          en: 'Tap "Register" to start a new application.',
          hi: 'नया आवेदन शुरू करने के लिए "Register" दबाएँ।',
          mr: 'नवीन अर्ज सुरू करण्यासाठी "Register" दाबा.',
          bn: 'নতুন আবেদন শুরু করতে "Register" চাপুন।',
        },
        illustrationHint: 'A Register button on the portal.',
        image: '/walkthrough/tap-button.svg',
      },
      {
        text: {
          en: 'Type your mobile number and email to create a login.',
          hi: 'लॉगिन बनाने के लिए अपना मोबाइल नंबर और ईमेल डालें।',
          mr: 'लॉगिन तयार करण्यासाठी तुमचा मोबाइल नंबर आणि ईमेल टाका.',
          bn: 'লগইন তৈরি করতে আপনার মোবাইল নম্বর ও ইমেল দিন।',
        },
        illustrationHint: 'Mobile number and email fields.',
        image: '/walkthrough/form-fields.svg',
        reassurance: {
          en: 'Write your login and password on paper so you can come back later.',
          hi: 'अपना लॉगिन और पासवर्ड कागज़ पर लिख लें ताकि बाद में लौट सकें।',
          mr: 'तुमचे लॉगिन आणि पासवर्ड कागदावर लिहा जेणेकरून नंतर परत येता येईल.',
          bn: 'আপনার লগইন ও পাসওয়ার্ড কাগজে লিখে রাখুন যাতে পরে ফিরে আসতে পারেন।',
        },
      },
      {
        text: {
          en: 'Verify with the OTP it sends to your phone.',
          hi: 'फोन पर आए OTP से पुष्टि करें।',
          mr: 'फोनवर आलेल्या OTP ने पडताळणी करा.',
          bn: 'ফোনে আসা OTP দিয়ে যাচাই করুন।',
        },
        illustrationHint: 'An OTP verification box.',
        image: '/walkthrough/otp.svg',
      },
      {
        text: {
          en: "Fill the student's name, date of birth, parents' names, and last school or marks.",
          hi: 'छात्र का नाम, जन्म तारीख, माता-पिता के नाम, और पिछला स्कूल या अंक भरें।',
          mr: 'विद्यार्थ्याचे नाव, जन्मतारीख, पालकांची नावे, आणि मागील शाळा किंवा गुण भरा.',
          bn: 'শিক্ষার্থীর নাম, জন্মতারিখ, বাবা-মায়ের নাম, আর আগের স্কুল বা নম্বর লিখুন।',
        },
        illustrationHint: 'Student detail fields being filled in.',
        image: '/walkthrough/form-fields.svg',
      },
      {
        text: {
          en: 'Upload the photo: a passport-size photo with a light background, usually 50–200 KB.',
          hi: 'फोटो अपलोड करें: हल्के बैकग्राउंड वाली पासपोर्ट साइज़ फोटो, आमतौर पर 50–200 KB।',
          mr: 'फोटो अपलोड करा: फिकट पार्श्वभूमी असलेला पासपोर्ट आकाराचा फोटो, सहसा 50–200 KB.',
          bn: 'ছবি আপলোড করুন: হালকা ব্যাকগ্রাউন্ডের পাসপোর্ট সাইজ ছবি, সাধারণত ৫০–২০০ KB।',
        },
        illustrationHint: 'A passport-size photo with a light background being uploaded.',
        image: '/walkthrough/upload.svg',
        warningHint: {
          en: 'If the photo is too big, the site will refuse it. Use a smaller, clear photo.',
          hi: 'फोटो बहुत बड़ी हो तो साइट नहीं लेगी। छोटी और साफ़ फोटो इस्तेमाल करें।',
          mr: 'फोटो खूप मोठा असेल तर साइट घेणार नाही. लहान आणि स्पष्ट फोटो वापरा.',
          bn: 'ছবি খুব বড় হলে সাইট নেবে না। ছোট ও পরিষ্কার ছবি ব্যবহার করুন।',
        },
      },
      {
        text: {
          en: 'Upload your signature: sign on white paper, photograph it, and choose that picture.',
          hi: 'हस्ताक्षर अपलोड करें: सफ़ेद कागज़ पर दस्तखत करें, उसकी फोटो लें, और वह तस्वीर चुनें।',
          mr: 'सही अपलोड करा: पांढऱ्या कागदावर सही करा, त्याचा फोटो घ्या, आणि ती तस्वीर निवडा.',
          bn: 'স্বাক্ষর আপলোড করুন: সাদা কাগজে সই করুন, ছবি তুলুন, আর সেই ছবি বেছে নিন।',
        },
        illustrationHint: 'A signature on white paper being photographed and uploaded.',
        image: '/walkthrough/upload.svg',
      },
      {
        text: {
          en: 'Upload the documents asked for, such as the marksheet and birth certificate.',
          hi: 'माँगे गए दस्तावेज़ अपलोड करें, जैसे मार्कशीट और जन्म प्रमाण पत्र।',
          mr: 'मागितलेली कागदपत्रे अपलोड करा, जसे गुणपत्रिका आणि जन्म दाखला.',
          bn: 'চাওয়া নথি আপলোড করুন, যেমন মার্কশিট আর জন্ম শংসাপত্র।',
        },
        illustrationHint: 'Marksheet and birth certificate being uploaded.',
        image: '/walkthrough/upload.svg',
      },
      {
        text: {
          en: 'Choose the class or course you are applying for.',
          hi: 'जिस कक्षा या कोर्स के लिए आवेदन कर रहे हैं उसे चुनें।',
          mr: 'तुम्ही ज्या वर्गासाठी किंवा कोर्ससाठी अर्ज करत आहात तो निवडा.',
          bn: 'আপনি যে ক্লাস বা কোর্সের জন্য আবেদন করছেন তা বেছে নিন।',
        },
        illustrationHint: 'A dropdown of classes or courses.',
        image: '/walkthrough/list-select.svg',
      },
      reviewStep,
      feePayStep,
      saveAckStep,
    ],
  },
]

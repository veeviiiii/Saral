import { UPI_FLOWS } from './upi.js'
import { RECHARGE_FLOWS } from './recharge.js'
import { GAS_FLOWS } from './gas.js'
import { FORM_FLOWS } from './forms.js'

// Sikhao content grouped by category. Each category carries its own localized
// label; the Sikhao list renders one section per non-empty category.
export const CATEGORIES = [
  {
    id: 'send_money',
    icon: '💸',
    label: { hi: 'पैसे भेजें', en: 'Send Money', mr: 'पैसे पाठवा', bn: 'টাকা পাঠান', ta: 'பணம் அனுப்புங்கள்', te: 'డబ్బు పంపండి', kn: 'ಹಣ ಕಳುಹಿಸಿ', ml: 'പണം അയക്കൂ', gu: 'પૈસા મોકલો', pa: 'ਪੈਸੇ ਭੇਜੋ', or: 'ଟଙ୍କା ପଠାନ୍ତୁ', as: 'টকা পঠাওক', ur: 'پیسے بھیجیں', sa: 'धनं प्रेषयतु', ne: 'पैसा पठाउनुहोस्', kok: 'पयशे धाड' },
    flows: UPI_FLOWS,
  },
  {
    id: 'recharge',
    icon: '📱',
    label: { hi: 'रिचार्ज करें', en: 'Recharge', mr: 'रिचार्ज करा', bn: 'রিচার্জ করুন', ta: 'ரீசார்ஜ்', te: 'రీఛార్జ్', kn: 'ರೀಚಾರ್ಜ್', ml: 'റീചാർജ്', gu: 'રિચાર્જ', pa: 'ਰਿਚਾਰਜ', or: 'ରିଚାର୍ଜ', as: 'ৰিচাৰ্জ', ur: 'ری چارج', sa: 'पुनर्भरणम्', ne: 'रिचार्ज', kok: 'रिचार्ज' },
    flows: RECHARGE_FLOWS,
  },
  {
    id: 'gas',
    icon: '🛢️',
    label: { hi: 'गैस सिलेंडर', en: 'Gas Cylinder', mr: 'गॅस सिलिंडर', bn: 'গ্যাস সিলিন্ডার', ta: 'எரிவாயு சிலிண்டர்', te: 'గ్యాస్ సిలిండర్', kn: 'ಗ್ಯಾಸ್ ಸಿಲಿಂಡರ್', ml: 'ഗ്യാസ് സിലിണ്ടർ', gu: 'ગૅસ સિલિન્ડર', pa: 'ਗੈਸ ਸਿਲੰਡਰ', or: 'ଗ୍ୟାସ୍ ସିଲିଣ୍ଡର', as: 'গেছ চিলিণ্ডাৰ', ur: 'گیس سلنڈر', sa: 'गैस्-सिलिण्डरम्', ne: 'ग्यास सिलिन्डर', kok: 'गॅस सिलिंडर' },
    flows: GAS_FLOWS,
  },
  {
    id: 'forms',
    icon: '📝',
    label: { hi: 'फॉर्म भरें', en: 'Fill a Form', mr: 'फॉर्म भरा', bn: 'ফর্ম পূরণ করুন', ta: 'படிவம் நிரப்புங்கள்', te: 'ఫారం నింపండి', kn: 'ಫಾರಂ ತುಂಬಿ', ml: 'ഫോം പൂരിപ്പിക്കൂ', gu: 'ફોર્મ ભરો', pa: 'ਫਾਰਮ ਭਰੋ', or: 'ଫର୍ମ ପୂରଣ କରନ୍ତୁ', as: 'ফৰ্ম পূৰণ কৰক', ur: 'فارم بھریں', sa: 'प्रपत्रं पूरयतु', ne: 'फारम भर्नुहोस्', kok: 'फॉर्म भर' },
    flows: FORM_FLOWS,
  },
]

export const ALL_FLOWS = CATEGORIES.flatMap((c) => c.flows)

export function getFlowById(id) {
  return ALL_FLOWS.find((f) => f.id === id)
}

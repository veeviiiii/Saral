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
    label: { hi: 'पैसे भेजें', en: 'Send Money', mr: 'पैसे पाठवा', bn: 'টাকা পাঠান' },
    flows: UPI_FLOWS,
  },
  {
    id: 'recharge',
    icon: '📱',
    label: { hi: 'रिचार्ज करें', en: 'Recharge', mr: 'रिचार्ज करा', bn: 'রিচার্জ করুন' },
    flows: RECHARGE_FLOWS,
  },
  {
    id: 'gas',
    icon: '🛢️',
    label: { hi: 'गैस सिलेंडर', en: 'Gas Cylinder', mr: 'गॅस सिलिंडर', bn: 'গ্যাস সিলিন্ডার' },
    flows: GAS_FLOWS,
  },
  {
    id: 'forms',
    icon: '📝',
    label: { hi: 'फॉर्म भरें', en: 'Fill a Form', mr: 'फॉर्म भरा', bn: 'ফর্ম পূরণ করুন' },
    flows: FORM_FLOWS,
  },
]

export const ALL_FLOWS = CATEGORIES.flatMap((c) => c.flows)

export function getFlowById(id) {
  return ALL_FLOWS.find((f) => f.id === id)
}

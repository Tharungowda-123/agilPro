import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Bell, Building2, CreditCard, UserCog } from 'lucide-react'

const sections = [
  {
    id: 'profile',
    title: 'Profile & Preferences',
    description: 'Update your personal information, password, and notification preferences.',
    icon: UserCog,
    link: '/settings/profile',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control email notifications and in-app alerts for your account.',
    icon: Bell,
    link: '/users/settings?section=notifications',
  },
  {
    id: 'organization',
    title: 'Organization Settings',
    description: 'Manage organization details, teams, and company-wide defaults.',
    icon: Building2,
    link: '/organization?tab=settings',
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    description: 'View invoices, update payment methods, and manage plan upgrades.',
    icon: CreditCard,
    link: '/settings?section=billing',
  },
]

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-600">
            Manage your account, workspace, and subscription preferences.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/users/settings')}>
          Open My Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.id}
              className="p-6 border hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => navigate(section.link)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary-50 rounded-full">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              <p className="text-sm text-gray-600">{section.description}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


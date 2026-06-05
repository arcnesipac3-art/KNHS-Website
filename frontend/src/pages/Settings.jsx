import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import PortalLayout from '../components/layout/PortalLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SchoolSettingsPanelComponent from '../components/settings/SchoolSettingsPanel'
import AcademicCalendarPanelComponent from '../components/settings/AcademicCalendarPanel'

const BASE_TABS = [
  {
    id: 'profile',
    label: 'Profile',
    title: 'Profile',
    description: 'Manage name, photo, and contact information.',
  },
  {
    id: 'account',
    label: 'Account',
    title: 'Account',
    description: 'Manage password and core account security settings.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    title: 'Notifications',
    description: 'Control in-app and email updates.',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    title: 'Preferences',
    description: 'Theme and language options planned in a future phase.',
  },
]

const SCHOOL_SETTINGS_TAB = {
  id: 'school',
  label: 'School Settings',
  title: 'School Settings',
  description: 'Administrative configuration for school-wide operations.',
}

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const tabs = useMemo(
    () => (isAdmin ? [...BASE_TABS, SCHOOL_SETTINGS_TAB] : BASE_TABS),
    [isAdmin]
  )
  const [activeTab, setActiveTab] = useState('profile')

  const activePanel = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text">Settings</h1>
          <p className="mt-2 text-muted">
            Blueprint-aligned settings with one page for profile, account, notifications,
            preferences, and school configuration.
          </p>
        </div>

        <Card className="border-l-4 border-l-knhs-purple bg-gradient-to-r from-purple-50 to-white">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-knhs-purple px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Settings Hub
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Phase 1 roadmap
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text">
                School settings and academic calendar are coming soon.
              </p>
              <p className="text-sm text-muted">
                This page now follows the blueprint structure: Profile, Account,
                Notifications, Preferences, and admin-only School Settings in one
                organized settings workspace.
              </p>
              {isAdmin && (
                <p className="text-sm text-muted">
                  Administrative controls for Academic Calendar, Branding, Enrollment Toggle,
                  and Security Policies are reserved here for Phase 1 rollout.
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card title="Settings Sections" subtitle="Blueprint tab structure">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'border-knhs-purple bg-purple-50 text-knhs-purple'
                      : 'border-gray-200 text-gray-700 hover:border-knhs-purple/40 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-semibold">{tab.label}</p>
                  <p className="mt-1 text-xs text-muted">{tab.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card title={activePanel.title} subtitle={activePanel.description}>
            {activeTab === 'profile' && <ProfilePanel />}
            {activeTab === 'account' && <AccountPanel />}
            {activeTab === 'notifications' && <NotificationsPanel />}
            {activeTab === 'preferences' && <PreferencesPanel />}
            {activeTab === 'school' && isAdmin && <SchoolSettingsPanel />}
          </Card>
        </div>
      </div>
    </PortalLayout>
  )
}

function ProfilePanel() {
  return (
    <div className="space-y-4">
      <InfoBlock
        title="Profile information"
        description="Name, profile photo, and contact details are managed from your profile page."
      />
      <div className="flex flex-wrap gap-3">
        <Link to="/profile">
          <Button>Open Profile</Button>
        </Link>
      </div>
    </div>
  )
}

function AccountPanel() {
  return (
    <div className="space-y-4">
      <InfoBlock
        title="Password and access"
        description="Change your password now. Two-factor authentication is planned for Phase 3 in the blueprint."
      />
      <InfoList
        items={[
          'Change password is available today.',
          'Core account security lives under this tab.',
          '2FA remains marked for a future Phase 3 rollout.',
        ]}
      />
      <div className="flex flex-wrap gap-3">
        <Link to="/settings/password">
          <Button>Change Password</Button>
        </Link>
      </div>
    </div>
  )
}

function NotificationsPanel() {
  return (
    <div className="space-y-4">
      <InfoBlock
        title="Notification preferences"
        description="Manage in-app and email notifications now. Push notifications remain planned for Phase 3."
      />
      <InfoList
        items={[
          'Email notification controls are available.',
          'In-app notification preferences are available.',
          'Push notifications remain scheduled for Phase 3.',
        ]}
      />
      <div className="flex flex-wrap gap-3">
        <Link to="/settings/notifications">
          <Button>Manage Notifications</Button>
        </Link>
      </div>
    </div>
  )
}

function PreferencesPanel() {
  return (
    <div className="space-y-4">
      <InfoBlock
        title="Preferences"
        description="The blueprint reserves this section for language and theme settings."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatusTile
          title="Language"
          badge="Phase 3"
          description="English and Filipino language options are planned."
        />
        <StatusTile
          title="Theme"
          badge="Planned"
          description="Theme controls are reserved here for future UI personalization."
        />
      </div>
    </div>
  )
}

function SchoolSettingsPanel() {
  return <SchoolSettingsPanelComponent />
}

function InfoBlock({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}

function StatusTile({ title, badge, description }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  )
}

function InfoList({ items }) {
  return (
    <ul className="space-y-2 text-sm text-muted">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-knhs-purple" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

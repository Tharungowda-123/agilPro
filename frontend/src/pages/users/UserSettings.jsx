import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Save, Download, Trash2, Mail, Bell, Settings, Keyboard } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useEmailPreferences, useUpdateEmailPreferences } from '@/hooks/api/useEmailPreferences'
import { useUpdateUser } from '@/hooks/api/useUsers'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import FormGroup from '@/components/ui/FormGroup'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import { useShortcuts } from '@/context/ShortcutContext'
import ShortcutRecorder from '@/components/shortcuts/ShortcutRecorder'
import { SHORTCUT_GROUPS } from '@/constants/shortcuts'

/**
 * UserSettings Page
 * User account settings and preferences
 */
export default function UserSettings() {
  const { user } = useAuthStore()
  const userId = user?._id || user?.id
  const { data: emailPrefs, isLoading: prefsLoading } = useEmailPreferences(userId)
  const updateEmailPrefs = useUpdateEmailPreferences()

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    emailNotifications: true,
    inAppNotifications: true,
  })
  const theme = useThemeStore((state) => state.theme)
  const autoMode = useThemeStore((state) => state.autoMode)
  const applyTheme = useThemeStore((state) => state.applyTheme)
  const useSystemTheme = useThemeStore((state) => state.useSystemTheme)
  const contrast = useThemeStore((state) => state.contrast)
  const setContrast = useThemeStore((state) => state.setContrast)

  const [themeSelection, setThemeSelection] = useState(autoMode ? 'system' : theme)

  useEffect(() => {
    setThemeSelection(autoMode ? 'system' : theme)
  }, [autoMode, theme])


  const [emailPreferences, setEmailPreferences] = useState({
    enabled: true,
    frequency: 'instant',
    events: {
      taskAssigned: true,
      taskStatusChanged: true,
      storyAssigned: true,
      mention: true,
      commentAdded: true,
      sprintStarted: true,
      sprintCompleted: true,
      deadlineApproaching: true,
      highRiskDetected: true,
    },
  })

  const updateUser = useUpdateUser()

  // Load email preferences
  useEffect(() => {
    if (emailPrefs) {
      setEmailPreferences({
        enabled: emailPrefs.enabled !== false,
        frequency: emailPrefs.frequency || 'instant',
        events: {
          taskAssigned: emailPrefs.events?.taskAssigned !== false,
          taskStatusChanged: emailPrefs.events?.taskStatusChanged !== false,
          storyAssigned: emailPrefs.events?.storyAssigned !== false,
          mention: emailPrefs.events?.mention !== false,
          commentAdded: emailPrefs.events?.commentAdded !== false,
          sprintStarted: emailPrefs.events?.sprintStarted !== false,
          sprintCompleted: emailPrefs.events?.sprintCompleted !== false,
          deadlineApproaching: emailPrefs.events?.deadlineApproaching !== false,
          highRiskDetected: emailPrefs.events?.highRiskDetected !== false,
        },
      })
    }
  }, [emailPrefs])

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings({
        name: user.name || '',
        email: user.email || '',
        emailNotifications: true,
        inAppNotifications: true,
      })
    }
  }, [user])

  const handleSave = () => {
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    updateUser.mutate(
      {
        id: userId,
        data: {
          name: settings.name,
          email: settings.email,
        },
      },
      {
        onSuccess: (response) => {
          // Update auth store with new user data
          const updatedUser = response?.data?.user || response?.data || response
          if (updatedUser) {
            useAuthStore.getState().setUser({
              ...user,
              name: updatedUser.name || settings.name,
              email: updatedUser.email || settings.email,
            })
          }
          toast.success('Account settings saved!')
        },
      }
    )
  }

  const handleSaveEmailPreferences = () => {
    if (!userId) return
    updateEmailPrefs.mutate({
      userId,
      preferences: emailPreferences,
    })
  }

  const handleExportData = () => {
    toast.info('Data export feature coming soon')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion feature coming soon')
    }
  }

  const handleThemeSelection = (value) => {
    setThemeSelection(value)
    if (value === 'system') {
      useSystemTheme()
    } else {
      applyTheme(value)
    }
  }

  const handleContrastToggle = (enabled) => {
    setContrast(enabled ? 'high' : 'normal')
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright UI optimized for daylight environments.',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Reduces eye strain in low-light conditions.',
    },
    {
      value: 'system',
      label: 'Match System',
      description: 'Automatically follows your OS appearance.',
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Account Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
        <div className="space-y-4">
          <FormGroup label="Name">
            <Input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup label="Email">
            <Input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </FormGroup>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={updateUser.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Email Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Email Notification Preferences</h2>
        </div>
        {prefsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" color="primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Email Notifications */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={emailPreferences.enabled}
                  onChange={(e) =>
                    setEmailPreferences({ ...emailPreferences, enabled: e.target.checked })
                  }
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
              </label>
            </div>

            {/* Email Frequency */}
            {emailPreferences.enabled && (
              <>
                <FormGroup label="Email Frequency">
                  <Select
                    value={emailPreferences.frequency}
                    onChange={(e) =>
                      setEmailPreferences({ ...emailPreferences, frequency: e.target.value })
                    }
                    options={[
                      { value: 'instant', label: 'Instant - Receive emails immediately' },
                      { value: 'daily', label: 'Daily Digest - One email per day' },
                      { value: 'weekly', label: 'Weekly Digest - One email per week' },
                    ]}
                  />
                </FormGroup>

                {/* Event-specific preferences */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Choose which events to receive emails for:
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.taskAssigned}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: { ...emailPreferences.events, taskAssigned: e.target.checked },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Task assigned to me</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.taskStatusChanged}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: {
                              ...emailPreferences.events,
                              taskStatusChanged: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Task status changed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.storyAssigned}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: { ...emailPreferences.events, storyAssigned: e.target.checked },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Story assigned to me</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.mention}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: { ...emailPreferences.events, mention: e.target.checked },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">@mentioned in comment</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.commentAdded}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: { ...emailPreferences.events, commentAdded: e.target.checked },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Comment added to my story/task</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.sprintStarted}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: { ...emailPreferences.events, sprintStarted: e.target.checked },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Sprint started</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.sprintCompleted}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: {
                              ...emailPreferences.events,
                              sprintCompleted: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Sprint completed</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.deadlineApproaching}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: {
                              ...emailPreferences.events,
                              deadlineApproaching: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">Deadline approaching (1 day before)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={emailPreferences.events.highRiskDetected}
                        onChange={(e) =>
                          setEmailPreferences({
                            ...emailPreferences,
                            events: {
                              ...emailPreferences.events,
                              highRiskDetected: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-gray-700">High risk detected by AI</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSaveEmailPreferences}
                loading={updateEmailPrefs.isPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Email Preferences
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* In-App Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">In-App Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={settings.inAppNotifications}
              onChange={(e) => setSettings({ ...settings, inAppNotifications: e.target.checked })}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">In-App Notifications</p>
              <p className="text-xs text-gray-500">Receive notifications in the app</p>
            </div>
          </label>
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => {
                if (!userId) {
                  toast.error('User ID not found')
                  return
                }
                updateUser.mutate(
                  {
                    id: userId,
                    data: {
                      preferences: {
                        inAppNotifications: settings.inAppNotifications,
                      },
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success('Notification preferences saved!')
                    },
                  }
                )
              }}
              loading={updateUser.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
          <p className="text-sm text-muted">
            Theme and contrast preferences are applied immediately and saved to your device.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeSelection(option.value)}
              className={cn(
                'p-4 rounded-xl border theme-border text-left transition-all duration-200 hover:border-primary-300 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary-500',
                themeSelection === option.value &&
                  'border-primary-500 ring-1 ring-primary-500 bg-primary-50/60 dark:bg-primary-500/10'
              )}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</p>
              <p className="text-xs text-muted mt-1">{option.description}</p>
            </button>
          ))}
        </div>
        <div className="pt-4 border-t theme-border">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={contrast === 'high'}
              onChange={(e) => handleContrastToggle(e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">High contrast mode</p>
              <p className="text-xs text-muted">
                Enhances borders, focus states, and color separation for better readability.
              </p>
            </div>
          </label>
        </div>
      </Card>

      <ShortcutSettingsCard userId={userId} />

      {/* Privacy */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Data Export</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download a copy of your data in JSON format
            </p>
            <Button
              variant="outlined"
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Data
            </Button>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete your account and all associated data
            </p>
            <Button
              variant="outlined"
              onClick={handleDeleteAccount}
              className="text-error-600 border-error-300 hover:bg-error-50"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ShortcutSettingsCard({ userId }) {
  const {
    shortcuts,
    customShortcuts,
    updateShortcutBinding,
    resetShortcut,
    setUserShortcuts,
  } = useShortcuts()
  const updateUser = useUpdateUser()

  const handleComboChange = (actionId, combo) => {
    if (!combo) {
      resetShortcut(actionId)
      return
    }
    updateShortcutBinding(actionId, combo)
  }

  const handleSaveProfile = () => {
    if (!userId) {
      toast.error('Sign in to sync shortcuts to your profile')
      return
    }
    updateUser.mutate(
      {
        id: userId,
        data: {
          preferences: {
            shortcuts: customShortcuts,
          },
        },
      },
      {
        onSuccess: () => {
          setUserShortcuts(customShortcuts)
          toast.success('Shortcut preferences saved')
        },
      }
    )
  }

  const handleResetAll = () => {
    Object.keys(customShortcuts || {}).forEach((actionId) => resetShortcut(actionId))
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <p className="text-sm text-muted">
            Customize power shortcuts and sync them to your profile.
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.id} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
              {group.title}
            </p>
            <div className="space-y-3">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border theme-border bg-surface"
                >
                  <div className="min-w-[220px]">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {shortcut.label}
                    </p>
                    <p className="text-xs text-muted">{shortcut.description}</p>
                  </div>
                  <ShortcutRecorder
                    value={shortcuts[shortcut.id]}
                    onChange={(combo) => handleComboChange(shortcut.id, combo)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-4 border-t theme-border">
        <Button type="button" variant="ghost" size="sm" onClick={handleResetAll}>
          Reset All
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSaveProfile}
          loading={updateUser.isPending}
        >
          Save to Profile
        </Button>
      </div>
    </Card>
  )
}

ShortcutSettingsCard.propTypes = {
  userId: PropTypes.string,
}


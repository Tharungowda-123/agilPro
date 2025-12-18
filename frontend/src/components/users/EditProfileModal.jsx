import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Upload } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import FormGroup from '@/components/ui/FormGroup'
import Avatar from '@/components/ui/Avatar'
import { useUpdateUser } from '@/hooks/api/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'react-hot-toast'

/**
 * EditProfileModal Component
 * Modal for editing user profile
 * 
 * @example
 * <EditProfileModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   user={user}
 * />
 */
export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: '',
    timezone: '',
  })
  const [avatarPreview, setAvatarPreview] = useState(null)

  const updateUser = useUpdateUser()
  const { user: currentUser, setUser } = useAuthStore()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        email: user.email || '',
        phone: user.phone || '',
        timezone: user.timezone || '',
      })
      setAvatarPreview(user.avatar)
    }
  }, [user, isOpen])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    const userId = user._id || user.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    updateUser.mutate(
      {
        id: userId,
        data: {
          ...formData,
          avatar: avatarPreview,
        },
      },
      {
        onSuccess: (response) => {
          // Update auth store if this is the current user
          const updatedUser = response?.data?.user || response?.data || response
          if (updatedUser && currentUser && (currentUser._id === userId || currentUser.id === userId)) {
            setUser({
              ...currentUser,
              name: updatedUser.name || formData.name,
              email: updatedUser.email || formData.email,
              bio: updatedUser.bio || formData.bio,
              phone: updatedUser.phone || formData.phone,
              timezone: updatedUser.timezone || formData.timezone,
              avatar: updatedUser.avatar || avatarPreview,
            })
          }
          onClose()
          toast.success('Profile updated!')
          if (onSuccess) {
            onSuccess(updatedUser || formData)
          }
        },
      }
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Edit Profile">
      <div className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <Avatar name={formData.name} size="xl" src={avatarPreview} />
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button variant="outlined" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
                Upload Avatar
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB</p>
          </div>
        </div>

        <FormGroup label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your name"
          />
        </FormGroup>

        <FormGroup label="Bio">
          <TextArea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself"
            rows={4}
          />
        </FormGroup>

        <FormGroup label="Email" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
          />
        </FormGroup>

        <FormGroup label="Phone">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </FormGroup>

        <FormGroup label="Time Zone">
          <Input
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            placeholder="UTC-5 (EST)"
          />
        </FormGroup>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={updateUser.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

EditProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  onSuccess: PropTypes.func,
}


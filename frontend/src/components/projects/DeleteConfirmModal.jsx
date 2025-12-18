import PropTypes from 'prop-types'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

/**
 * DeleteConfirmModal Component
 * Reusable modal for delete confirmations
 * 
 * @example
 * <DeleteConfirmModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Delete Project"
 *   message="Are you sure you want to delete this project?"
 *   itemName="AgileSAFe Platform"
 * />
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item?',
  itemName,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-2">{message}</p>
            {itemName && (
              <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded">
                {itemName}
              </p>
            )}
            <p className="text-sm text-error-600 mt-3 font-medium">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="error" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

DeleteConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  itemName: PropTypes.string,
  loading: PropTypes.bool,
}


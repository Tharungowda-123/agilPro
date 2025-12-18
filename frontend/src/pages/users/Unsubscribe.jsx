import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUnsubscribe } from '@/hooks/api/useEmailPreferences'
import { CheckCircle, XCircle, Mail } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

/**
 * Unsubscribe Page
 * Handles email unsubscribe requests
 */
export default function Unsubscribe() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const unsubscribe = useUnsubscribe()

  useEffect(() => {
    if (token) {
      unsubscribe.mutate(token, {
        onSuccess: () => {
          setStatus('success')
        },
        onError: () => {
          setStatus('error')
        },
      })
    } else {
      setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Spinner size="lg" color="primary" className="mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Processing...</h1>
              <p className="text-gray-600">Unsubscribing you from email notifications</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Unsubscribed Successfully</h1>
              <p className="text-gray-600">
                You have been unsubscribed from email notifications. You will no longer receive
                emails from AgileSAFe.
              </p>
              <div className="pt-4 space-y-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/settings')}
                  leftIcon={<Mail className="w-4 h-4" />}
                >
                  Manage Email Preferences
                </Button>
                <Button variant="outlined" onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-error-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
              <p className="text-gray-600">
                This unsubscribe link is invalid or has expired. Please contact support if you
                continue to receive emails.
              </p>
              <div className="pt-4">
                <Button variant="primary" onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}


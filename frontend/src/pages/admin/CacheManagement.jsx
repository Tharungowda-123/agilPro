import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Database, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { axiosInstance as api } from '@/services/api/axiosConfig'
import { useRole } from '@/hooks/useRole'

/**
 * Cache Management Page
 * Admin-only page for viewing and managing Redis cache
 */
export default function CacheManagement() {
  const { isAdmin } = useRole()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchCacheStats()
    }
  }, [isAdmin])

  const fetchCacheStats = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/cache/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching cache stats:', error)
      toast.error('Failed to load cache statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = async (pattern = null) => {
    const confirmMessage = pattern
      ? `Clear cache for pattern "${pattern}"?`
      : 'Clear all cache? This action cannot be undone.'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsClearing(true)
      const endpoint = pattern ? `/cache/clear/${pattern}` : '/cache/clear'
      await api.delete(endpoint)
      toast.success(pattern ? `Cache cleared for ${pattern}` : 'All cache cleared')
      fetchCacheStats()
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Failed to clear cache')
    } finally {
      setIsClearing(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view this page.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cache Management</h1>
        </div>
        <Button
          variant="outlined"
          onClick={fetchCacheStats}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : stats ? (
        <>
          {/* Cache Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Total Keys
                </h3>
                <Database className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalKeys || 0}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Hit Rate
                </h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.hitRate || '0%'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.hits || 0} hits / {stats.misses || 0} misses
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions</h3>
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => clearCache()}
                loading={isClearing}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Clear All Cache
              </Button>
            </Card>
          </div>

          {/* Keys by Prefix Table */}
          {stats.keysByPrefix && Object.keys(stats.keysByPrefix).length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Keys by Prefix
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Prefix
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Count
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.keysByPrefix)
                      .sort((a, b) => b[1] - a[1])
                      .map(([prefix, count]) => (
                        <tr
                          key={prefix}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-mono text-sm">
                            {prefix}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{count}</td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => clearCache(prefix)}
                              loading={isClearing}
                              leftIcon={<Trash2 className="w-3 h-3" />}
                            >
                              Clear
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Additional Stats */}
          {stats.stats && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Redis Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.stats)
                  .filter(([key]) => !key.startsWith('#'))
                  .slice(0, 12)
                  .map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{key}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-6">
          <p className="text-gray-600 dark:text-gray-400">No cache statistics available.</p>
        </Card>
      )}
    </div>
  )
}


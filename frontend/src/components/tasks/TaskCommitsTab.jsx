import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { GitCommit, Link2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useTaskCommits, useLinkTaskCommit, useScanTaskCommits } from '@/hooks/api/useTasks'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'

export default function TaskCommitsTab({ taskId, task }) {
  const { data: commits, isLoading } = useTaskCommits(taskId)
  const linkCommit = useLinkTaskCommit()
  const scanCommits = useScanTaskCommits()

  const [formValues, setFormValues] = useState({
    commitUrl: '',
    sha: '',
    repo: '',
  })
  const [scanRepo, setScanRepo] = useState('')

  const stats = useMemo(() => {
    if (!commits || commits.length === 0) {
      return { commits: 0, additions: 0, deletions: 0, files: 0 }
    }
    return commits.reduce(
      (acc, commit) => ({
        commits: acc.commits + 1,
        additions: acc.additions + (commit.additions || 0),
        deletions: acc.deletions + (commit.deletions || 0),
        files: acc.files + (commit.filesChanged || 0),
      }),
      { commits: 0, additions: 0, deletions: 0, files: 0 }
    )
  }, [commits])

  const handleLinkCommit = () => {
    if (!formValues.commitUrl && !formValues.sha) {
      toast.error('Provide a commit URL or SHA')
      return
    }

    linkCommit.mutate(
      {
        taskId,
        data: formValues,
      },
      {
        onSuccess: () => {
          setFormValues({ commitUrl: '', sha: '', repo: formValues.repo })
        },
      }
    )
  }

  const handleScanCommits = () => {
    scanCommits.mutate({
      taskId,
      data: { repo: scanRepo || undefined },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CommitStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl bg-white">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Link Commit</h3>
            <p className="text-xs text-gray-500">
              Paste a GitHub commit URL or SHA to associate code changes with this task.
            </p>
          </div>
          <div className="p-4 space-y-3">
            <Input
              placeholder="Commit URL"
              value={formValues.commitUrl}
              onChange={(e) => setFormValues((prev) => ({ ...prev, commitUrl: e.target.value }))}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="SHA (optional)"
                value={formValues.sha}
                onChange={(e) => setFormValues((prev) => ({ ...prev, sha: e.target.value }))}
              />
              <Input
                placeholder="Repo (owner/repo)"
                value={formValues.repo}
                onChange={(e) => setFormValues((prev) => ({ ...prev, repo: e.target.value }))}
              />
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleLinkCommit}
              loading={linkCommit.isPending}
            >
              Link Commit
            </Button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-900">Auto-detect Commits</h3>
          </div>
          <div className="p-4 space-y-3">
            <Input
              placeholder="Repo override (owner/repo)"
              value={scanRepo}
              onChange={(e) => setScanRepo(e.target.value)}
            />
            <Button
              variant="outlined"
              className="w-full"
              onClick={handleScanCommits}
              loading={scanCommits.isPending}
            >
              Scan GitHub for references
            </Button>
            <p className="text-xs text-gray-500">
              Looks for commits mentioning {task?.story?.storyId || 'task ID'} or the task title.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Linked Commits ({commits?.length || 0})
          </h3>
        </div>
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          {(commits || []).length === 0 ? (
            <p className="text-sm text-gray-500">No commits linked yet.</p>
          ) : (
            commits.map((commit) => (
              <CommitCard key={commit.sha} commit={commit} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

TaskCommitsTab.propTypes = {
  taskId: PropTypes.string.isRequired,
  task: PropTypes.object.isRequired,
}

function CommitStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Commits" value={stats.commits} />
      <StatCard label="Additions" value={`+${stats.additions}`} />
      <StatCard label="Deletions" value={`-${stats.deletions}`} />
      <StatCard label="Files Changed" value={stats.files} />
    </div>
  )
}

CommitStats.propTypes = {
  stats: PropTypes.shape({
    commits: PropTypes.number,
    additions: PropTypes.number,
    deletions: PropTypes.number,
    files: PropTypes.number,
  }),
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white">
      <p className="text-xs uppercase text-gray-500 tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

function CommitCard({ commit }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {commit.message?.split('\n')[0]}
          </p>
          <p className="text-xs font-mono text-gray-500">{commit.sha?.slice(0, 12)}</p>
        </div>
        <a
          href={commit.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-primary-600 text-xs"
        >
          View <Link2 className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>{commit.authorName || 'Unknown author'}</span>
        {commit.linkedAt && (
          <span>
            linked {formatDistanceToNow(new Date(commit.linkedAt), { addSuffix: true })}
          </span>
        )}
        <Badge size="sm" variant={commit.source === 'auto' ? 'primary' : 'default'}>
          {commit.source === 'auto' ? 'Auto-detected' : 'Manual'}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Badge variant="success" size="sm">
          +{commit.additions || 0}
        </Badge>
        <Badge variant="error" size="sm">
          -{commit.deletions || 0}
        </Badge>
        <Badge variant="outlined" size="sm">
          {commit.filesChanged || 0} files
        </Badge>
      </div>
    </div>
  )
}

CommitCard.propTypes = {
  commit: PropTypes.object.isRequired,
}


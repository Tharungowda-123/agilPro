import axios from 'axios'
import logger from '../utils/logger.js'
import { BadRequestError } from '../utils/errors.js'

const DEFAULT_REPO = process.env.GITHUB_REPO
const DEFAULT_OWNER = process.env.GITHUB_OWNER
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const API_BASE_URL = 'https://api.github.com'

const getAuthHeaders = () => {
  if (!GITHUB_TOKEN) {
    return {}
  }

  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export const parseCommitUrl = (url) => {
  if (!url) return null

  try {
    const normalized = new URL(url)
    const parts = normalized.pathname.split('/').filter(Boolean)
    const [owner, repo, type, sha] = parts
    if (normalized.hostname !== 'github.com' || type !== 'commit' || !sha) {
      return null
    }

    return {
      owner,
      repo,
      sha,
    }
  } catch (error) {
    return null
  }
}

const getRepoPath = ({ owner, repo }) => {
  let finalOwner = owner || DEFAULT_OWNER
  let finalRepo = repo || DEFAULT_REPO

  if (repo && repo.includes('/') && !owner) {
    const [ownerPart, repoPart] = repo.split('/')
    finalOwner = ownerPart
    finalRepo = repoPart
  }

  if (!finalOwner || !finalRepo) {
    throw new BadRequestError('GitHub repository information is missing. Please configure GITHUB_OWNER and GITHUB_REPO.')
  }

  return `${finalOwner}/${finalRepo}`
}

export const fetchCommitFromGitHub = async ({ owner, repo, sha }) => {
  if (!sha) {
    throw new BadRequestError('Commit SHA is required')
  }

  try {
    const repoPath = getRepoPath({ owner, repo })
    const response = await axios.get(`${API_BASE_URL}/repos/${repoPath}/commits/${sha}`, {
      headers: {
        ...getAuthHeaders(),
        Accept: 'application/vnd.github+json',
      },
    })

    const data = response.data
    return {
      sha: data.sha,
      message: data.commit?.message,
      authorName: data.commit?.author?.name || data.author?.login,
      authorEmail: data.commit?.author?.email,
      url: data.html_url,
      repo: repoPath,
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
      filesChanged: data.files?.length || 0,
      committedAt: data.commit?.author?.date || data.commit?.committer?.date,
    }
  } catch (error) {
    logger.error('Error fetching commit from GitHub:', error.response?.data || error.message)
    throw new BadRequestError('Unable to fetch commit from GitHub. Please verify the repo and SHA.')
  }
}

export const searchCommitsOnGitHub = async ({ repo, owner, query, perPage = 5 }) => {
  if (!query) {
    throw new BadRequestError('Search query is required')
  }

  try {
    const repoPath = getRepoPath({ owner, repo })
    const q = `${query} repo:${repoPath}`

    const response = await axios.get(`${API_BASE_URL}/search/commits`, {
      headers: {
        ...getAuthHeaders(),
        Accept: 'application/vnd.github.cloak-preview+json',
      },
      params: {
        q,
        per_page: perPage,
      },
    })

    return (response.data?.items || []).map((item) => ({
      sha: item.sha,
      url: item.html_url,
      repo: repoPath,
      message: item.commit?.message,
    }))
  } catch (error) {
    logger.error('Error searching commits on GitHub:', error.response?.data || error.message)
    throw new BadRequestError('Unable to search commits on GitHub. Please verify repository settings.')
  }
}


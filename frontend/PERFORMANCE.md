# Performance Optimization Guide

This document outlines all performance optimizations implemented in the AgileSAFe AI Platform frontend.

## Table of Contents

1. [Code Splitting & Lazy Loading](#code-splitting--lazy-loading)
2. [React Optimizations](#react-optimizations)
3. [Virtual Scrolling](#virtual-scrolling)
4. [Image Optimization](#image-optimization)
5. [Bundle Optimization](#bundle-optimization)
6. [Caching Strategies](#caching-strategies)
7. [Rendering Optimizations](#rendering-optimizations)
8. [Performance Monitoring](#performance-monitoring)
9. [Best Practices](#best-practices)

## Code Splitting & Lazy Loading

### Route-Based Code Splitting

All route components are lazy-loaded using `React.lazy()`:

```javascript
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ProjectsList = lazy(() => import('@/pages/projects/ProjectsList'))
```

### Suspense Boundaries

Each route is wrapped with `LoadingBoundary` component that provides:
- Loading spinner for initial load
- Skeleton screens for better perceived performance
- Error boundaries for graceful error handling

### Component Lazy Loading

Heavy components (charts, modals) can be lazy-loaded:

```javascript
const HeavyChart = lazy(() => import('@/components/charts/HeavyChart'))

// In component
<Suspense fallback={<Spinner />}>
  <HeavyChart data={data} />
</Suspense>
```

## React Optimizations

### React.memo

Wrap expensive components to prevent unnecessary re-renders:

```javascript
const OptimizedComponent = memo(function Component({ data }) {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function (optional)
  return prevProps.data.id === nextProps.data.id
})
```

### useMemo

Memoize expensive calculations:

```javascript
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

const filteredData = useMemo(() => {
  return data.filter(item => item.status === 'active')
}, [data])
```

### useCallback

Memoize callback functions passed to children:

```javascript
const handleClick = useCallback((id) => {
  onItemClick(id)
}, [onItemClick])

// Pass to child
<ChildComponent onClick={handleClick} />
```

### Avoid Inline Functions

❌ Bad:
```javascript
<Button onClick={() => handleClick(id)}>Click</Button>
```

✅ Good:
```javascript
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies])

<Button onClick={handleClick}>Click</Button>
```

## Virtual Scrolling

Use `VirtualList` component for long lists (100+ items):

```javascript
import VirtualList from '@/components/ui/VirtualList'

<VirtualList
  items={items}
  height={600}
  itemHeight={50}
  renderItem={(item, index) => (
    <ItemCard key={item.id} data={item} />
  )}
/>
```

### When to Use Virtual Scrolling

- Story lists (100+ items)
- Task lists
- Activity feeds
- Search results
- Any list with 50+ items

## Image Optimization

### LazyImage Component

Use `LazyImage` for all images:

```javascript
import LazyImage from '@/components/ui/LazyImage'

<LazyImage
  src="/image.jpg"
  alt="Description"
  placeholder="/blur.jpg"
  blurDataURL="data:image/jpeg;base64,..."
  className="w-full h-64"
/>
```

### Features

- Intersection Observer for lazy loading
- WebP format support
- Blur placeholder while loading
- Responsive images with srcset
- Automatic fallback handling

## Bundle Optimization

### Vite Configuration

The Vite config is optimized with:

- **Code splitting**: Manual chunks for vendors and features
- **Tree shaking**: Automatic removal of unused code
- **Minification**: Terser with console.log removal
- **Asset optimization**: Organized file naming

### Bundle Analysis

Analyze bundle size:

```bash
npm run build
# Open dist/stats.html in browser
```

### Chunk Strategy

- **Vendor chunks**: React, React Query, UI libraries
- **Feature chunks**: Auth, Projects, Sprints
- **Route chunks**: Each route is a separate chunk

## Caching Strategies

### React Query Configuration

Optimized caching with different strategies:

```javascript
// Static data (30 min staleTime)
useQuery(['user', id], fetchUser, {
  staleTime: 30 * 60 * 1000,
})

// Dynamic data (5 min staleTime)
useQuery(['projects'], fetchProjects, {
  staleTime: 5 * 60 * 1000,
})

// Real-time data (1 min staleTime)
useQuery(['tasks'], fetchTasks, {
  staleTime: 1 * 60 * 1000,
  refetchInterval: 30000, // Background refetch
})
```

### Query Key Factories

Use consistent query keys:

```javascript
import { queryKeys } from '@/services/queryClient'

// List query
useQuery(queryKeys.projects.list(filters), fetchProjects)

// Detail query
useQuery(queryKeys.projects.detail(id), fetchProject)
```

## Rendering Optimizations

### Key Props

Always use stable keys in lists:

```javascript
// ✅ Good
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ❌ Bad
{items.map((item, index) => (
  <Item key={index} data={item} />
))}
```

### Pagination vs Infinite Scroll

- Use **pagination** for large datasets (1000+ items)
- Use **infinite scroll** for feeds (with virtual scrolling)
- Use **windowed lists** for Kanban boards

### Tailwind CSS Optimization

- Unused classes are automatically purged in production
- Use JIT mode for faster development
- Avoid dynamic class generation when possible

## Performance Monitoring

### Core Web Vitals

Automatically tracked:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

### Component Profiling

Use React DevTools Profiler or custom profiler:

```javascript
import { withProfiler } from '@/utils/performanceMonitor'

const ProfiledComponent = withProfiler(Component, 'ComponentName')
```

### Performance Metrics

Get performance metrics:

```javascript
// In browser console
window.getPerformanceMetrics()
```

## Best Practices

### 1. Debounce Search Inputs

```javascript
import { useDebounce } from '@/utils/performance'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 300)

useEffect(() => {
  performSearch(debouncedSearch)
}, [debouncedSearch])
```

### 2. Throttle Scroll Events

```javascript
import { useThrottledCallback } from '@/utils/performance'

const handleScroll = useThrottledCallback(() => {
  // Scroll handler
}, 100)

window.addEventListener('scroll', handleScroll)
```

### 3. Optimistic Updates

```javascript
const mutation = useMutation(updateTask, {
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks'])
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks'])
    
    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => [...old, newTask])
    
    return { previous }
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous)
  },
})
```

### 4. Prefetch Critical Routes

```javascript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

const handleMouseEnter = () => {
  // Prefetch on hover
  import('@/pages/Dashboard')
}

<Link
  to="/dashboard"
  onMouseEnter={handleMouseEnter}
>
  Dashboard
</Link>
```

### 5. Skeleton Screens

Always show skeleton screens instead of spinners:

```javascript
import Skeleton from '@/components/ui/Skeleton'

{isLoading ? (
  <div className="space-y-4">
    <Skeleton variant="text" className="h-8 w-3/4" />
    <Skeleton variant="rectangular" className="h-32 w-full" />
  </div>
) : (
  <Content data={data} />
)}
```

## Performance Checklist

- [ ] All routes are lazy-loaded
- [ ] Heavy components use React.memo
- [ ] Expensive calculations use useMemo
- [ ] Callbacks use useCallback
- [ ] Long lists use virtual scrolling
- [ ] Images use LazyImage component
- [ ] Search inputs are debounced
- [ ] Scroll events are throttled
- [ ] Query keys are consistent
- [ ] Skeleton screens for loading states
- [ ] Bundle size is analyzed regularly
- [ ] Core Web Vitals are monitored

## Tools

- **React DevTools**: Component profiling
- **Lighthouse**: Performance audits
- **Bundle Analyzer**: `dist/stats.html` after build
- **Performance Monitor**: Built-in utilities
- **Chrome DevTools**: Performance tab

## Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)


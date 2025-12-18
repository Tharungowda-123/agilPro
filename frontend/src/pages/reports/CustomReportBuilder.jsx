import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Layers,
  LayoutTemplate,
  Save,
  Share2,
  Filter,
  Clock,
  Trash2,
  PlayCircle,
  Loader2,
  ChevronDown,
  Eye,
  Send,
  Settings,
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import FormGroup from '@/components/ui/FormGroup'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { useProjects } from '@/hooks/api/useProjects'
import { useTeams } from '@/hooks/api/useTeams'
import {
  useReportWidgets,
  useCustomReports,
  useCreateCustomReport,
  useUpdateCustomReport,
  useDeleteCustomReport,
  usePreviewCustomReport,
  useRunCustomReport,
} from '@/hooks/api/useReports'
import { cn, generateId } from '@/utils'
import { toast } from 'react-hot-toast'

const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

const defaultWidgetSize = { w: 4, h: 3 }

export default function CustomReportBuilder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const reportIdFromUrl = searchParams.get('reportId')
  const { data: widgetLibrary = [], isLoading: widgetsLoading } = useReportWidgets()
  const { data: savedReports = [], refetch: refetchReports } = useCustomReports()
  const { data: projectsData } = useProjects()
  const { data: teamsData } = useTeams()

  const createReport = useCreateCustomReport()
  const updateReport = useUpdateCustomReport()
  const deleteReport = useDeleteCustomReport()
  const previewReport = usePreviewCustomReport()
  const runReport = useRunCustomReport()

  const projects = projectsData?.data || projectsData || []
  const teams = teamsData?.data || teamsData || []

  const [filters, setFilters] = useState({
    dateRange: '30d',
    projects: [],
    teams: [],
    customRange: { start: '', end: '' },
  })
  const [canvasWidgets, setCanvasWidgets] = useState([])
  const [selectedWidgetId, setSelectedWidgetId] = useState(null)
  const [activeReportId, setActiveReportId] = useState(reportIdFromUrl)
  const [reportName, setReportName] = useState('Untitled Report')
  const [description, setDescription] = useState('')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [sharedWith, setSharedWith] = useState({ scope: 'private', teams: [], users: [] })
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: '09:00',
    recipients: [],
  })
  const [previewData, setPreviewData] = useState([])
  const [isPreviewing, setIsPreviewing] = useState(false)

  const selectedWidget = useMemo(
    () => canvasWidgets.find((widget) => widget.id === selectedWidgetId),
    [canvasWidgets, selectedWidgetId]
  )

  useEffect(() => {
    if (reportIdFromUrl && reportIdFromUrl !== activeReportId) {
      setActiveReportId(reportIdFromUrl)
    } else if (!reportIdFromUrl && activeReportId) {
      setActiveReportId(null)
    }
  }, [reportIdFromUrl, activeReportId])

  const handleReportSelection = (nextReportId) => {
    setActiveReportId(nextReportId)
    const params = new URLSearchParams(searchParams)
    if (nextReportId) {
      params.set('reportId', nextReportId)
    } else {
      params.delete('reportId')
    }
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    if (!activeReportId) return
    const existing = savedReports.find((report) => report._id === activeReportId)
    if (existing) {
      setReportName(existing.name)
      setDescription(existing.description || '')
      setCanvasWidgets(existing.widgets || [])
      setFilters(existing.filters || { dateRange: '30d', projects: [], teams: [] })
      setSharedWith(existing.sharedWith || { scope: 'private', teams: [], users: [] })
      setSchedule(existing.schedule || { enabled: false, frequency: 'weekly', dayOfWeek: 1, timeOfDay: '09:00', recipients: [] })
    }
  }, [activeReportId, savedReports])

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return

    if (destination.droppableId === 'canvas' && source.droppableId === 'palette') {
      const paletteWidget = widgetLibrary.find((w) => w.metric === draggableId)
      if (!paletteWidget) return
      const newWidget = {
        id: generateId(),
        title: paletteWidget.label,
        metric: paletteWidget.metric,
        chartType: paletteWidget.defaultChart,
        position: { ...defaultWidgetSize },
      }
      setCanvasWidgets((prev) => [...prev, newWidget])
      setSelectedWidgetId(newWidget.id)
      return
    }

    if (destination.droppableId === 'canvas' && source.droppableId === 'canvas') {
      const reordered = Array.from(canvasWidgets)
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)
      setCanvasWidgets(reordered)
    }
  }

  const handleWidgetChange = (widgetId, changes) => {
    setCanvasWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? {
              ...widget,
              ...changes,
            }
          : widget
      )
    )
  }

  const handleRemoveWidget = (widgetId) => {
    setCanvasWidgets((prev) => prev.filter((widget) => widget.id !== widgetId))
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveReport = (payload) => {
    const body = {
      name: payload?.name || reportName,
      description,
      widgets: canvasWidgets,
      filters,
      sharedWith,
      schedule,
    }

    if (canvasWidgets.length === 0) {
      toast.error('Add at least one widget before saving')
      return
    }

    if (activeReportId) {
      updateReport.mutate(
        { id: activeReportId, data: body },
        {
          onSuccess: () => {
            refetchReports()
            setSaveModalOpen(false)
          },
        }
      )
    } else {
      createReport.mutate(body, {
        onSuccess: (response) => {
          const created = response?.data?.report || response?.report
          handleReportSelection(created?._id)
          refetchReports()
          setSaveModalOpen(false)
        },
      })
    }
  }

  const handleDeleteReport = () => {
    if (!activeReportId) return
    deleteReport.mutate(activeReportId, {
      onSuccess: () => {
        handleReportSelection(null)
        setReportName('Untitled Report')
        setDescription('')
        setCanvasWidgets([])
        setPreviewData([])
        refetchReports()
      },
    })
  }

  const handlePreview = () => {
    if (canvasWidgets.length === 0) {
      toast.error('Add at least one widget to preview')
      return
    }
    setIsPreviewing(true)
    previewReport.mutate(
      { widgets: canvasWidgets, filters },
      {
        onSuccess: (response) => {
          const datasets = response?.data?.datasets || response?.datasets || []
          setPreviewData(datasets)
        },
        onSettled: () => setIsPreviewing(false),
      }
    )
  }

  const handleRun = () => {
    if (!activeReportId) {
      toast.error('Save the report before running it')
      return
    }
    setIsPreviewing(true)
    runReport.mutate(
      { id: activeReportId, data: { filters } },
      {
        onSuccess: (response) => {
          const datasets = response?.data?.datasets || response?.datasets || []
          setPreviewData(datasets)
          toast.success('Report executed successfully')
        },
        onSettled: () => setIsPreviewing(false),
      }
    )
  }

  const paletteItems = useMemo(
    () =>
      widgetLibrary.map((widget) => ({
        ...widget,
        id: widget.metric,
      })),
    [widgetLibrary]
  )

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
            <Badge variant="info" size="sm">
              Viewer
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Drag metrics into the canvas, configure filters, and save interactive reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
            value={activeReportId || ''}
            onChange={(e) => handleReportSelection(e.target.value || null)}
          >
            <option value="">New report</option>
            {savedReports.map((report) => (
              <option key={report._id} value={report._id}>
                {report.name}
              </option>
            ))}
          </Select>
          <Button variant="outline" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleDeleteReport} disabled={!activeReportId}>
            Delete
          </Button>
          <Button variant="outline" leftIcon={<Share2 className="w-4 h-4" />} onClick={() => setShareModalOpen(true)}>
            Share
          </Button>
          <Button variant="outline" leftIcon={<Clock className="w-4 h-4" />} onClick={() => setScheduleModalOpen(true)}>
            Schedule
          </Button>
          <Button variant="outline" leftIcon={<Save className="w-4 h-4" />} onClick={() => setSaveModalOpen(true)}>
            Save
          </Button>
          <Button variant="primary" leftIcon={<PlayCircle className="w-4 h-4" />} onClick={handleRun}>
            Run
          </Button>
        </div>
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Palette */}
          <Card className="p-4" aria-label="Widget library">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900">Widget Library</h2>
          </div>
          {widgetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          ) : (
              <Droppable droppableId="palette" isDropDisabled>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                    {paletteItems.map((widget, index) => (
                      <Draggable draggableId={widget.metric} index={index} key={widget.metric}>
                        {(draggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className="border border-dashed border-gray-200 rounded-lg p-3 cursor-grab hover:border-primary-300"
                          >
                            <p className="font-medium text-gray-900 text-sm">{widget.label}</p>
                            <p className="text-xs text-gray-500 mt-1">{widget.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
          )}
        </Card>

        {/* Canvas */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-semibold text-gray-900">Report Canvas</h2>
            </div>
              <Droppable droppableId="canvas">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'min-h-[320px] border-2 border-dashed rounded-xl p-4 grid gap-3',
                      canvasWidgets.length === 0 ? 'place-content-center text-gray-400 text-sm' : 'grid-cols-1'
                    )}
                  >
                    {canvasWidgets.length === 0 && 'Drag widgets here to start'}
                    {canvasWidgets.map((widget, index) => (
                      <Draggable draggableId={widget.id} index={index} key={widget.id}>
                        {(draggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className={cn(
                              'rounded-lg border p-4 bg-white shadow-sm transition',
                              selectedWidgetId === widget.id ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-200'
                            )}
                            onClick={() => setSelectedWidgetId(widget.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{widget.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{widget.metric}</p>
                              </div>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-error-500"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveWidget(widget.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 uppercase">
                              {widget.chartType} chart
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
          </Card>

          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            </div>
            <FormGroup label="Date Range">
              <Select value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Start">
                  <Input
                    type="date"
                    value={filters.customRange?.start || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        customRange: { ...prev.customRange, start: e.target.value },
                      }))
                    }
                  />
                </FormGroup>
                <FormGroup label="End">
                  <Input
                    type="date"
                    value={filters.customRange?.end || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        customRange: { ...prev.customRange, end: e.target.value },
                      }))
                    }
                  />
                </FormGroup>
              </div>
            )}
            <CollapsibleFilter
              label="Projects"
              items={projects}
              selected={filters.projects}
              onToggle={(projectId) =>
                handleFilterChange(
                  'projects',
                  filters.projects.includes(projectId)
                    ? filters.projects.filter((id) => id !== projectId)
                    : [...filters.projects, projectId]
                )
              }
            />
            <CollapsibleFilter
              label="Teams"
              items={teams}
              selected={filters.teams}
              onToggle={(teamId) =>
                handleFilterChange(
                  'teams',
                  filters.teams.includes(teamId)
                    ? filters.teams.filter((id) => id !== teamId)
                    : [...filters.teams, teamId]
                )
              }
            />
          </Card>
        </div>

        {/* Configuration / Preview */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-semibold text-gray-900">Widget Configuration</h2>
            </div>
            {selectedWidget ? (
              <WidgetConfiguration
                widget={selectedWidget}
                onChange={(changes) => handleWidgetChange(selectedWidget.id, changes)}
                widgetLibrary={widgetLibrary}
              />
            ) : (
              <p className="text-sm text-gray-500">Select a widget to adjust settings.</p>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PlayCircle className="w-4 h-4" />}
                onClick={handlePreview}
                disabled={canvasWidgets.length === 0}
              >
                Preview
              </Button>
            </div>
            <PreviewArea isLoading={isPreviewing || previewReport.isPending} datasets={previewData} />
          </Card>
        </div>
      </div>
      </DragDropContext>

      <SaveReportModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        reportName={reportName}
        description={description}
        setReportName={setReportName}
        setDescription={setDescription}
        onSave={handleSaveReport}
        loading={createReport.isPending || updateReport.isPending}
      />

      <ShareReportModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        sharedWith={sharedWith}
        setSharedWith={setSharedWith}
        availableTeams={teams}
      />

      <ScheduleReportModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        schedule={schedule}
        setSchedule={setSchedule}
      />
    </div>
  )
}

function CollapsibleFilter({ label, items, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        <ChevronDown className={cn('w-4 h-4 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {items.length === 0 && <p className="text-xs text-gray-500">No options available</p>}
          {items.map((item) => {
            const id = item._id || item.id
            return (
              <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={selected.includes(id)} onChange={() => onToggle(id)} />
                <span>{item.name}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WidgetConfiguration({ widget, onChange, widgetLibrary }) {
  const libraryMeta = widgetLibrary.find((w) => w.metric === widget.metric)
  return (
    <div className="space-y-4">
      <FormGroup label="Widget Title">
        <Input value={widget.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
      </FormGroup>
      <FormGroup label="Metric">
        <Select value={widget.metric} onChange={(e) => onChange({ metric: e.target.value })}>
          {widgetLibrary.map((meta) => (
            <option key={meta.metric} value={meta.metric}>
              {meta.label}
            </option>
          ))}
        </Select>
      </FormGroup>
      <FormGroup label="Chart Type">
        <Select
          value={widget.chartType}
          onChange={(e) => onChange({ chartType: e.target.value })}
        >
          {(libraryMeta?.supportedCharts || ['stat']).map((chart) => (
            <option key={chart} value={chart}>
              {chart}
            </option>
          ))}
        </Select>
      </FormGroup>
    </div>
  )
}

function PreviewArea({ isLoading, datasets }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Generating preview...
      </div>
    )
  }

  if (!datasets || datasets.length === 0) {
    return <p className="text-sm text-gray-500">Run a preview to see results</p>
  }

  return (
    <div className="space-y-3">
      {datasets.map((dataset) => (
        <Card key={dataset.id} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">{dataset.title || dataset.metric}</p>
            <Badge variant="default" size="sm">
              {dataset.chartType}
            </Badge>
          </div>
          <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto">
            {JSON.stringify(dataset.data, null, 2)}
          </pre>
        </Card>
      ))}
    </div>
  )
}

function SaveReportModal({
  isOpen,
  onClose,
  reportName,
  description,
  setReportName,
  setDescription,
  onSave,
  loading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Custom Report">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ name: reportName })
        }}
      >
        <FormGroup label="Report Name" required>
          <Input value={reportName} onChange={(e) => setReportName(e.target.value)} required />
        </FormGroup>
        <FormGroup label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ShareReportModal({ isOpen, onClose, sharedWith, setSharedWith, availableTeams }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share report">
      <div className="space-y-4">
        <FormGroup label="Visibility">
          <Select
            value={sharedWith.scope}
            onChange={(e) =>
              setSharedWith((prev) => ({
                ...prev,
                scope: e.target.value,
              }))
            }
          >
            <option value="private">Private</option>
            <option value="team">Team</option>
            <option value="organization">Organization</option>
          </Select>
        </FormGroup>
        {sharedWith.scope === 'team' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Select teams that can access this report.</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableTeams.length === 0 && (
                <p className="text-xs text-gray-500">No teams available.</p>
              )}
              {availableTeams.map((team) => {
                const id = team._id || team.id
                return (
                  <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={sharedWith.teams?.includes(id)}
                      onChange={() =>
                        setSharedWith((prev) => ({
                          ...prev,
                          teams: prev.teams?.includes(id)
                            ? prev.teams.filter((teamId) => teamId !== id)
                            : [...(prev.teams || []), id],
                        }))
                      }
                    />
                    <span>{team.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ScheduleReportModal({ isOpen, onClose, schedule, setSchedule }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule delivery">
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={schedule.enabled}
            onChange={(e) => setSchedule((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
          Enable automated delivery
        </label>
        {schedule.enabled && (
          <>
            <FormGroup label="Frequency">
              <Select
                value={schedule.frequency}
                onChange={(e) => setSchedule((prev) => ({ ...prev, frequency: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </FormGroup>
            {schedule.frequency === 'weekly' && (
              <FormGroup label="Day of week">
                <Select
                  value={schedule.dayOfWeek}
                  onChange={(e) =>
                    setSchedule((prev) => ({ ...prev, dayOfWeek: parseInt(e.target.value, 10) }))
                  }
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </Select>
              </FormGroup>
            )}
            {schedule.frequency === 'monthly' && (
              <FormGroup label="Day of month">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={schedule.dayOfMonth}
                  onChange={(e) =>
                    setSchedule((prev) => ({ ...prev, dayOfMonth: parseInt(e.target.value, 10) }))
                  }
                />
              </FormGroup>
            )}
            <FormGroup label="Time of day">
              <Input
                type="time"
                value={schedule.timeOfDay}
                onChange={(e) => setSchedule((prev) => ({ ...prev, timeOfDay: e.target.value }))}
              />
            </FormGroup>
            <FormGroup label="Recipients">
              <Input
                placeholder="viewer@example.com"
                value={schedule.recipients?.join(', ') || ''}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    recipients: e.target.value
                      .split(',')
                      .map((email) => email.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </FormGroup>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" leftIcon={<Send className="w-4 h-4" />} onClick={onClose}>
            Save schedule
          </Button>
        </div>
      </div>
    </Modal>
  )
}


import XLSX from 'xlsx'
import { Feature, Story, Task, User, Activity, ProgramIncrement, Project, Sprint } from '../models/index.js'
import { successResponse } from '../utils/response.js'
import { BadRequestError } from '../utils/errors.js'
import logger from '../utils/logger.js'
import { createActivity } from '../services/project.service.js'
import { breakDownFeature, getTaskAssignmentRecommendations, optimizePIFeatures } from '../services/mlIntegration.service.js'
import { Team } from '../models/index.js'

/**
 * Import PI Plan from Excel file
 * POST /api/import/excel
 */
export const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded')
    }

    const file = req.file
    const { projectId, piId } = req.body

    if (!projectId) {
      throw new BadRequestError('Project ID is required')
    }

    // Read Excel file
    const workbook = XLSX.readFile(file.path)

    // Validate sheets exist
    const requiredSheets = ['Features', 'Stories', 'Tasks']
    const missingSheets = requiredSheets.filter((sheet) => !workbook.Sheets[sheet])
    if (missingSheets.length > 0) {
      throw new BadRequestError(`Missing required sheets: ${missingSheets.join(', ')}`)
    }

    // Read data from sheets
    const featuresData = XLSX.utils.sheet_to_json(workbook.Sheets['Features'])
    const storiesData = XLSX.utils.sheet_to_json(workbook.Sheets['Stories'])
    const tasksData = XLSX.utils.sheet_to_json(workbook.Sheets['Tasks'])

    const imported = {
      features: [],
      stories: [],
      tasks: [],
      errors: [],
    }

    // Map to store Feature ID → MongoDB _id
    const featureIdMap = {}
    const storyIdMap = {}

    // Import Features
    for (const [index, featureData] of featuresData.entries()) {
      try {
        // Validate required fields
        const title = featureData['Title*'] || featureData['Title']
        const description = featureData['Description*'] || featureData['Description']
        const priority = featureData['Priority*'] || featureData['Priority']

        if (!title || !description || !priority) {
          imported.errors.push(
            `Row ${index + 2} in Features: Missing required fields (Title, Description, Priority)`
          )
          continue
        }

        const feature = await Feature.create({
          title,
          description,
          businessValue: featureData['Business Value'] || featureData['businessValue'] || '',
          priority: priority.toLowerCase(),
          status: featureData['Status'] ? featureData['Status'].toLowerCase() : 'draft',
          estimatedStoryPoints: featureData['Estimated Points'] || featureData['estimatedPoints'] || 0,
          project: projectId,
          programIncrement: piId || undefined,
          createdBy: req.user.id,
          metadata: {
            source: 'excel',
            importedAt: new Date(),
          },
        })

        // Map Feature ID
        const featureId = featureData['Feature ID'] || featureData['id'] || featureData['Feature ID*']
        if (featureId) {
          featureIdMap[featureId] = feature._id
        }

        imported.features.push(feature)
      } catch (error) {
        imported.errors.push(`Row ${index + 2} in Features: ${error.message}`)
        logger.error(`Error importing feature row ${index + 2}:`, error)
      }
    }

    // Import Stories
    for (const [index, storyData] of storiesData.entries()) {
      try {
        const title = storyData['Title*'] || storyData['Title']
        const description = storyData['Description*'] || storyData['Description']
        const storyPoints = storyData['Story Points*'] || storyData['Story Points'] || storyData['points']

        if (!title || !description || !storyPoints) {
          imported.errors.push(
            `Row ${index + 2} in Stories: Missing required fields (Title, Description, Story Points)`
          )
          continue
        }

        // Find parent feature
        const featureId = storyData['Feature ID*'] || storyData['Feature ID'] || storyData['featureId']
        const featureMongoId = featureId ? featureIdMap[featureId] : null

        if (featureId && !featureMongoId) {
          imported.errors.push(`Row ${index + 2} in Stories: Feature ID not found: ${featureId}`)
          continue
        }

        // Parse acceptance criteria
        const criteriaStr =
          storyData['Acceptance Criteria'] ||
          storyData['criteria'] ||
          storyData['Acceptance Criteria*'] ||
          ''
        const acceptanceCriteria = criteriaStr
          ? criteriaStr
              .toString()
              .split('\n')
              .map((c) => c.trim())
              .filter((c) => c)
          : []

        const story = await Story.create({
          title,
          description,
          acceptanceCriteria,
          storyPoints: parseInt(storyPoints, 10),
          priority: storyData['Priority'] ? storyData['Priority'].toLowerCase() : 'medium',
          status: storyData['Status'] ? storyData['Status'].toLowerCase() : 'todo',
          feature: featureMongoId || undefined,
          project: projectId,
          createdBy: req.user.id,
        })

        // Map Story ID
        const storyId = storyData['Story ID'] || storyData['id']
        if (storyId) {
          storyIdMap[storyId] = story._id
        }

        // Update feature's stories array
        if (featureMongoId) {
          await Feature.findByIdAndUpdate(featureMongoId, {
            $push: { stories: story._id },
          })
        }

        imported.stories.push(story)
      } catch (error) {
        imported.errors.push(`Row ${index + 2} in Stories: ${error.message}`)
        logger.error(`Error importing story row ${index + 2}:`, error)
      }
    }

    // Import Tasks
    for (const [index, taskData] of tasksData.entries()) {
      try {
        const title = taskData['Title*'] || taskData['Title']
        const storyId = taskData['Story ID*'] || taskData['Story ID'] || taskData['storyId']

        if (!title || !storyId) {
          imported.errors.push(`Row ${index + 2} in Tasks: Missing required fields (Title, Story ID)`)
          continue
        }

        // Find parent story
        const storyMongoId = storyIdMap[storyId]
        if (!storyMongoId) {
          imported.errors.push(`Row ${index + 2} in Tasks: Story ID not found: ${storyId}`)
          continue
        }

        // Find assignee
        let assignee = null
        const assigneeName = taskData['Assigned To'] || taskData['assignee']
        if (assigneeName) {
          assignee = await User.findOne({ name: assigneeName })
          if (!assignee) {
            imported.errors.push(`Row ${index + 2} in Tasks: User not found: ${assigneeName}`)
          }
        }

        // Parse skills
        const skillsStr = taskData['Skills Required'] || taskData['skills'] || ''
        const skills = skillsStr
          ? skillsStr
              .toString()
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s)
          : []

        const task = await Task.create({
          title,
          description: taskData['Description'] || taskData['description'] || '',
          estimatedHours: taskData['Estimated Hours'] || taskData['hours'] || 0,
          skills,
          assignedTo: assignee?._id || undefined,
          story: storyMongoId,
          project: projectId,
          status: taskData['Status'] ? taskData['Status'].toLowerCase() : 'todo',
          createdBy: req.user.id,
        })

        // Update story's tasks array
        await Story.findByIdAndUpdate(storyMongoId, {
          $push: { tasks: task._id },
        })

        imported.tasks.push(task)
      } catch (error) {
        imported.errors.push(`Row ${index + 2} in Tasks: ${error.message}`)
        logger.error(`Error importing task row ${index + 2}:`, error)
      }
    }

    // Step 4: For features without stories, trigger AI breakdown and task assignment
    const { autoBreakdown = true, autoAssign = true, autoScheduleSprints = true } = req.body
    const featuresToBreakdown = imported.features.filter((f) => {
      const featureId = f._id.toString()
      return !imported.stories.some((s) => s.feature?.toString() === featureId)
    })

    let breakdownResults = {
      featuresProcessed: 0,
      storiesCreated: 0,
      tasksCreated: 0,
      tasksAssigned: 0,
      errors: [],
    }

    if (autoBreakdown && featuresToBreakdown.length > 0) {
      // Get project team members
      const project = await Project.findById(projectId).populate('team')
      let teamMembers = []
      if (project.team) {
        const team = await Team.findById(project.team._id || project.team).populate('members')
        if (team && team.members) {
          teamMembers = team.members.map((m) => m._id.toString())
        }
      }

      for (const feature of featuresToBreakdown) {
        try {
          // Break down feature
          let breakdownResult
          try {
            breakdownResult = await breakDownFeature({
              title: feature.title,
              description: feature.description,
              businessValue: feature.businessValue || '',
              acceptanceCriteria: feature.acceptanceCriteria || [],
            })
          } catch (mlError) {
            logger.error(`ML service error for feature ${feature._id}:`, mlError)
            breakdownResults.errors.push(`Failed to break down feature "${feature.title}": ML service unavailable`)
            continue
          }

          const suggestedStories = breakdownResult.suggested_breakdown?.stories || breakdownResult.stories || []
          if (suggestedStories.length === 0) {
            breakdownResults.errors.push(`No stories generated for feature "${feature.title}"`)
            continue
          }

          // Pre-calculate storyIds
          const lastStory = await Story.findOne({ project: projectId, storyId: { $exists: true } })
            .sort({ storyId: -1 })
            .select('storyId')
            .lean()
          
          let storyNumber = 1
          if (lastStory && lastStory.storyId) {
            const match = lastStory.storyId.match(/-(\d+)$/)
            if (match) {
              storyNumber = parseInt(match[1], 10) + 1
            }
          }

          const projectKey = project.key || 'PROJ'

          // Create stories and tasks
          for (const suggestion of suggestedStories) {
            const storyId = `${projectKey}-${storyNumber}`
            storyNumber++

            const story = new Story({
              storyId,
              title: suggestion.title || 'Untitled Story',
              description: suggestion.description || '',
              acceptanceCriteria: suggestion.acceptance_criteria || suggestion.acceptanceCriteria || [],
              project: projectId,
              feature: feature._id,
              storyPoints: suggestion.estimated_points || suggestion.estimatedPoints || 0,
              priority: suggestion.priority || 'medium',
              status: 'backlog',
              createdBy: req.user.id,
            })

            await story.save()
            breakdownResults.storiesCreated++

            // Create tasks
            const tasks = suggestion.tasks || []
            for (const taskSuggestion of tasks) {
              const task = new Task({
                title: taskSuggestion.title || 'Untitled Task',
                description: taskSuggestion.description || '',
                story: story._id,
                project: projectId,
                estimatedHours: taskSuggestion.estimated_hours || taskSuggestion.estimatedHours || 2,
                status: 'todo',
                createdBy: req.user.id,
              })

              await task.save()
              breakdownResults.tasksCreated++

              // Assign task if autoAssign is enabled
              if (autoAssign && teamMembers.length > 0) {
                try {
                  const recommendations = await getTaskAssignmentRecommendations(
                    {
                      id: task._id.toString(),
                      title: task.title,
                      description: task.description,
                      priority: task.priority || 'medium',
                      estimatedHours: task.estimatedHours,
                    },
                    teamMembers
                  )

                  if (recommendations.length > 0) {
                    const topRecommendation = recommendations[0]
                    const recommendedUserId = topRecommendation.userId || topRecommendation.user_id

                    if (recommendedUserId) {
                      task.assignedTo = recommendedUserId
                      await task.save()
                      breakdownResults.tasksAssigned++
                    }
                  }
                } catch (assignError) {
                  logger.error(`Error assigning task ${task._id}:`, assignError)
                  // Continue without assignment
                }
              }

              // Add task to story
              if (!story.tasks) {
                story.tasks = []
              }
              story.tasks.push(task._id)
            }

            await story.save()
            feature.stories.push(story._id)
          }

          // Update feature
          feature.aiInsights = {
            complexity: breakdownResult.analysis?.complexity || 0,
            suggestedBreakdown: suggestedStories,
            identifiedPersonas: breakdownResult.analysis?.personas || [],
            extractedRequirements: breakdownResult.analysis?.requirements || [],
            analyzedAt: new Date(),
          }
          feature.status = 'broken-down'
          await feature.save()
          breakdownResults.featuresProcessed++
        } catch (error) {
          logger.error(`Error processing feature ${feature._id}:`, error)
          breakdownResults.errors.push(`Error processing feature "${feature.title}": ${error.message}`)
        }
      }
    }

    // Step 5: Schedule sprints - distribute stories across sprints using AI
    let sprintSchedulingResults = {
      sprintsCreated: 0,
      storiesScheduled: 0,
      errors: [],
    }

    if (autoScheduleSprints && piId) {
      try {
        // Get PI with sprints
        const programIncrement = await ProgramIncrement.findById(piId)
          .populate('sprints', 'name capacity startDate endDate')
          .populate('features', 'title estimatedStoryPoints priority status')

        if (programIncrement) {
          let sprints = programIncrement.sprints || []

          // If no sprints exist, create sprints based on PI timeline
          if (sprints.length === 0 && programIncrement.startDate && programIncrement.endDate) {
            const startDate = new Date(programIncrement.startDate)
            const endDate = new Date(programIncrement.endDate)
            const durationWeeks = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7))
            const sprintDurationWeeks = 2 // Default 2-week sprints
            const numSprints = Math.ceil(durationWeeks / sprintDurationWeeks)

            for (let i = 0; i < numSprints; i++) {
              const sprintStart = new Date(startDate)
              sprintStart.setDate(sprintStart.getDate() + i * sprintDurationWeeks * 7)
              const sprintEnd = new Date(sprintStart)
              sprintEnd.setDate(sprintEnd.getDate() + sprintDurationWeeks * 7 - 1)

              const sprint = await Sprint.create({
                name: `Sprint ${i + 1} - ${programIncrement.name}`,
                sprintNumber: i + 1,
                project: projectId,
                goal: `Sprint ${i + 1} of ${programIncrement.name}`,
                startDate: sprintStart,
                endDate: sprintEnd,
                status: 'planned',
                capacity: 21, // Default capacity
                createdBy: req.user.id,
              })

              sprints.push(sprint)
              sprintSchedulingResults.sprintsCreated++
            }

            // Update PI with created sprints
            programIncrement.sprints = sprints.map((s) => s._id)
            await programIncrement.save()
          }

          // Get all stories (imported + created from breakdown)
          const importedStoryIds = imported.stories.map((s) => s._id)
          const breakdownStoryIds = []
          
          // Get stories created during breakdown
          if (breakdownResults.storiesCreated > 0) {
            const breakdownStories = await Story.find({
              project: projectId,
              feature: { $in: imported.features.map((f) => f._id) },
              _id: { $nin: importedStoryIds }, // Exclude already imported stories
            })
            breakdownStoryIds.push(...breakdownStories.map((s) => s._id))
          }

          const allStoryIds = [...importedStoryIds, ...breakdownStoryIds]
          const allStories = await Story.find({ _id: { $in: allStoryIds } })

          if (allStories.length > 0 && sprints.length > 0) {
            // Use AI to optimize story distribution across sprints
            try {
              const optimizationResult = await optimizePIFeatures({
                features: programIncrement.features.map((f) => ({
                  id: f._id.toString(),
                  title: f.title,
                  points: f.estimatedStoryPoints || 0,
                  priority: f.priority || 'medium',
                  status: f.status || 'draft',
                })),
                sprints: sprints.map((s) => ({
                  id: s._id.toString(),
                  name: s.name,
                  capacity: s.capacity || 21,
                  startDate: s.startDate,
                  endDate: s.endDate,
                })),
                dependencies: programIncrement.dependencies || [],
              })

              // Assign stories to sprints based on feature assignments
              const assignments = optimizationResult.assignments || []
              const featureToSprintMap = {}
              assignments.forEach((assignment) => {
                featureToSprintMap[assignment.featureId] = assignment.sprintId
              })

              // Assign stories to sprints based on their feature's sprint assignment
              for (const story of allStories) {
                if (story.feature) {
                  const featureId = story.feature.toString()
                  const sprintId = featureToSprintMap[featureId]

                  if (sprintId) {
                    const sprint = sprints.find((s) => s._id.toString() === sprintId)
                    if (sprint) {
                      story.sprint = sprint._id
                      await story.save()
                      sprintSchedulingResults.storiesScheduled++
                    }
                  }
                }
              }

              // Update sprint stories arrays
              for (const sprint of sprints) {
                const sprintStories = allStories.filter(
                  (s) => s.sprint && s.sprint.toString() === sprint._id.toString()
                )
                sprint.stories = sprintStories.map((s) => s._id)
                await sprint.save()
              }
            } catch (optimizeError) {
              logger.error('Error optimizing sprint distribution:', optimizeError)
              sprintSchedulingResults.errors.push('Failed to optimize sprint distribution. Stories will remain in backlog.')
            }
          }
        }
      } catch (sprintError) {
        logger.error('Error scheduling sprints:', sprintError)
        sprintSchedulingResults.errors.push(`Error scheduling sprints: ${sprintError.message}`)
      }
    }

    // Log activity
    await createActivity({
      type: 'imported',
      entityType: 'pi_plan',
      entityId: piId,
      user: req.user.id,
      description: `Imported PI Plan from Excel: ${imported.features.length} features, ${imported.stories.length + breakdownResults.storiesCreated} stories, ${imported.tasks.length + breakdownResults.tasksCreated} tasks`,
    })

    return successResponse(
      res,
      {
        imported: {
          features: imported.features.length,
          stories: imported.stories.length + breakdownResults.storiesCreated,
          tasks: imported.tasks.length + breakdownResults.tasksCreated,
          tasksAssigned: breakdownResults.tasksAssigned,
          sprintsCreated: sprintSchedulingResults.sprintsCreated,
          storiesScheduled: sprintSchedulingResults.storiesScheduled,
        },
        breakdown: breakdownResults,
        sprintScheduling: sprintSchedulingResults,
        errors: [...imported.errors, ...breakdownResults.errors, ...sprintSchedulingResults.errors],
      },
      'Import completed',
      201
    )
  } catch (error) {
    next(error)
  }
}

// Default export
export default {
  importFromExcel,
}


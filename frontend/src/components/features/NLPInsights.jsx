import PropTypes from 'prop-types'
import { Brain, Users, Target, AlertTriangle, Zap, CheckCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils'

/**
 * NLP Insights Component
 * Displays advanced NLP analysis results for features
 */
export default function NLPInsights({ analysis }) {
  if (!analysis) {
    return null
  }

  // Extract data from analysis (handle both formats)
  const entities = analysis.entities || {}
  const intents = analysis.intents || {}
  const personas = analysis.personas || []
  const functionalRequirements = analysis.functional_requirements || analysis.requirements || []
  const complexityFactors = analysis.complexity_factors || []
  const integrations = analysis.integrations || []
  const technologies = entities.technologies || []

  const primaryIntent = intents.primary || 'User Management'
  const intentConfidence = intents.scores?.[primaryIntent] || 0.5

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🧠 AI NLP Analysis</h3>
      </div>

      <div className="space-y-6">
        {/* Primary Intent */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Primary Intent</h4>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
              {primaryIntent}
            </Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Confidence: {(intentConfidence * 100).toFixed(1)}%
            </span>
          </div>
          {intents.secondary && intents.secondary.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Secondary intents:</p>
              <div className="flex gap-2 flex-wrap">
                {intents.secondary.map((intent, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs"
                  >
                    {intent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Identified Personas */}
        {personas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">User Personas</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {personas.map((persona, idx) => (
                <Badge
                  key={idx}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {persona}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Technologies Detected */}
        {technologies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Technologies Detected</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {technologies.map((tech, idx) => (
                <Badge
                  key={idx}
                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Integrations */}
        {integrations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Third-Party Integrations</h4>
            </div>
            <div className="space-y-2">
              {integrations.map((integration, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {integration.service}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{integration.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Functional Requirements */}
        {functionalRequirements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Extracted Requirements</h4>
            </div>
            <ul className="space-y-2">
              {functionalRequirements.slice(0, 5).map((req, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary-600 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{req}</span>
                </li>
              ))}
            </ul>
            {functionalRequirements.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                +{functionalRequirements.length - 5} more requirements
              </p>
            )}
          </div>
        )}

        {/* Complexity Factors */}
        {complexityFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Complexity Factors</h4>
            </div>
            <ul className="space-y-2">
              {complexityFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions Detected */}
        {entities.actions && entities.actions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Actions Detected</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {entities.actions.slice(0, 8).map((action, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

NLPInsights.propTypes = {
  analysis: PropTypes.object,
}


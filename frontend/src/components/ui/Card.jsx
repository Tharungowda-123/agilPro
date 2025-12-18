import PropTypes from 'prop-types'
import { cn } from '@/utils'

/**
 * Card Component with Header, Body, and Footer sections
 * 
 * @example
 * <Card variant="elevated" hover>
 *   <CardHeader>
 *     <h3>Card Title</h3>
 *   </CardHeader>
 *   <CardBody>
 *     <p>Card content goes here</p>
 *   </CardBody>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 */
export default function Card({
  children,
  className = '',
  variant = 'elevated',
  hover = false,
  ...props
}) {
  const variants = {
    elevated: 'theme-card shadow-soft',
    outlined: 'theme-card border-2 theme-border',
    filled: 'theme-card-muted border theme-border',
  }

  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-colors duration-300',
        variants[variant],
        hover && 'transition-all duration-200 hover:shadow-medium hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['elevated', 'outlined', 'filled']),
  hover: PropTypes.bool,
}

// CardHeader Component
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('mb-4 pb-4 border-b theme-border', className)} {...props}>
      {children}
    </div>
  )
}

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

// CardBody Component
export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

CardBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

// CardFooter Component
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('pt-4 border-t theme-border flex items-center justify-end gap-2', className)} {...props}>
      {children}
    </div>
  )
}

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

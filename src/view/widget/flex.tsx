import { ComponentPropsWithRef, forwardRef } from 'react'
import { cx } from '~/shared/utils/normal'

export interface IFlexProps extends ComponentPropsWithRef<'div'> {
  vshow?: boolean
  onHover?: (isHover: boolean) => void
}

export const Flex = forwardRef<HTMLDivElement, IFlexProps>(
  ({ vshow = true, className, onHover, onMouseEnter, onMouseLeave, ...rest }, ref) => {
    const ClassName = cx(
      ['layer-widget:shrink-1'],
      [className || ''],
      [vshow ? 'layer-widget:flex' : 'layer-widget:hidden']
    )

    return (
      <div
        ref={ref}
        className={ClassName}
        onMouseEnter={(e) => {
          onHover?.(true)
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          onHover?.(false)
          onMouseLeave?.(e)
        }}
        {...rest}></div>
    )
  }
)

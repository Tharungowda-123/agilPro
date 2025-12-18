import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { FixedSizeList, VariableSizeList } from 'react-window'
import { cn } from '@/utils'

/**
 * VirtualList Component
 * Wrapper around react-window for virtualized lists
 * Use for long lists (100+ items) to improve performance
 * 
 * @example
 * <VirtualList
 *   items={items}
 *   height={600}
 *   itemHeight={50}
 *   renderItem={(item, index) => <Item key={index} data={item} />}
 * />
 */
function VirtualList({
  items = [],
  height = 400,
  itemHeight,
  itemSize, // For variable size
  width = '100%',
  className = '',
  renderItem,
  overscanCount = 5,
  onItemsRendered,
  ...props
}) {
  const isVariableSize = itemSize !== undefined

  const ListComponent = isVariableSize ? VariableSizeList : FixedSizeList

  // Memoize item data
  const itemData = useMemo(
    () => ({
      items,
      renderItem,
    }),
    [items, renderItem]
  )

  // Row renderer for fixed size
  const Row = useMemo(
    () =>
      memo(({ index, style, data }) => {
        const { items: listItems, renderItem: render } = data
        const item = listItems[index]

        return (
          <div style={style}>
            {render ? render(item, index) : <div>Item {index}</div>}
          </div>
        )
      }),
    []
  )

  // Row renderer for variable size
  const VariableRow = useMemo(
    () =>
      memo(({ index, style, data }) => {
        const { items: listItems, renderItem: render, itemSize: getItemSize } = data
        const item = listItems[index]

        return (
          <div style={style}>
            {render ? render(item, index) : <div>Item {index}</div>}
          </div>
        )
      }),
    []
  )

  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <p className="text-gray-500">No items to display</p>
      </div>
    )
  }

  const listProps = {
    height,
    width,
    itemCount: items.length,
    itemData: isVariableSize
      ? { ...itemData, itemSize }
      : itemData,
    overscanCount,
    onItemsRendered,
    className,
    ...props,
  }

  if (isVariableSize) {
    return (
      <VariableSizeList
        {...listProps}
        itemSize={(index) => (typeof itemSize === 'function' ? itemSize(index) : itemSize)}
      >
        {VariableRow}
      </VariableSizeList>
    )
  }

  return (
    <FixedSizeList {...listProps} itemSize={itemHeight}>
      {Row}
    </FixedSizeList>
  )
}

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  height: PropTypes.number,
  itemHeight: PropTypes.number, // For fixed size
  itemSize: PropTypes.oneOfType([PropTypes.number, PropTypes.func]), // For variable size
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  renderItem: PropTypes.func.isRequired,
  overscanCount: PropTypes.number,
  onItemsRendered: PropTypes.func,
}

export default memo(VirtualList)


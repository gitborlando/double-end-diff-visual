import { FC, memo } from 'react'
import { VNode } from '~/handle/state'
import { Flex } from '../widget/flex'

export const NodeComp: FC<{ node: VNode; type: 'old' | 'new'; activeIndex: number }> = memo(
  ({ type, node, activeIndex }) => {
    return <Flex className='lay-v wh-100-200 b-1-black'></Flex>
  },
)

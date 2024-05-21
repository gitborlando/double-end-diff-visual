import { FC, memo, useEffect } from 'react'
import { nextStep$ } from '~/handle'
import { diff } from '~/handle/diff'
import { State, VNode } from '~/handle/state'
import { useHookSignal } from '~/shared/signal/signal-react'
import { cx, iife } from '~/shared/utils/normal'
import { useMemoComp } from '~/shared/utils/react'
import arrow from './assets/arrow.svg'
import { Flex } from './widget/flex'

type IAppProps = {}

export const App: FC<IAppProps> = memo(() => {
  useEffect(() => void diff())
  useHookSignal(State.stateChanged$)

  const ContentComp = useMemoComp([{}], ({}) => {
    const { UIChildren, oldChildren, newChildren, newHead, newTail, oldHead, oldTail, stage } =
      State.state

    const NodeComp = useMemoComp<{
      node: VNode
      type: 'old' | 'new'
      index: number
      head: number
      tail: number
    }>([stage], ({ type, node, head, tail, index }) => {
      const active = iife(() => {
        if (stage === 'hh') return head === index
        if (stage === 'tt') return tail === index
        if (stage === 'ht') return type === 'old' ? head === index : tail === index
        if (stage === 'th') return type === 'new' ? head === index : tail === index
        if (stage === 'seeking') return type === 'new' && head === index
      })
      const seekingIndex = useHookSignal(State.seekingIndex$)
      const isSeeking = stage === 'seeking' && type === 'old' && seekingIndex === index
      return (
        <Flex className='lay-v wh-100-fit'>
          <Flex className='lay-v wh-100%-70'>
            {head === index && (
              <h4 className='text-14'>{type === 'old' ? 'oldHead' : 'newHead'}</h4>
            )}
            {tail === index && (
              <h4 className='text-14'>{type === 'old' ? 'oldTail' : 'newTail'}</h4>
            )}
            {(head === index || tail === index) && <img className='wh-50-50' src={arrow}></img>}
          </Flex>
          <Flex
            className={cx(
              ['lay-c wh-100%-100-10'],
              [node.deleted, 'b-1.5-rgba(255,0,0,0.5) text-[rgba(255,0,0,0.5)]'],
              [!node.live, 'b-1.5-rgba(0,0,0,0.1) text-[rgba(0,0,0,0.1)]'],
              [!!active, 'bg-[#2CDE5F] text-white'],
              [isSeeking, 'bg-[#5AED84] text-white'],
              ['b-1.5-black'],
            )}>
            <h4 className='text-20'>{node.value}</h4>
          </Flex>
        </Flex>
      )
    })

    const InfoComp = useMemoComp([], ({}) => {
      const info = useHookSignal(State.info$)
      return <Flex className='translate-y-20'>{info}</Flex>
    })

    return (
      <Flex className='lay-v mt-10 -ml-100'>
        <Flex className='lay-h wh-100%-fit gap-0-40 my-30'>
          <Flex className='lay-c w-150 translate-y-30'>旧node列表</Flex>
          {oldChildren.map((node, i) => (
            <NodeComp
              key={node.key + 'old'}
              node={node}
              type='old'
              head={oldHead}
              tail={oldTail}
              index={i}
            />
          ))}
        </Flex>
        <InfoComp />
        <Flex className='lay-h wh-100%-fit gap-0-40 my-30'>
          <Flex className='lay-c w-150 translate-y-30'>新node列表</Flex>
          {newChildren.map((node, i) => (
            <NodeComp
              key={node.key + 'new'}
              node={node}
              type='new'
              head={newHead}
              tail={newTail}
              index={i}
            />
          ))}
        </Flex>
        <Flex className='lay-h wh-100%-fit gap-0-40 my-30'>
          <Flex className='lay-c w-150'>真实dom列表</Flex>
          {UIChildren.map((node, i) => (
            <Flex key={node.key + 'dom'} className='lay-c wh-100-100-10 b-1.5-black'>
              <h4 className='text-20'>{node.value}</h4>
            </Flex>
          ))}
        </Flex>
        <Flex className='lay-h wh-100%-fit pl-150 my-30'>
          {/* <Flex
            className='lay-c wh-120-60-10 mr-auto bg-[#2CDE5F] text-white pointer active:bg-[#5AED84]'
            onClick={() => State.prevState()}>
            上一步
          </Flex> */}
          <Flex
            className='lay-c wh-120-60-10 ml-auto bg-[#2CDE5F] text-white pointer active:bg-[#5AED84]'
            onClick={() => nextStep$.dispatch()}>
            下一步
          </Flex>
        </Flex>
      </Flex>
    )
  })

  return (
    <Flex className='lay-v wh-100% bg-white'>
      <Flex className='lay-h wh-100%-70 borderBottom px-20'>
        <h2>可视化双端对比算法</h2>
      </Flex>
      <ContentComp />
    </Flex>
  )
})

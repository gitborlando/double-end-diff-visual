import { nextStep$ } from '.'
import { State, VNode } from './state'

const wait = (t: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), t)
  })
}

const next = () => {
  return new Promise<void>((resolve) => {
    const dispose = nextStep$.hook(() => {
      resolve()
      State.nextState()
      dispose()
    })
  })
}

const state = () => State.state

export async function diff() {
  function leftMove() {
    while (state().oldChildren[state().oldTail].live === false) {
      state().oldTail--
    }
  }
  function rightMove() {
    while (state().oldChildren[state().oldHead].live === false) {
      state().oldHead++
    }
  }

  if (state().oldHead <= state().oldTail && state().newHead <= state().newTail) {
    let oldHeadNode = state().oldChildren[state().oldHead]
    let newHeadNode = state().newChildren[state().newHead]
    let oldTailNode = state().oldChildren[state().oldTail]
    let newTailNode = state().newChildren[state().newTail]
    if (!oldHeadNode.live) state().oldHead++
    switch (state().stage) {
      case 'hh':
        if (oldHeadNode.key == newHeadNode.key) {
          oldHeadNode.live = false
          newHeadNode.live = false
          rightMove()
          state().newHead++
          state().stage = 'hh'
          State.info$.dispatch('头-头:对比相同,头-头指针同时右移')
          return await next()
        }
        State.info$.dispatch('头-头:对比不相同, 进入尾-尾对比')
        State.nextStage()
        return await next()
      case 'tt':
        if (oldTailNode.key === newTailNode.key) {
          oldTailNode.live = false
          newTailNode.live = false
          leftMove()
          state().newTail--
          state().stage = 'hh'
          State.info$.dispatch('尾-尾:对比相同, 尾-尾指针同时左移')
          return await next()
        }
        State.info$.dispatch('尾-尾:对比不相同, 进入头尾对比')
        State.nextStage()
        return await next()
      case 'ht':
        if (oldHeadNode.key === newTailNode.key) {
          insertBefore(state().UIChildren, oldHeadNode, oldTailNode)
          oldHeadNode.live = false
          newTailNode.live = false
          rightMove()
          state().newTail--
          state().stage = 'hh'
          State.info$.dispatch('头尾对比--' + '相同')
          return await next()
        }
        State.info$.dispatch('头尾对比--' + '不相同')
        State.nextStage()
        return await next()
      case 'th':
        if (oldTailNode.key === newHeadNode.key) {
          oldTailNode.live = false
          newHeadNode.live = false
          insertBefore(state().UIChildren, oldTailNode, oldHeadNode)
          // insertBefore(UIChildren, oldTailNode, oldHeadNode)
          leftMove()
          state().newHead++
          state().stage = 'hh'
          State.info$.dispatch('尾头对比--' + '相同')
          return await next()
        }
        State.info$.dispatch('尾头对比--' + '不相同')
        State.nextStage()
        return await next()
      case 'seeking':
        const newChild = state().newChildren[state().newHead]
        let oldChild: VNode | null = null
        const oldChildren = state().oldChildren
        for (let i = state().oldHead; i < oldChildren.length; i++) {
          if (!oldChildren[i].live) continue
          State.info$.dispatch('在旧列表寻找可复用节点')
          State.seekingIndex$.dispatch(i)
          if (oldChildren[i].key === newChild.key) {
            oldChild = oldChildren[i]
            break
          } else {
            await wait(500)
          }
        }
        if (oldChild) {
          insertBefore(state().UIChildren, oldChild, oldHeadNode)
          oldChild.live = false
        } else {
          insertBefore(state().UIChildren, newChild, oldHeadNode)
        }
        State.info$.dispatch('找到可复用节点, patch dom')
        state().newHead++
        state().stage = 'hh'
        newHeadNode.live = false
        await next()
    }
  }
  if (state().oldHead > state().oldTail) {
    // 新增
    // 始终插入到 state().newChildren[state().newTail + 1] 之前能维持新插入的元素，从前到后的顺序
    // null 默认插入到最后面
    // const before =
    //   state().newChildren[state().newTail + 1] == null
    //     ? null
    //     : state().newChildren[state().newTail + 1]
    // for (let i = state().newHead; i <= state().newTail; i++) {
    //   insertBefore(UIChildren, state().newChildren[i], before)
    // }
    for (let i = state().newHead; i <= state().newTail; i++) {
      insertBefore(state().UIChildren, state().newChildren[i], state().oldHead)
    }
    return await next()
  } else if (state().newTail < state().newHead) {
    State.info$.dispatch('批量删除旧列表多余项')
    for (let i = state().oldHead; i <= state().oldTail; i++) {
      if (!state().oldChildren[i].live) continue
      removeChild(state().UIChildren, state().oldChildren[i])
    }
    return await next()
  }
}

export function insertBefore(input: VNode[], item: VNode, refItem: VNode) {
  if (item === refItem) return input
  const itemIdx = input.findIndex((i) => i.key === item.key)
  if (itemIdx > -1) {
    input.splice(itemIdx, 1) // 删除
  }

  let refItemIdx = input.findIndex((i) => i.key === refItem.key)
  refItemIdx = refItem == null || refItemIdx === -1 ? input.length : refItemIdx
  input.splice(refItemIdx, 0, item) // 增加

  return input
}

export function removeChild(input: VNode[], item: VNode) {
  const idx = input.findIndex((i) => i.key === item.key)
  if (idx > -1) {
    input.splice(idx, 1)
  }
  return input
}

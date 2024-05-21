import { createSignal } from '~/shared/signal/signal'
import { BREAK, loopFor } from '~/shared/utils/array'
import { clone } from '.'

export type VNode = {
  key: string
  value: string
  live: boolean
  deleted: boolean
}

function randomVNode(count: number): VNode[] {
  const keys = Array.from('abcdefghijklmnopqrstuvwxyz'.slice(0, count))
  const getKey = () => {
    let index = Math.floor(Math.random() * count)
    let key = keys[index]
    while (!key) {
      index = Math.floor(Math.random() * count)
      key = keys[index]
    }
    keys.splice(index, 1)
    return key
  }
  return Array.from({ length: count }, () => {
    const key = getKey()
    return { key, value: key, live: true, deleted: false }
  })
}

type IState = {
  oldChildren: VNode[]
  newChildren: VNode[]
  UIChildren: VNode[]
  newHead: number
  newTail: number
  oldHead: number
  oldTail: number
  /** hh === head vs head, tt === 'tail vs tail */
  stage: 'hh' | 'tt' | 'ht' | 'th' | 'seeking' | 'dealRest'
  info: string
}

export const State = new (class {
  stateChanged$ = createSignal()
  seekingIndex$ = createSignal(0)
  info$ = createSignal('')
  private states = <IState[]>[]
  private curStateIndex = 0
  private stages = <IState['stage'][]>['hh', 'tt', 'ht', 'th', 'seeking', 'dealRest']
  get state() {
    return this.states[this.curStateIndex]
  }
  constructor() {
    this.states.push(this.createState())
  }
  nextState() {
    this.states.push(clone(State.state))
    this.curStateIndex++
    this.stateChanged$.dispatch()
  }
  prevState() {
    if (this.states.length <= 2) return
    this.states.pop()
    this.curStateIndex--
    this.stateChanged$.dispatch()
  }
  nextStage(stage?: IState['stage']) {
    if (stage) return (this.state.stage = stage)
    loopFor(this.stages, (cur, next) => {
      if (cur === this.state.stage) {
        this.state.stage = next
        return BREAK
      }
    })
  }
  private createState = () => {
    const oldChildren = randomVNode(8)
    const newChildren = randomVNode(7)
    const UIChildren = clone(oldChildren)
    return <IState>{
      oldChildren,
      newChildren,
      UIChildren,
      newHead: 0,
      newTail: newChildren.length - 1,
      oldHead: 0,
      oldTail: oldChildren.length - 1,
      stage: 'hh',
      info: '头头对比-',
    }
  }
})()

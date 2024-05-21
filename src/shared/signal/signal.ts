import { nanoid } from 'nanoid'
import { createCache } from '../utils/cache'
import { iife } from '../utils/normal'

type IHook<T> = (value: T, args?: any) => void

export type IHookOption = {
  id?: string
  immediately?: boolean
  once?: boolean
  before?: string
  after?: string
  beforeAll?: boolean
  afterAll?: boolean
}

export class Signal<T extends any> {
  newValue!: T
  oldValue!: T
  private _intercept?: (value: T) => T | void
  private hooks = <IHook<T>[]>[]
  private optionCache = createCache<IHook<T>, IHookOption>()
  private args: any
  constructor(value?: T) {
    this.newValue = value ?? this.newValue
    this.oldValue = value ?? this.oldValue
  }
  get value(): T {
    return this.newValue
  }
  set value(value: T) {
    this.oldValue = this.newValue
    const interceptRes = this._intercept?.(value)
    this.newValue = interceptRes ?? value
  }
  hook(hook: IHook<T>): () => void
  hook(option: IHookOption, hook: IHook<T>): () => void
  hook(hookOrOption: IHook<T> | IHookOption, hookCallback?: IHook<T>) {
    const [hook, option] = iife<[IHook<T>, IHookOption]>(() => {
      if (hookCallback) return [hookCallback, hookOrOption as IHookOption]
      return [hookOrOption as IHook<T>, {} as IHookOption]
    })
    this.optionCache.set(hook, option)
    if (option.immediately && option.once) {
      hook(this.value)
    } else if (option.immediately) {
      hook(this.value)
      this.hooks.push(hook)
    } else if (option.once) {
      const onceFunc = () => void hook(this.value) || this.unHook(onceFunc)
      this.optionCache.set(onceFunc, option)
      this.hooks.push(onceFunc)
    } else {
      this.hooks.push(hook)
    }
    this.reHierarchy()
    return () => this.unHook(hook)
  }
  dispatch(value?: T | ((value: T) => void), args?: any) {
    if (typeof value === 'function') {
      ;(value as Function)(this.value)
    } else if (value !== undefined) {
      this.value = value
    }
    this.args = args
    this.runHooks()
  }
  intercept(handle: (value: T) => T | void) {
    this._intercept = handle
  }
  private unHook(hook: IHook<T>) {
    const index = this.hooks.findIndex((i) => i === hook)
    index !== -1 && this.hooks.splice(index, 1)
  }
  private runHooks() {
    if (signalBatchMap.get(this)) return
    this.hooks.forEach((hook) => hook(this.value, this.args))
    this.args = undefined
  }
  private reHierarchy() {
    this.hooks.forEach((hook) => {
      const option = this.optionCache.get(hook)
      const selfIndex = this.hooks.findIndex((i) => i === hook)
      if (option.beforeAll) {
        this.hooks.splice(selfIndex, 1)
        this.hooks.unshift(hook)
        return
      }
      if (option.afterAll) {
        this.hooks.splice(selfIndex, 1)
        this.hooks.push(hook)
        return
      }
      if (option.before) {
        const anotherIndex = this.hooks.findIndex((i) => {
          return this.optionCache.get(i).id === option.before
        })
        if (selfIndex > anotherIndex) {
          this.hooks.splice(selfIndex, 1)
          this.hooks.splice(anotherIndex, 0, hook)
        }
      }
      if (option.after) {
        const anotherIndex = this.hooks.findIndex((i) => {
          return this.optionCache.get(i).id === option.after
        })
        if (selfIndex < anotherIndex) {
          this.hooks.splice(selfIndex, 1)
          this.hooks.splice(anotherIndex + 1, 0, hook)
        }
      }
    })
  }
}

export function createSignal<T extends any>(value?: T) {
  return new Signal<T>(value)
}

const mergeSignalCache = createCache<string, Signal<any>>()
const mergeSignalIdCache = createCache<Signal<any>, string>()

export function mergeSignal(...signals: Signal<any>[]) {
  const id = signals.reduce((allId, signal) => {
    return allId + '-' + mergeSignalIdCache.getSet(signal, () => nanoid())
  }, '')
  return mergeSignalCache.getSet(id, () => {
    const mergedSignal = createSignal<void>()
    let fullFill = new Array(signals.length).fill(false)
    signals.forEach((signal, index) => {
      signal.hook(() => {
        fullFill[index] = true
        if (fullFill.every((i) => i === true)) {
          mergedSignal.dispatch()
          fullFill = new Array(signals.length).fill(false)
        }
      })
    })
    return mergedSignal
  })
}

const signalBatchMap = createCache<Signal<any>, boolean>()

export function batchSignal(...signals: Signal<any>[]) {
  signals.forEach((signal) => signalBatchMap.set(signal, true))
  return () => {
    signals.forEach((signal) => signalBatchMap.set(signal, false))
    signals.forEach((signal) => signal.dispatch())
  }
}

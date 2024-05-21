import {
  FC,
  ReactNode,
  Suspense,
  createElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { IAnyFunc } from './normal'

export function useMemoComp<P extends {}>(deps: any[], component: FC<P>) {
  const comp = useRef(component)
  const depsChanged = useRef(false)
  comp.current = useCallback(component, deps)
  depsChanged.current = false
  useMemo(() => (depsChanged.current = true), deps)
  return useCallback(
    memo(
      (props: P) => createElement(comp.current, props),
      (prev, cur) => {
        if (depsChanged.current) return false //@ts-ignore
        return Object.keys(prev).every((key) => prev[key] === cur[key])
      }
    ),
    [deps.length]
  )
}

export function withSuspense(node: ReactNode, fallback?: ReactNode) {
  return createElement(Suspense, { fallback }, node)
}

export function useAnimationFrame(callback: IAnyFunc) {
  useEffect(() => {
    const loop = () => {
      callback()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }, [])
}

export function useAsyncEffect(callback: Function, deps = []) {
  useEffect(() => void (async () => callback())(), deps)
}

export function useMatchPatch(...pattens: string[]) {
  const disposers = useRef<Function[]>([])
  const update = useState({})[1]
  useEffect(() => {
    pattens.forEach((patten) => {
      //  disposers.current.push(Schema.onMatchPatch(patten, () => update({})))
    })
    return () => disposers.current.forEach((disposer) => disposer())
  }, [])
}

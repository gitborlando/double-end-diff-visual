import { createSignal } from '~/shared/signal/signal'

export const nextStep$ = createSignal()
export const prevStep$ = createSignal()

export function clone(object: any) {
  if (typeof object !== 'object') return object
  const newObj: any = Array.isArray(object) ? [] : {}
  for (const key in object) newObj[key] = clone(object[key])
  return newObj
}

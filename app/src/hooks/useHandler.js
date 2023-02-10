import { useRef } from 'react'

export function useHandler (callback){
  const bouncer: any = (...args: any[]) => stateRef.current.callback(...args)
  const stateRef = useRef({ callback, bouncer })
  stateRef.current.callback = callback

  return stateRef.current.bouncer
}
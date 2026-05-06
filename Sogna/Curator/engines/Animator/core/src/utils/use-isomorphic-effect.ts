"use client"

import { useEffect, useLayoutEffect } from "react"
import { isBrowser } from "./is-browser.js"

export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect

import { frame, microtask } from "sognaflow-dom"

export async function nextFrame() {
    return new Promise<void>((resolve) => {
        frame.postRender(() => resolve())
    })
}

export async function nextMicrotask() {
    return new Promise<void>((resolve) => {
        microtask.postRender(() => resolve())
    })
}

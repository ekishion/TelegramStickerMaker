import type { Directive } from 'vue'

let revealObserver: IntersectionObserver | null = null

const getObserver = () => {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            revealObserver?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
  }
  return revealObserver
}

/**
 * v-reveal: fade-and-rise on first scroll into view.
 * Usage: v-reveal or v-reveal="120" (stagger delay in ms).
 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (typeof binding.value === 'number') {
      el.style.setProperty('--reveal-delay', `${binding.value}ms`)
    }
    getObserver().observe(el)
  },
  unmounted(el) {
    revealObserver?.unobserve(el)
  }
}

interface MagneticBinding {
  strength?: number
}

/**
 * v-magnetic: element content leans toward the pointer, springs back on leave.
 * Pointer-fine devices only; skips reduced-motion users.
 */
export const vMagnetic: Directive<HTMLElement, MagneticBinding | undefined> = {
  mounted(el, binding) {
    if (!import.meta.client) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const strength = binding.value?.strength ?? 0.28
    el.classList.add('is-magnetic')

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`
    }

    const onLeave = () => {
      el.style.transform = ''
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    ;(el as HTMLElement & { __magneticCleanup?: () => void }).__magneticCleanup = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  },
  unmounted(el) {
    ;(el as HTMLElement & { __magneticCleanup?: () => void }).__magneticCleanup?.()
  }
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('reveal', vReveal)
  nuxtApp.vueApp.directive('magnetic', vMagnetic)
})

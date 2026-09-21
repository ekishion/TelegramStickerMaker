import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve: ((result: boolean) => void) | null
}

const state = ref<ConfirmState>({
  open: false,
  options: { title: '' },
  resolve: null
})

/**
 * One shared confirmation dialog. Call `confirm({...})` from anywhere and await
 * the boolean; the dialog itself is mounted once by the layout.
 */
export function useConfirm() {
  const confirm = (options: ConfirmOptions) => new Promise<boolean>(resolve => {
    state.value = { open: true, options, resolve }
  })

  const settle = (result: boolean) => {
    const resolve = state.value.resolve
    state.value.open = false
    state.value.resolve = null
    resolve?.(result)
  }

  return {
    state,
    confirm,
    cancel: () => settle(false),
    accept: () => settle(true)
  }
}

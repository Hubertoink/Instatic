import { afterEach, describe, expect, it, mock } from 'bun:test'
import { installImageLightbox } from '@core/imageLightboxRuntime'

describe('image lightbox runtime', () => {
  const Dialog = document.defaultView!.HTMLDialogElement
  const originalShowModal = Dialog.prototype.showModal
  const originalClose = Dialog.prototype.close
  const originalScrollTo = window.scrollTo
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
    document.body.innerHTML = ''
    Dialog.prototype.showModal = originalShowModal
    Dialog.prototype.close = originalClose
    window.scrollTo = originalScrollTo
  })

  function install(html: string) {
    document.body.innerHTML = html
    Dialog.prototype.showModal = function () { this.setAttribute('open', '') }
    Dialog.prototype.close = function () { this.removeAttribute('open') }
    window.scrollTo = mock(() => {})
    cleanup = installImageLightbox(document)
  }

  function dialog() {
    return document.body.querySelector('div')?.shadowRoot?.querySelector('dialog')
  }

  it('opens the original image with the keyboard and restores focus on close', () => {
    install('<img data-instatic-lightbox src="/original.png" srcset="/small.webp 320w" alt="Example">')
    const source = document.querySelector('img')!
    expect(source.getAttribute('role')).toBe('button')
    expect(source.tabIndex).toBe(0)
    source.focus()
    source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(dialog()?.open).toBe(true)
    expect(dialog()?.querySelector('img')?.src).toBe(source.src)
    expect(dialog()?.querySelector('img')?.alt).toBe('Example')
    cleanup?.()
    cleanup = undefined
    expect(document.activeElement).toBe(source)
    expect(source.hasAttribute('role')).toBe(false)
  })

  it('preserves existing link behavior', () => {
    install('<a href="/target"><img data-instatic-lightbox src="/original.png"></a>')
    const source = document.querySelector('img')!
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    source.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(false)
    expect(source.hasAttribute('role')).toBe(false)
    expect(dialog()).toBeUndefined()
  })

  it('continues to open content-editor lightboxes using their original link', () => {
    install('<a class="instatic-lightbox-trigger" href="/original.png"><img src="/small.webp"></a>')
    const link = document.querySelector('a')!
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.querySelector('img')!.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(dialog()?.querySelector('img')?.src).toBe(link.href)
  })

  it('prepares dynamically inserted images and removes controls if moved into a link', async () => {
    install('<section></section><a href="/target"></a>')
    const source = document.createElement('img')
    source.setAttribute('data-instatic-lightbox', '')
    source.src = '/original.png'
    document.querySelector('section')!.append(source)
    await Promise.resolve()
    expect(source.getAttribute('role')).toBe('button')
    document.querySelector('a')!.append(source)
    await Promise.resolve()
    expect(source.hasAttribute('role')).toBe(false)
    expect(source.hasAttribute('tabindex')).toBe(false)
  })
})

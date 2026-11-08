import type { MediaImagePresentation } from './mediaImagePresentation'

/** ProseMirror JSON shapes shared by the Markdown converter and its callers. */
export interface JSONMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface JSONNode {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
  marks?: JSONMark[]
  text?: string
}

export function mediaNode(
  mediaType: 'image' | 'video',
  src: string,
  alt: string,
  presentation: Partial<MediaImagePresentation> = {},
): JSONNode {
  return {
    type: 'media',
    attrs: {
      mediaType,
      src,
      alt,
      size: presentation.size ?? 'l',
      lightbox: presentation.lightbox ?? false,
      title: presentation.title ?? '',
    },
  }
}

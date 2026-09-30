import { useState } from 'react'
import { MediaPickerModal } from '@admin/pages/media/components/MediaPickerModal/MediaPickerModal'
import { Button } from '@ui/components/Button'
import { Select } from '@ui/components/Select'

export function LinkTargetFields({ url, download, onUrlChange, onDownloadChange }: {
  url: string
  download: boolean
  onUrlChange: (url: string, filename: string) => void
  onDownloadChange: (download: boolean) => void
}) {
  const [picking, setPicking] = useState(false)
  return <>
    <Button type="button" variant="ghost" onClick={() => setPicking(true)}>Media library</Button>
    <Select aria-label="Link action" value={download ? 'download' : 'open'}
      onChange={(event) => onDownloadChange(event.target.value === 'download')}>
      <option value="open">Open</option>
      <option value="download">Download</option>
    </Select>
    <MediaPickerModal open={picking} mediaKind="any" currentValue={url}
      onClose={() => setPicking(false)} onPick={(asset) => {
        onUrlChange(asset.publicPath, asset.filename)
        setPicking(false)
      }} />
  </>
}

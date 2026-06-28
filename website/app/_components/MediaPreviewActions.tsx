'use client';

import { Download, ExternalLink, X } from 'lucide-react';

type MediaPreviewActionsProps = {
  url: string;
  filename: string;
  labels: {
    close: string;
    download: string;
    open: string;
  };
  onClose: () => void;
};

export function MediaPreviewActions({ url, filename, labels, onClose }: MediaPreviewActionsProps) {
  return (
    <div className="media-preview-actions" aria-label={filename}>
      <a className="media-preview-action-button" href={url} download={filename} aria-label={labels.download} title={labels.download}>
        <Download size={20} aria-hidden="true" />
      </a>
      <a className="media-preview-action-button" href={url} target="_blank" rel="noopener noreferrer" aria-label={labels.open} title={labels.open}>
        <ExternalLink size={20} aria-hidden="true" />
      </a>
      <button type="button" className="media-preview-action-button primary" onClick={onClose} aria-label={labels.close} title={labels.close}>
        <X size={22} aria-hidden="true" />
      </button>
    </div>
  );
}

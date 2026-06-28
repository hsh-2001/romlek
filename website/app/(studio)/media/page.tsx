'use client';

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, UploadCloud, Video, X } from 'lucide-react';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { StudioShell } from '@/app/_components/StudioShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { useTimelinePosts, type TimelineMedia } from '@/app/_hooks/useTimelinePosts';

type MediaFilter = 'all' | TimelineMedia['kind'];

const filterOptions: MediaFilter[] = ['all', 'image', 'video', 'file'];

const getFilterLabelKey = (filter: MediaFilter) => {
  if (filter === 'image') return 'media.images';
  if (filter === 'video') return 'media.videos';
  if (filter === 'file') return 'media.files';
  return 'media.all';
};

const getMediaIcon = (kind: TimelineMedia['kind']) => {
  if (kind === 'image') return ImageIcon;
  if (kind === 'video') return Video;
  return FileText;
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function StudioMediaPage() {
  const { api, user } = useAuth();
  const { t } = usePreferences();
  const [refreshKey, setRefreshKey] = useState(0);
  const posts = useTimelinePosts(refreshKey);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaItems = useMemo(
    () =>
      posts.flatMap((post) =>
        post.media.map((media) => ({
          ...media,
          postId: post.id,
          author: post.name,
          time: post.time,
        })),
      ),
    [posts],
  );
  const filteredMedia = mediaItems.filter((media) => activeFilter === 'all' || media.kind === activeFilter);
  const canUpload = selectedFiles.length > 0 && !isUploading;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(event.target.files ?? []));
    setUploadProgress(0);
    setUploadMessage('');
    setUploadError('');
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadMessage('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('path', 'media');
    formData.append('is_public', 'true');

    if (user?.id !== undefined && user?.id !== null) {
      formData.append('uploaded_by', String(user.id));
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('');
    setUploadError('');

    try {
      await api('/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }

          setUploadProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)));
        },
      });
      setUploadProgress(100);
      clearSelectedFiles();
      setUploadMessage(t('media.uploadSuccess'));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('media.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StudioShell active="media">
      <section className="studio-media-page">
        <header className="studio-media-header">
          <div>
            <span className="studio-label">Romlek Studio</span>
            <h1>{t('media.title')}</h1>
            <p>{t('media.subtitle')}</p>
          </div>
        </header>

        <section className="studio-media-upload" aria-label={t('media.uploadTitle')}>
          <div className="studio-upload-copy">
            <UploadCloud size={22} aria-hidden="true" />
            <div>
              <h2>{t('media.uploadTitle')}</h2>
              <p>{t('media.uploadBody')}</p>
            </div>
          </div>
          <label className="studio-upload-dropzone">
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} />
            <span>{t('media.chooseFiles')}</span>
            <small>{selectedFiles.length ? t('media.filesSelected').replace('{count}', String(selectedFiles.length)) : t('media.noFilesSelected')}</small>
          </label>
          {selectedFiles.length ? (
            <div className="studio-upload-list">
              {selectedFiles.map((file) => (
                <span key={`${file.name}-${file.size}-${file.lastModified}`}>
                  {file.name}
                  <small>{formatFileSize(file.size)}</small>
                </span>
              ))}
            </div>
          ) : null}
          <div className="studio-upload-actions">
            <button type="button" className="studio-upload-clear" onClick={clearSelectedFiles} disabled={!selectedFiles.length || isUploading} aria-label={t('media.clearFiles')}>
              <X size={17} aria-hidden="true" />
              {t('media.clearFiles')}
            </button>
            <button type="button" className="studio-upload-submit" onClick={handleUpload} disabled={!canUpload}>
              <UploadCloud size={17} aria-hidden="true" />
              {isUploading ? t('media.uploading') : t('media.upload')}
            </button>
          </div>
          {isUploading ? (
            <div className="studio-upload-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
              <span>
                <strong>{uploadProgress}%</strong>
              </span>
              <div>
                <i style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}
          {uploadMessage ? <p className="studio-upload-status success">{uploadMessage}</p> : null}
          {uploadError ? <p className="studio-upload-status error">{uploadError}</p> : null}
        </section>

        <div className="studio-media-filters" role="tablist" aria-label={t('media.title')}>
          {filterOptions.map((filter) => (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter}
              className={activeFilter === filter ? 'active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {t(getFilterLabelKey(filter))}
            </button>
          ))}
        </div>

        {filteredMedia.length ? (
          <section className="studio-media-grid" aria-label={t('media.title')}>
            {filteredMedia.map((media, index) => {
              const Icon = getMediaIcon(media.kind);
              return (
                <article key={`${media.postId}-${media.id}-${index}`} className={`studio-media-tile ${media.kind}`}>
                  <div className="studio-media-preview">
                    {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                    {media.kind === 'video' ? <HlsVideo src={media.url} hlsSrc={media.hlsUrl} poster={media.poster} /> : null}
                    {media.kind === 'file' ? (
                      <a href={media.url} target="_blank" rel="noopener noreferrer">
                        <FileText size={32} aria-hidden="true" />
                        <span>{media.alt}</span>
                      </a>
                    ) : null}
                  </div>
                  <footer>
                    <span><Icon size={15} aria-hidden="true" /> {t(getFilterLabelKey(media.kind))}</span>
                    <small>{media.author} · {media.time}</small>
                  </footer>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="studio-media-empty">
            <ImageIcon size={34} aria-hidden="true" />
            <h2>{t('media.emptyTitle')}</h2>
            <p>{t('media.emptyBody')}</p>
          </section>
        )}
      </section>
    </StudioShell>
  );
}

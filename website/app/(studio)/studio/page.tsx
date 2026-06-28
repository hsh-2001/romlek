'use client';

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Modal } from 'antd';
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  Globe2,
  Image as ImageIcon,
  Lock,
  Presentation,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { StudioShell } from '@/app/_components/StudioShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { useTimelinePosts, type TimelineMedia } from '@/app/_hooks/useTimelinePosts';

type MediaFilter = 'all' | TimelineMedia['kind'];
type UploadPhase = 'idle' | 'uploading' | 'processing' | 'complete';

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

const getFileExtension = (filename: string) => {
  const cleanFilename = filename.split('?')[0] || filename;
  const basename = cleanFilename.split('/').pop() || cleanFilename;
  return basename.includes('.') ? basename.split('.').pop()?.toLowerCase() ?? '' : '';
};

const getFileIcon = (filename: string) => {
  const extension = getFileExtension(filename);

  if (extension === 'pdf') return FileType;
  if (['doc', 'docx', 'txt', 'rtf', 'md'].includes(extension)) return FileText;
  if (['xls', 'xlsx', 'csv'].includes(extension)) return FileSpreadsheet;
  if (['ppt', 'pptx', 'key'].includes(extension)) return Presentation;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return FileArchive;
  if (['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(extension)) return FileAudio;
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'sql', 'xml'].includes(extension)) return FileCode;
  if (['json', 'jsonl'].includes(extension)) return FileJson;

  return File;
};

const getFileTypeLabel = (filename: string) => {
  const extension = getFileExtension(filename);
  return extension ? extension.toUpperCase() : 'FILE';
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
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [deletingMediaId, setDeletingMediaId] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploaderId = user?.id !== undefined && user?.id !== null ? String(user.id) : '';
  const posts = useTimelinePosts(refreshKey, { uploadedBy: uploaderId || '__missing_user__' });
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
  const canUpload = selectedFiles.length > 0 && Boolean(uploaderId) && !isUploading;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(event.target.files ?? []));
    setUploadProgress(0);
    setUploadPhase('idle');
    setUploadMessage('');
    setUploadError('');
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadPhase('idle');
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

    if (!uploaderId) {
      setUploadError(t('media.uploadRequiresUploader'));
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('path', 'media');
    formData.append('is_public', String(isPublicUpload));
    formData.append('uploaded_by', uploaderId);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
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

          const nextProgress = Math.min(100, Math.round((event.loaded / event.total) * 100));
          setUploadProgress(nextProgress);
          if (nextProgress >= 100) {
            setUploadPhase('processing');
          }
        },
      });
      setUploadPhase('complete');
      setUploadProgress(100);
      clearSelectedFiles();
      setUploadMessage(t('media.uploadSuccess'));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadPhase('idle');
      setUploadError(error instanceof Error ? error.message : t('media.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (media: TimelineMedia) => {
    Modal.confirm({
      title: t('media.deleteTitle'),
      content: t('media.deleteBody').replace('{name}', media.alt),
      okText: t('media.deleteConfirm'),
      cancelText: t('media.deleteCancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeletingMediaId(media.id);
        setUploadMessage('');
        setUploadError('');

        try {
          await api(`/upload/${encodeURIComponent(media.id)}`, {
            method: 'DELETE',
          });
          setUploadMessage(t('media.deleteSuccess'));
          setRefreshKey((value) => value + 1);
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : t('media.deleteError'));
          throw error;
        } finally {
          setDeletingMediaId('');
        }
      },
    });
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
          <div className="studio-upload-options">
            <div className="studio-upload-visibility">
              <span>{t('media.visibility')}</span>
              <div role="group" aria-label={t('media.visibility')}>
                <button
                  type="button"
                  className={!isPublicUpload ? 'active' : ''}
                  disabled={isUploading}
                  onClick={() => setIsPublicUpload(false)}
                >
                  <Lock size={16} aria-hidden="true" />
                  {t('media.privateLabel')}
                </button>
                <button
                  type="button"
                  className={isPublicUpload ? 'active' : ''}
                  disabled={isUploading}
                  onClick={() => setIsPublicUpload(true)}
                >
                  <Globe2 size={16} aria-hidden="true" />
                  {t('media.publicLabel')}
                </button>
              </div>
              <small>{isPublicUpload ? t('media.publicUploadBody') : t('media.privateUploadBody')}</small>
            </div>
            {uploaderId ? <p>{t('media.uploadedBy', { id: uploaderId })}</p> : <p className="error">{t('media.uploadRequiresUploader')}</p>}
          </div>
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
            <div
              className={`studio-upload-progress ${uploadPhase === 'processing' ? 'processing' : ''}`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadPhase === 'processing' ? undefined : uploadProgress}
            >
              <span>
                <small>{uploadPhase === 'processing' ? t('media.processingUpload') : t('media.uploadingFiles')}</small>
                <strong>{uploadPhase === 'processing' ? t('media.processing') : `${uploadProgress}%`}</strong>
              </span>
              <div>
                <i style={{ width: uploadPhase === 'processing' ? '100%' : `${uploadProgress}%` }} />
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
                    {media.kind === 'file' ? (() => {
                      const FileIcon = getFileIcon(media.alt || media.url);
                      return (
                        <a className="studio-file-preview" href={media.url} target="_blank" rel="noopener noreferrer">
                          <span className="studio-file-icon">
                            <FileIcon size={42} aria-hidden="true" />
                          </span>
                          <strong>{getFileTypeLabel(media.alt || media.url)}</strong>
                          <span>{media.alt}</span>
                        </a>
                      );
                    })() : null}
                  </div>
                  <footer>
                    <div>
                      <span><Icon size={15} aria-hidden="true" /> {t(getFilterLabelKey(media.kind))}</span>
                      <small>
                        {media.isPublic ? t('media.publicLabel') : t('media.privateLabel')}
                        {media.uploadedBy ? ` · ${t('media.uploadedByShort').replace('{id}', media.uploadedBy)}` : ''}
                        {' · '}
                        {media.time}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="studio-media-delete"
                      onClick={() => handleDelete(media)}
                      disabled={deletingMediaId === media.id}
                      aria-label={t('media.deleteMedia')}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
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

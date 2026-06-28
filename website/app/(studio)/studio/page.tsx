'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  Pencil,
  Globe2,
  Image as ImageIcon,
  Lock,
  MapPin,
  MessageSquareText,
  Presentation,
  Check,
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
  const [modal, modalContextHolder] = Modal.useModal();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [postLocation, setPostLocation] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [editingMedia, setEditingMedia] = useState<TimelineMedia | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isPostSelectionOpen, setIsPostSelectionOpen] = useState(false);
  const [selectionLocation, setSelectionLocation] = useState('');
  const [selectionCaption, setSelectionCaption] = useState('');
  const [isPostingSelection, setIsPostingSelection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [deletingMediaId, setDeletingMediaId] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const uploadWasCanceledRef = useRef(false);
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
  const filteredMediaIds = filteredMedia.map((media) => media.id);
  const selectedMedia = mediaItems.filter((media) => selectedMediaIds.includes(media.id));
  const selectedLibraryMedia = selectedMedia.filter((media) => !media.isPublic);
  const selectedVisibleCount = filteredMediaIds.filter((id) => selectedMediaIds.includes(id)).length;
  const hasSelectedMedia = selectedMediaIds.length > 0;
  const hasSelectedLibraryMedia = selectedLibraryMedia.length > 0;
  const allVisibleSelected = filteredMediaIds.length > 0 && selectedVisibleCount === filteredMediaIds.length;
  const hasPostDetails = postLocation.trim().length > 0 && postCaption.trim().length > 0;
  const canUpload = selectedFiles.length > 0 && Boolean(uploaderId) && !isUploading && (!isPublicUpload || hasPostDetails);

  useEffect(() => {
    setSelectedMediaIds((currentIds) => currentIds.filter((id) => mediaItems.some((media) => media.id === id)));
  }, [mediaItems]);

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

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((currentIds) => (currentIds.includes(mediaId) ? currentIds.filter((id) => id !== mediaId) : [...currentIds, mediaId]));
  };

  const selectVisibleMedia = () => {
    setSelectedMediaIds((currentIds) => Array.from(new Set([...currentIds, ...filteredMediaIds])));
  };

  const clearMediaSelection = () => {
    setSelectedMediaIds([]);
    setIsSelectionMode(false);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      return;
    }

    if (!uploaderId) {
      setUploadError(t('media.uploadRequiresUploader'));
      return;
    }

    if (isPublicUpload && !hasPostDetails) {
      setUploadError(t('media.postDetailsRequired'));
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    formData.append('path', 'media');
    formData.append('is_public', String(isPublicUpload));
    formData.append('uploaded_by', uploaderId);
    if (isPublicUpload) {
      formData.append('location', postLocation.trim());
      formData.append('caption', postCaption.trim());
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
    setUploadMessage('');
    setUploadError('');
    uploadWasCanceledRef.current = false;
    uploadAbortControllerRef.current = new AbortController();

    try {
      await api('/upload', {
        method: 'POST',
        body: formData,
        signal: uploadAbortControllerRef.current.signal,
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
      setPostLocation('');
      setPostCaption('');
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadPhase('idle');
      if (uploadWasCanceledRef.current) {
        setUploadProgress(0);
        return;
      }

      setUploadError(error instanceof Error ? error.message : t('media.uploadError'));
    } finally {
      setIsUploading(false);
      uploadAbortControllerRef.current = null;
      uploadWasCanceledRef.current = false;
    }
  };

  const cancelUpload = () => {
    uploadWasCanceledRef.current = true;
    uploadAbortControllerRef.current?.abort();
    setIsUploading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setUploadError('');
    setUploadMessage('');
  };

  const handleDelete = (media: TimelineMedia) => {
    modal.confirm({
      title: t('media.deleteTitle'),
      content: t('media.deleteBody').replace('{name}', media.alt),
      okText: t('media.deleteConfirm'),
      cancelText: t('media.deleteCancel'),
      okButtonProps: { danger: true },
      rootClassName: 'romlek-confirm-modal',
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

  const handleBatchDelete = () => {
    if (!selectedMedia.length) {
      return;
    }

    const selectedCount = selectedMedia.length;
    modal.confirm({
      title: t('media.batchDeleteTitle').replace('{count}', String(selectedCount)),
      content: t('media.batchDeleteBody').replace('{count}', String(selectedCount)),
      okText: t('media.deleteConfirm'),
      cancelText: t('media.deleteCancel'),
      okButtonProps: { danger: true },
      rootClassName: 'romlek-confirm-modal',
      onOk: async () => {
        setDeletingMediaId('__batch__');
        setUploadMessage('');
        setUploadError('');

        try {
          await Promise.all(
            selectedMedia.map((media) =>
              api(`/upload/${encodeURIComponent(media.id)}`, {
                method: 'DELETE',
              }),
            ),
          );
          clearMediaSelection();
          setUploadMessage(t('media.batchDeleteSuccess').replace('{count}', String(selectedCount)));
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

  const openPostingDetailsEditor = (media: TimelineMedia) => {
    setEditingMedia(media);
    setEditLocation(media.location || '');
    setEditCaption(media.caption || '');
    setUploadError('');
    setUploadMessage('');
  };

  const savePostingDetails = async () => {
    if (!editingMedia) {
      return;
    }

    const location = editLocation.trim();
    const caption = editCaption.trim();
    if (!location || !caption) {
      setUploadError(t('media.postDetailsRequired'));
      return;
    }

    setIsSavingDetails(true);
    setUploadError('');
    setUploadMessage('');

    try {
      await api(`/upload/${encodeURIComponent(editingMedia.id)}/posting-details`, {
        method: 'PATCH',
        body: { location, caption },
      });
      setEditingMedia(null);
      setUploadMessage(t('media.postDetailsUpdated'));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('media.postDetailsUpdateError'));
    } finally {
      setIsSavingDetails(false);
    }
  };

  const openPostSelectionDialog = () => {
    if (!selectedLibraryMedia.length) {
      return;
    }

    setSelectionLocation('');
    setSelectionCaption('');
    setUploadError('');
    setUploadMessage('');
    setIsPostSelectionOpen(true);
  };

  const saveSelectedAsPosts = async () => {
    const location = selectionLocation.trim();
    const caption = selectionCaption.trim();
    if (!location || !caption) {
      setUploadError(t('media.postDetailsRequired'));
      return;
    }

    setIsPostingSelection(true);
    setUploadError('');
    setUploadMessage('');

    try {
      await Promise.all(
        selectedLibraryMedia.map((media) =>
          api(`/upload/${encodeURIComponent(media.id)}/posting-details`, {
            method: 'PATCH',
            body: { location, caption },
          }),
        ),
      );
      setIsPostSelectionOpen(false);
      clearMediaSelection();
      setUploadMessage(t('media.postSelectedSuccess').replace('{count}', String(selectedLibraryMedia.length)));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('media.postDetailsUpdateError'));
    } finally {
      setIsPostingSelection(false);
    }
  };

  return (
    <StudioShell active="media">
      {modalContextHolder}
      <Modal
        className="romlek-edit-posting-modal"
        title={t('media.editPostingDetails')}
        open={Boolean(editingMedia)}
        okText={t('media.savePostingDetails')}
        cancelText={t('media.deleteCancel')}
        confirmLoading={isSavingDetails}
        onOk={() => void savePostingDetails()}
        onCancel={() => setEditingMedia(null)}
      >
        <div className="studio-post-details modal-fields">
          <label>
            <span><MapPin size={15} aria-hidden="true" /> {t('media.locationLabel')}</span>
            <input
              value={editLocation}
              disabled={isSavingDetails}
              placeholder={t('media.locationPlaceholder')}
              onChange={(event) => setEditLocation(event.target.value)}
            />
          </label>
          <label>
            <span><MessageSquareText size={15} aria-hidden="true" /> {t('media.captionLabel')}</span>
            <textarea
              value={editCaption}
              disabled={isSavingDetails}
              placeholder={t('media.captionPlaceholder')}
              rows={3}
              onChange={(event) => setEditCaption(event.target.value)}
            />
          </label>
        </div>
      </Modal>
      <Modal
        className="romlek-edit-posting-modal"
        title={t('media.postSelectedTitle').replace('{count}', String(selectedLibraryMedia.length))}
        open={isPostSelectionOpen}
        okText={t('media.postSelected')}
        cancelText={t('media.deleteCancel')}
        confirmLoading={isPostingSelection}
        onOk={() => void saveSelectedAsPosts()}
        onCancel={() => setIsPostSelectionOpen(false)}
      >
        <p className="studio-post-selection-body">{t('media.postSelectedBody')}</p>
        <div className="studio-post-details modal-fields">
          <label>
            <span><MapPin size={15} aria-hidden="true" /> {t('media.locationLabel')}</span>
            <input
              value={selectionLocation}
              disabled={isPostingSelection}
              placeholder={t('media.locationPlaceholder')}
              onChange={(event) => setSelectionLocation(event.target.value)}
            />
          </label>
          <label>
            <span><MessageSquareText size={15} aria-hidden="true" /> {t('media.captionLabel')}</span>
            <textarea
              value={selectionCaption}
              disabled={isPostingSelection}
              placeholder={t('media.captionPlaceholder')}
              rows={3}
              onChange={(event) => setSelectionCaption(event.target.value)}
            />
          </label>
        </div>
      </Modal>
      <section className="studio-media-page">

        <section className="studio-media-upload" aria-label={t('media.uploadTitle')}>
          <div className="studio-upload-copy">
            <UploadCloud size={22} aria-hidden="true" />
            <div>
              <h2>{t('media.uploadTitle')}</h2>
              <p>{t('media.uploadBody')}</p>
            </div>
          </div>
          <label className="studio-upload-dropzone">
            <input ref={fileInputRef} type="file" multiple disabled={isUploading} onChange={handleFileChange} />
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
                  {t('media.libraryOnlyLabel')}
                </button>
                <button
                  type="button"
                  className={isPublicUpload ? 'active' : ''}
                  disabled={isUploading}
                  onClick={() => setIsPublicUpload(true)}
                >
                  <Globe2 size={16} aria-hidden="true" />
                  {t('media.forPostingLabel')}
                </button>
              </div>
              <small>{isPublicUpload ? t('media.forPostingBody') : t('media.libraryOnlyBody')}</small>
            </div>
            {isPublicUpload ? (
              <div className="studio-post-details">
                <label>
                  <span><MapPin size={15} aria-hidden="true" /> {t('media.locationLabel')}</span>
                  <input
                    value={postLocation}
                    disabled={isUploading}
                    placeholder={t('media.locationPlaceholder')}
                    onChange={(event) => setPostLocation(event.target.value)}
                  />
                </label>
                <label>
                  <span><MessageSquareText size={15} aria-hidden="true" /> {t('media.captionLabel')}</span>
                  <textarea
                    value={postCaption}
                    disabled={isUploading}
                    placeholder={t('media.captionPlaceholder')}
                    rows={3}
                    onChange={(event) => setPostCaption(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </div>
          {isUploading ? (
            <div className="studio-upload-progress-card">
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
              <button type="button" className="studio-upload-cancel" onClick={cancelUpload}>
                <X size={17} aria-hidden="true" />
                {t('media.deleteCancel')}
              </button>
            </div>
          ) : (
            <div className="studio-upload-actions">
              <button type="button" className="studio-upload-clear" onClick={clearSelectedFiles} disabled={!selectedFiles.length} aria-label={t('media.clearFiles')}>
                <X size={17} aria-hidden="true" />
                {t('media.clearFiles')}
              </button>
              <button type="button" className="studio-upload-submit" onClick={handleUpload} disabled={!canUpload}>
                <UploadCloud size={17} aria-hidden="true" />
                {t('media.upload')}
              </button>
            </div>
          )}
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
          <div className={`studio-media-batchbar ${isSelectionMode ? 'active' : 'idle'}`} aria-label={t('media.selectionLabel')}>
            {isSelectionMode ? (
              <>
                <span>{t('media.selectedCount').replace('{count}', String(selectedMediaIds.length))}</span>
                <div>
                  <button type="button" onClick={selectVisibleMedia} disabled={allVisibleSelected || deletingMediaId === '__batch__'}>
                    {t('media.selectAll')}
                  </button>
                  <button type="button" onClick={clearMediaSelection} disabled={deletingMediaId === '__batch__'}>
                    {t('media.deleteCancel')}
                  </button>
                  <button type="button" className="danger" onClick={handleBatchDelete} disabled={!hasSelectedMedia || deletingMediaId === '__batch__'}>
                    <Trash2 size={15} aria-hidden="true" />
                    {t('media.deleteSelected')}
                  </button>
                  <button type="button" className="primary" onClick={openPostSelectionDialog} disabled={!hasSelectedLibraryMedia || deletingMediaId === '__batch__'}>
                    <Globe2 size={15} aria-hidden="true" />
                    {t('media.postSelected')}
                  </button>
                </div>
              </>
            ) : (
              <div className="studio-media-batchbar-start">
                <button type="button" className="primary" onClick={() => setIsSelectionMode(true)}>
                  <Check size={15} aria-hidden="true" />
                  {t('media.select')}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {filteredMedia.length ? (
          <section className="studio-media-grid" aria-label={t('media.title')}>
            {filteredMedia.map((media, index) => {
              const Icon = getMediaIcon(media.kind);
              const isSelected = selectedMediaIds.includes(media.id);
              return (
                <article key={`${media.postId}-${media.id}-${index}`} className={`studio-media-tile ${media.kind} ${isSelectionMode && isSelected ? 'selected' : ''}`}>
                  {isSelectionMode ? (
                    <button
                      type="button"
                      className="studio-media-select"
                      onClick={() => toggleMediaSelection(media.id)}
                      aria-label={t('media.selectMedia').replace('{name}', media.alt)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? <Check size={15} aria-hidden="true" /> : null}
                    </button>
                  ) : null}
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
                        {' · '}
                        {media.time}
                      </small>
                    </div>
                    {!isSelectionMode ? (
                      <div className="studio-media-actions">
                        {media.isPublic ? (
                          <button
                            type="button"
                            className="studio-media-edit"
                            onClick={() => openPostingDetailsEditor(media)}
                            disabled={deletingMediaId === '__batch__'}
                            aria-label={t('media.editPostingDetails')}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="studio-media-delete"
                          onClick={() => handleDelete(media)}
                          disabled={deletingMediaId === media.id || deletingMediaId === '__batch__'}
                          aria-label={t('media.deleteMedia')}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
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

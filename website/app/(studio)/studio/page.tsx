'use client';

import { type ChangeEvent, type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Modal } from 'antd';
import {
  FileText,
  Globe2,
  Image as ImageIcon,
  Lock,
  MapPin,
  MessageSquareText,
  MoreVertical,
  Check,
  CalendarDays,
  Clock3,
  Lightbulb,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import { CaptionEditor } from '@/app/_components/CaptionEditor';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { MediaPreviewActions } from '@/app/_components/MediaPreviewActions';
import { StudioShell } from '@/app/_components/StudioShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { useTimelinePosts, type TimelineMedia, type TimelinePost } from '@/app/_hooks/useTimelinePosts';

type MediaFilter = 'all' | TimelineMedia['kind'] | 'albums' | `album:${string}`;
type UploadPhase = 'idle' | 'uploading' | 'processing' | 'complete';
type TripStoryDetails = {
  title: string;
  location: string;
  caption: string;
  travelDate: string;
  duration: string;
  travelStyle: string;
  companions: string;
  budget: string;
  highlights: string;
  tips: string;
};
type UploadResponse = {
  files?: Array<{
    media?: {
      id?: string | number;
    };
  }>;
};
type SelectedUploadFile = {
  file: File;
  key: string;
  kind: 'image' | 'video' | 'file';
  previewUrl?: string;
};

const filterOptions: MediaFilter[] = ['all', 'image', 'video', 'file', 'albums'];

const getFilterLabelKey = (filter: MediaFilter) => {
  if (filter === 'image') return 'media.images';
  if (filter === 'video') return 'media.videos';
  if (filter === 'file') return 'media.files';
  if (filter === 'albums') return 'media.albums';
  return 'media.all';
};

const getMediaIcon = (kind: TimelineMedia['kind']) => {
  if (kind === 'image') return ImageIcon;
  if (kind === 'video') return Video;
  return FileText;
};

const getFileName = (media: Pick<TimelineMedia, 'alt' | 'url'>) => {
  const rawName = media.alt || media.url.split('/').pop() || 'Document';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getUploadedMediaIds = (payload: UploadResponse) => {
  return (payload.files ?? [])
    .map((file) => file.media?.id)
    .filter((id): id is string | number => id !== undefined && id !== null);
};

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const getSelectedFileKind = (file: File): 'image' | 'video' | 'file' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
};

const createSelectedUploadFile = (file: File): SelectedUploadFile => {
  const kind = getSelectedFileKind(file);

  return {
    file,
    key: getFileKey(file),
    kind,
    previewUrl: kind === 'file' ? undefined : URL.createObjectURL(file),
  };
};

const getUniqueMediaIds = (items: TimelineMedia[]) => Array.from(new Set(items.map((media) => media.id)));

const getDateKey = (value?: string) => {
  if (!value) {
    return 'unknown';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return 'unknown';
  }

  return date.toISOString().slice(0, 10);
};

const formatDateHeading = (value: string, fallback: string) => {
  if (value === 'unknown') {
    return fallback;
  }

  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const emptyTripStoryDetails = (): TripStoryDetails => ({
  title: '',
  location: '',
  caption: '',
  travelDate: '',
  duration: '',
  travelStyle: '',
  companions: '',
  budget: '',
  highlights: '',
  tips: '',
});

const getTripStoryPayload = (details: TripStoryDetails) => ({
  title: details.title.trim() || null,
  body: details.caption.trim(),
  location: details.location.trim(),
  travel_date: details.travelDate || null,
  duration: details.duration.trim() || null,
  travel_style: details.travelStyle.trim() || null,
  companions: details.companions.trim() || null,
  budget: details.budget.trim() || null,
  highlights: details.highlights.trim() || null,
  tips: details.tips.trim() || null,
});

export default function StudioMediaPage() {
  const { api, user } = useAuth();
  const { t } = usePreferences();
  const [modal, modalContextHolder] = Modal.useModal();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFile[]>([]);
  const [isPublicUpload, setIsPublicUpload] = useState(false);
  const [postDetails, setPostDetails] = useState<TripStoryDetails>(() => emptyTripStoryDetails());
  const [isPostSelectionOpen, setIsPostSelectionOpen] = useState(false);
  const [selectionDetails, setSelectionDetails] = useState<TripStoryDetails>(() => emptyTripStoryDetails());
  const [isPostingSelection, setIsPostingSelection] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<TimelineMedia | null>(null);
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
  const selectedFilesRef = useRef<SelectedUploadFile[]>([]);
  const uploaderId = user?.id !== undefined && user?.id !== null ? String(user.id) : '';
  const posts = useTimelinePosts(refreshKey, { uploadedBy: uploaderId || '__missing_user__' });
  const mediaItems = useMemo(
    () => {
      const uniqueMedia = new Map<string, TimelineMedia & {
        postId: TimelinePost['id'];
        albumSize: number;
        author: string;
        time: string;
        createdAt?: string;
      }>();

      posts.forEach((post) => {
        post.media.forEach((media) => {
          if (uniqueMedia.has(media.id)) {
            return;
          }

          uniqueMedia.set(media.id, {
            ...media,
            postId: post.id,
            albumId: media.albumId || post.albumId,
            albumCode: media.albumCode || post.albumCode,
            albumTitle: media.albumTitle || post.albumTitle,
            albumSize: post.media.length,
            author: post.name,
            time: post.time,
            createdAt: post.createdAt,
          });
        });
      });

      return Array.from(uniqueMedia.values());
    },
    [posts],
  );
  const albumFilterOptions = useMemo(() => {
    const albumMap = new Map<string, string>();
    mediaItems.forEach((media) => {
      if (media.albumId) {
        albumMap.set(media.albumId, media.albumCode || `${t('media.album')} #${media.albumId}`);
      }
    });

    return Array.from(albumMap, ([id, title]) => ({ id, title }));
  }, [mediaItems, t]);
  const filteredMedia = mediaItems.filter((media) => {
    if (activeFilter === 'all') {
      return true;
    }

    if (activeFilter === 'albums') {
      return Boolean(media.albumId);
    }

    if (activeFilter.startsWith('album:')) {
      return media.albumId === activeFilter.slice('album:'.length);
    }

    return media.kind === activeFilter;
  });
  const groupedMedia = useMemo(() => {
    const groups = new Map<string, typeof filteredMedia>();
    filteredMedia.forEach((media) => {
      const dateKey = getDateKey(media.createdAt);
      groups.set(dateKey, [...(groups.get(dateKey) ?? []), media]);
    });

    return Array.from(groups, ([dateKey, items]) => ({
      dateKey,
      title: formatDateHeading(dateKey, t('media.unknownDate')),
      items,
    }));
  }, [filteredMedia, t]);
  const filteredMediaIds = filteredMedia.map((media) => media.id);
  const selectedMedia = mediaItems.filter((media) => selectedMediaIds.includes(media.id));
  const selectedPostMediaIds = getUniqueMediaIds(selectedMedia);
  const selectedVisibleCount = filteredMediaIds.filter((id) => selectedMediaIds.includes(id)).length;
  const hasSelectedMedia = selectedMediaIds.length > 0;
  const hasSelectedPostMedia = selectedPostMediaIds.length > 0;
  const allVisibleSelected = filteredMediaIds.length > 0 && selectedVisibleCount === filteredMediaIds.length;
  const hasPostDetails = postDetails.location.trim().length > 0 && postDetails.caption.trim().length > 0;
  const canUpload = selectedFiles.length > 0 && Boolean(uploaderId) && !isUploading && (!isPublicUpload || hasPostDetails);

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    setSelectedMediaIds((currentIds) => currentIds.filter((id) => mediaItems.some((media) => media.id === id)));
  }, [mediaItems]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setSelectedFiles((currentFiles) => {
      const currentKeys = new Set(currentFiles.map((item) => item.key));
      const nextItems = nextFiles
        .filter((file) => {
          const fileKey = getFileKey(file);
          if (currentKeys.has(fileKey)) {
            return false;
          }

          currentKeys.add(fileKey);
          return true;
        })
        .map(createSelectedUploadFile);
      return [...currentFiles, ...nextItems];
    });
    setUploadProgress(0);
    setUploadPhase('idle');
    setUploadMessage('');
    setUploadError('');
    event.target.value = '';
  };

  const clearSelectedFiles = () => {
    selectedFilesRef.current.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedFiles([]);
    setUploadProgress(0);
    setUploadPhase('idle');
    setUploadMessage('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (fileKey: string) => {
    setSelectedFiles((currentFiles) => {
      const fileToRemove = currentFiles.find((item) => item.key === fileKey);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }

      return currentFiles.filter((item) => item.key !== fileKey);
    });
    setUploadProgress(0);
    setUploadPhase('idle');
    setUploadMessage('');
    setUploadError('');
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

  const createAlbumPost = async (mediaIds: Array<string | number>, details: TripStoryDetails) => {
    if (!mediaIds.length) {
      return;
    }

    const payload = getTripStoryPayload(details);

    await api('/posts', {
      method: 'POST',
      body: {
        user_id: uploaderId,
        ...payload,
        status: 'published',
        media_ids: mediaIds,
      },
    });
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
    selectedFiles.forEach((item) => formData.append('files', item.file));
    formData.append('path', 'media');
    formData.append('is_public', String(isPublicUpload));
    formData.append('uploaded_by', uploaderId);
    if (isPublicUpload) {
      formData.append('location', postDetails.location.trim());
      formData.append('caption', postDetails.caption.trim());
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadPhase('uploading');
    setUploadMessage('');
    setUploadError('');
    uploadWasCanceledRef.current = false;
    uploadAbortControllerRef.current = new AbortController();

    try {
      const payload = await api<UploadResponse>('/upload', {
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
      if (isPublicUpload) {
        await createAlbumPost(getUploadedMediaIds(payload), postDetails);
      }
      setUploadPhase('complete');
      setUploadProgress(100);
      clearSelectedFiles();
      setPostDetails(emptyTripStoryDetails());
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

  const openPostSelectionDialog = () => {
    if (!selectedPostMediaIds.length) {
      return;
    }

    setSelectionDetails(emptyTripStoryDetails());
    setUploadError('');
    setUploadMessage('');
    setIsPostSelectionOpen(true);
  };

  const saveSelectedAsPosts = async () => {
    const location = selectionDetails.location.trim();
    const caption = selectionDetails.caption.trim();
    if (!location || !caption) {
      setUploadError(t('media.postDetailsRequired'));
      return;
    }

    setIsPostingSelection(true);
    setUploadError('');
    setUploadMessage('');

    try {
      await Promise.all(
        selectedPostMediaIds.map((mediaId) =>
          api(`/upload/${encodeURIComponent(mediaId)}/posting-details`, {
            method: 'PATCH',
            body: { location, caption },
          }),
        ),
      );
      await createAlbumPost(selectedPostMediaIds, selectionDetails);
      setIsPostSelectionOpen(false);
      clearMediaSelection();
      setUploadMessage(t('media.postSelectedSuccess').replace('{count}', String(selectedPostMediaIds.length)));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('media.postDetailsUpdateError'));
    } finally {
      setIsPostingSelection(false);
    }
  };

  const renderTripStoryFields = (
    details: TripStoryDetails,
    setDetails: Dispatch<SetStateAction<TripStoryDetails>>,
    disabled: boolean,
  ) => {
    const updateDetails = (key: keyof TripStoryDetails) => (value: string) => {
      setDetails((currentDetails) => ({ ...currentDetails, [key]: value }));
    };

    return (
      <>
        <label className="wide">
          <span><Sparkles size={15} aria-hidden="true" /> {t('media.storyTitleLabel')}</span>
          <input
            value={details.title}
            disabled={disabled}
            placeholder={t('media.storyTitlePlaceholder')}
            onChange={(event) => updateDetails('title')(event.target.value)}
          />
        </label>
        <label>
          <span><MapPin size={15} aria-hidden="true" /> {t('media.locationLabel')}</span>
          <input
            value={details.location}
            disabled={disabled}
            placeholder={t('media.locationPlaceholder')}
            onChange={(event) => updateDetails('location')(event.target.value)}
          />
        </label>
        <label>
          <span><CalendarDays size={15} aria-hidden="true" /> {t('media.travelDateLabel')}</span>
          <input
            type="date"
            value={details.travelDate}
            disabled={disabled}
            onChange={(event) => updateDetails('travelDate')(event.target.value)}
          />
        </label>
        <label>
          <span><Clock3 size={15} aria-hidden="true" /> {t('media.durationLabel')}</span>
          <input
            value={details.duration}
            disabled={disabled}
            placeholder={t('media.durationPlaceholder')}
            onChange={(event) => updateDetails('duration')(event.target.value)}
          />
        </label>
        <label>
          <span><Sparkles size={15} aria-hidden="true" /> {t('media.travelStyleLabel')}</span>
          <input
            value={details.travelStyle}
            disabled={disabled}
            placeholder={t('media.travelStylePlaceholder')}
            onChange={(event) => updateDetails('travelStyle')(event.target.value)}
          />
        </label>
        <label>
          <span><Users size={15} aria-hidden="true" /> {t('media.companionsLabel')}</span>
          <input
            value={details.companions}
            disabled={disabled}
            placeholder={t('media.companionsPlaceholder')}
            onChange={(event) => updateDetails('companions')(event.target.value)}
          />
        </label>
        <label>
          <span><Wallet size={15} aria-hidden="true" /> {t('media.budgetLabel')}</span>
          <input
            value={details.budget}
            disabled={disabled}
            placeholder={t('media.budgetPlaceholder')}
            onChange={(event) => updateDetails('budget')(event.target.value)}
          />
        </label>
        <label className="wide">
          <span><MessageSquareText size={15} aria-hidden="true" /> {t('media.captionLabel')}</span>
          <CaptionEditor
            value={details.caption}
            disabled={disabled}
            placeholder={t('media.captionPlaceholder')}
            rows={3}
            labels={{
              toolbar: t('media.captionToolbar'),
              bold: t('media.captionBold'),
              italic: t('media.captionItalic'),
              strike: t('media.captionStrike'),
              quote: t('media.captionQuote'),
              list: t('media.captionList'),
              orderedList: t('media.captionOrderedList'),
              hashtag: t('media.captionHashtag'),
              clearFormatting: t('media.captionClearFormatting'),
            }}
            onChange={updateDetails('caption')}
          />
        </label>
        <label className="wide">
          <span><Sparkles size={15} aria-hidden="true" /> {t('media.highlightsLabel')}</span>
          <textarea
            value={details.highlights}
            disabled={disabled}
            placeholder={t('media.highlightsPlaceholder')}
            rows={3}
            onChange={(event) => updateDetails('highlights')(event.target.value)}
          />
        </label>
        <label className="wide">
          <span><Lightbulb size={15} aria-hidden="true" /> {t('media.tipsLabel')}</span>
          <textarea
            value={details.tips}
            disabled={disabled}
            placeholder={t('media.tipsPlaceholder')}
            rows={3}
            onChange={(event) => updateDetails('tips')(event.target.value)}
          />
        </label>
      </>
    );
  };

  return (
    <StudioShell active="media">
      {modalContextHolder}
      <Modal
        className="romlek-edit-posting-modal"
        title={t('media.postSelectedTitle').replace('{count}', String(selectedPostMediaIds.length))}
        open={isPostSelectionOpen}
        okText={t('media.postSelected')}
        cancelText={t('media.deleteCancel')}
        confirmLoading={isPostingSelection}
        onOk={() => void saveSelectedAsPosts()}
        onCancel={() => setIsPostSelectionOpen(false)}
      >
        <p className="studio-post-selection-body">{t('media.postSelectedBody')}</p>
        <div className="studio-post-details modal-fields">
          {renderTripStoryFields(selectionDetails, setSelectionDetails, isPostingSelection)}
        </div>
      </Modal>
      <Modal
        className={`romlek-media-preview-modal ${previewMedia?.kind === 'image' ? 'fullscreen' : ''}`}
        title={previewMedia?.alt || t('media.preview')}
        open={Boolean(previewMedia)}
        footer={null}
        width={previewMedia?.kind === 'image' ? '100vw' : 'min(1040px, calc(100vw - 24px))'}
        closable={previewMedia?.kind !== 'image'}
        onCancel={() => setPreviewMedia(null)}
      >
        {previewMedia ? (
          <div className={`studio-preview-content ${previewMedia.kind}`}>
            {previewMedia.kind === 'image' ? (
              <MediaPreviewActions
                url={previewMedia.url}
                filename={previewMedia.alt || t('media.preview')}
                labels={{
                  close: t('media.closePreview'),
                  download: t('media.downloadFile'),
                  open: t('media.openOriginal'),
                }}
                onClose={() => setPreviewMedia(null)}
              />
            ) : null}
            {previewMedia.kind === 'image' ? <img src={previewMedia.url} alt={previewMedia.alt} /> : null}
            {previewMedia.kind === 'video' ? <HlsVideo src={previewMedia.url} hlsSrc={previewMedia.hlsUrl} poster={previewMedia.poster} autoPlay={false} /> : null}
            {previewMedia.kind === 'file' ? (
              <div className="studio-preview-file">
                <a href={previewMedia.url} target="_blank" rel="noopener noreferrer">
                  {getFileName(previewMedia)}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
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
              {selectedFiles.map((item) => (
                <article key={item.key} className={`studio-upload-file-tile ${item.kind}`}>
                  <div className="studio-upload-file-preview">
                    {item.kind === 'image' && item.previewUrl ? <img src={item.previewUrl} alt={item.file.name} /> : null}
                    {item.kind === 'video' && item.previewUrl ? <video src={item.previewUrl} muted playsInline controls /> : null}
                    {item.kind === 'file' ? <span>{item.file.name}</span> : null}
                  </div>
                  <div className="studio-upload-file-meta">
                    <strong>{item.file.name}</strong>
                    <small>{formatFileSize(item.file.size)}</small>
                  </div>
                  <button type="button" disabled={isUploading} aria-label={t('media.deleteMedia')} onClick={() => removeSelectedFile(item.key)}>
                    <X size={13} aria-hidden="true" />
                  </button>
                </article>
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
                {renderTripStoryFields(postDetails, setPostDetails, isUploading)}
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
        {(activeFilter === 'albums' || activeFilter.startsWith('album:')) && albumFilterOptions.length ? (
          <div className="studio-media-subfilters" role="tablist" aria-label={t('media.albums')}>
            {albumFilterOptions.map((album) => {
              const filter = `album:${album.id}` as const;
              return (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter}
                  className={activeFilter === filter ? 'active' : ''}
                  onClick={() => setActiveFilter(filter)}
                >
                  {album.title}
                </button>
              );
            })}
          </div>
        ) : null}

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
                  <button type="button" className="primary" onClick={openPostSelectionDialog} disabled={!hasSelectedPostMedia || deletingMediaId === '__batch__'}>
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
          <section className="studio-media-groups" aria-label={t('media.title')}>
            {groupedMedia.map((group) => (
              <section key={group.dateKey} className="studio-media-date-group" aria-label={group.title}>
                <header className="studio-media-date-header">
                  <h2>{group.title}</h2>
                  <span>{t('media.groupItemCount').replace('{count}', String(group.items.length))}</span>
                </header>
                <div className="studio-media-grid">
                  {group.items.map((media, index) => {
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
                        {media.kind === 'file' ? (
                          <a className="studio-media-preview" href={media.url} target="_blank" rel="noopener noreferrer" aria-label={t('feed.openDocument').replace('{name}', getFileName(media))}>
                            <span className="studio-file-preview">{getFileName(media)}</span>
                          </a>
                        ) : (
                          <button type="button" className="studio-media-preview" onClick={() => setPreviewMedia(media)} aria-label={t('media.previewMedia').replace('{name}', media.alt)}>
                            {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                            {media.kind === 'video' ? <HlsVideo src={media.url} hlsSrc={media.hlsUrl} poster={media.poster} autoPlay={false} /> : null}
                          </button>
                        )}
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
                              <Dropdown
                                classNames={{ root: 'studio-media-action-menu' }}
                                placement="bottomRight"
                                trigger={['click']}
                                menu={{
                                  items: [
                                    {
                                      key: 'delete',
                                      icon: <Trash2 size={16} aria-hidden="true" />,
                                      label: t('media.deleteMedia'),
                                      danger: true,
                                      disabled: deletingMediaId === media.id || deletingMediaId === '__batch__',
                                    },
                                  ],
                                  onClick: ({ key, domEvent }) => {
                                    domEvent.stopPropagation();

                                    if (key === 'delete') {
                                      handleDelete(media);
                                    }
                                  },
                                }}
                              >
                                <button
                                  type="button"
                                  className="studio-media-more-action"
                                  aria-label={t('media.actions')}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <MoreVertical size={17} aria-hidden="true" />
                                </button>
                              </Dropdown>
                            </div>
                          ) : null}
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
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

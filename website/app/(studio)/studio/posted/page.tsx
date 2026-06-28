'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from 'antd';
import { CalendarDays, Clock3, Edit3, Image as ImageIcon, Lightbulb, MapPin, MessageSquareText, Plus, Sparkles, Users, Video, Wallet, X } from 'lucide-react';
import { CaptionEditor } from '@/app/_components/CaptionEditor';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { RichCaption } from '@/app/_components/RichCaption';
import { StudioShell } from '@/app/_components/StudioShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { type TimelineMedia, type TimelinePost, useTimelinePosts } from '@/app/_hooks/useTimelinePosts';

type EditablePost = Pick<TimelinePost, 'id' | 'title' | 'body' | 'location' | 'travelDate' | 'duration' | 'travelStyle' | 'companions' | 'budget' | 'highlights' | 'tips' | 'media'>;
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
type ApiRecord = Record<string, unknown>;
type UploadResponse = {
  files?: Array<{
    media?: {
      id?: string | number;
    };
  }>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
const imageExtensions = new Set(['apng', 'avif', 'gif', 'jpg', 'jpeg', 'png', 'svg', 'webp']);
const videoExtensions = new Set(['avi', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm']);

const getFileName = (media: Pick<TimelineMedia, 'alt' | 'url'>) => {
  const rawName = media.alt || media.url.split('/').pop() || 'Document';

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
};

const isRecord = (value: unknown): value is ApiRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
const firstNumber = (...values: unknown[]) => values.find((value): value is number => typeof value === 'number' && Number.isFinite(value));
const firstBoolean = (...values: unknown[]) => values.find((value): value is boolean => typeof value === 'boolean');

const getApiItems = (payload: unknown): ApiRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.files,
    payload.results,
    isRecord(payload.data) ? payload.data.items : undefined,
    isRecord(payload.data) ? payload.data.files : undefined,
    isRecord(payload.data) ? payload.data.results : undefined,
  ];
  const list = candidates.find(Array.isArray);
  return Array.isArray(list) ? list.filter(isRecord) : [];
};

const resolveMediaUrl = (url: string) => {
  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  const base = new URL(apiBaseUrl);
  if (url.startsWith('/')) {
    const basePath = base.pathname.replace(/\/$/, '');
    const path = basePath && !url.startsWith(`${basePath}/`) ? `${basePath}${url}` : url;
    return `${base.origin}${path}`;
  }

  return new URL(url, `${apiBaseUrl.replace(/\/$/, '')}/`).toString();
};

const getExtensionFromPath = (value: string) => {
  const path = value.split('?')[0] || value;
  const basename = path.split('/').pop() || '';
  return basename.includes('.') ? basename.split('.').pop() || '' : '';
};

const getKeyFromMediaUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url, apiBaseUrl);
    return parsedUrl.searchParams.get('key')?.trim() || '';
  } catch {
    return '';
  }
};

const normalizeLibraryMedia = (media: ApiRecord, index: number): TimelineMedia | null => {
  const rawUrl =
    firstString(media.url, media.src, media.file_url, media.fileUrl, media.href) ||
    firstString(media.render_url, media.renderUrl);
  const key =
    firstString(media.key, media.file_path, media.filePath, media.path) ||
    getKeyFromMediaUrl(rawUrl);
  const resolvedRawUrl = rawUrl || (key ? `/upload/render?key=${encodeURIComponent(key)}` : '');

  if (!resolvedRawUrl) {
    return null;
  }

  const initialUrl = resolveMediaUrl(resolvedRawUrl);
  const filename = firstString(media.original_name, media.originalName, media.file_name, media.fileName, media.name, media.filename);
  const mimeType = firstString(media.mime_type, media.mimeType, media.mimetype, media.contentType, media.type).toLowerCase();
  const extension = firstString(media.extension, getExtensionFromPath(filename), getExtensionFromPath(key), getExtensionFromPath(initialUrl)).toLowerCase();
  const kind: TimelineMedia['kind'] =
    mimeType.startsWith('image/') || imageExtensions.has(extension)
      ? 'image'
      : mimeType.startsWith('video/') || videoExtensions.has(extension)
        ? 'video'
        : 'file';

  return {
    id:
      firstString(media.id, media.media_id, media.mediaId) ||
      String(firstNumber(media.id, media.media_id, media.mediaId) ?? '') ||
      key ||
      `${initialUrl}-${index}`,
    kind,
    url: key ? resolveMediaUrl(`/upload/render?key=${encodeURIComponent(key)}`) : initialUrl,
    hlsUrl: kind === 'video' && key ? resolveMediaUrl(`/upload/hls/playlist?key=${encodeURIComponent(key)}`) : undefined,
    alt: firstString(media.alt, filename, media.caption) || 'Library media',
    albumId: firstString(media.album_id, media.albumId) || undefined,
    albumCode: firstString(media.album_code, media.albumCode) || undefined,
    albumTitle: firstString(media.album_title, media.albumTitle) || undefined,
    caption: firstString(media.caption, media.description, media.body, media.content) || undefined,
    location: firstString(media.location, media.place, media.address) || undefined,
    uploadedBy: firstString(media.uploaded_by, media.uploadedBy, media.uploader_id, media.uploaderId) || undefined,
    isPublic: firstBoolean(media.is_public, media.isPublic),
  };
};

const getUploadedMediaIds = (payload: UploadResponse) => {
  return (payload.files ?? [])
    .map((file) => file.media?.id)
    .filter((id): id is string | number => id !== undefined && id !== null)
    .map(String);
};

const getUniqueIds = (ids: string[]) => Array.from(new Set(ids));

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const getUniqueFiles = (files: File[]) => Array.from(new Map(files.map((file) => [getFileKey(file), file])).values());

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

const getPostDate = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export default function StudioPostedPage() {
  const { api, user } = useAuth();
  const { t } = usePreferences();
  const uploaderId = user?.id !== undefined && user?.id !== null ? String(user.id) : '';
  const [refreshKey, setRefreshKey] = useState(0);
  const posts = useTimelinePosts(refreshKey, {
    uploadedBy: uploaderId || '__missing_user__',
    publicOnly: true,
  }).filter((post) => post.source !== 'upload');
  const [privateLibraryMedia, setPrivateLibraryMedia] = useState<TimelineMedia[]>([]);
  const [editingPost, setEditingPost] = useState<EditablePost | null>(null);
  const [editDetails, setEditDetails] = useState<TripStoryDetails>(() => emptyTripStoryDetails());
  const [mediaIdsToAdd, setMediaIdsToAdd] = useState<string[]>([]);
  const [mediaIdsToRemove, setMediaIdsToRemove] = useState<string[]>([]);
  const [newFilesToAdd, setNewFilesToAdd] = useState<File[]>([]);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');

  const postedStats = useMemo(
    () => ({
      posts: posts.length,
      media: posts.reduce((count, post) => count + post.media.length, 0),
      albums: posts.filter((post) => post.albumId).length,
    }),
    [posts],
  );

  useEffect(() => {
    const fetchLibraryMedia = async () => {
      if (!uploaderId) {
        setPrivateLibraryMedia([]);
        return;
      }

      try {
        const payload = await api<unknown>(`/upload?uploaded_by=${encodeURIComponent(uploaderId)}`);
        setPrivateLibraryMedia(
          getApiItems(payload)
            .map(normalizeLibraryMedia)
            .filter((media): media is TimelineMedia => Boolean(media))
            .filter((media) => media.isPublic !== true),
        );
      } catch {
        setPrivateLibraryMedia([]);
      }
    };

    void fetchLibraryMedia();
  }, [api, refreshKey, uploaderId]);

  const libraryMedia = useMemo(() => {
    const attachedIds = new Set(editingPost?.media.map((media) => media.id) ?? []);
    const pendingAddIds = new Set(mediaIdsToAdd);
    return privateLibraryMedia.filter((media) => !attachedIds.has(media.id) || pendingAddIds.has(media.id));
  }, [editingPost, mediaIdsToAdd, privateLibraryMedia]);

  const openEditor = (post: TimelinePost) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      body: post.body,
      location: post.location,
      travelDate: post.travelDate,
      duration: post.duration,
      travelStyle: post.travelStyle,
      companions: post.companions,
      budget: post.budget,
      highlights: post.highlights,
      tips: post.tips,
      media: post.media,
    });
    setEditDetails({
      title: post.title || '',
      location: post.location || '',
      caption: post.body || '',
      travelDate: post.travelDate?.slice(0, 10) || '',
      duration: post.duration || '',
      travelStyle: post.travelStyle || '',
      companions: post.companions || '',
      budget: post.budget || '',
      highlights: post.highlights || '',
      tips: post.tips || '',
    });
    setMediaIdsToAdd([]);
    setMediaIdsToRemove([]);
    setNewFilesToAdd([]);
    setStatusMessage('');
    setStatusError('');
  };

  const toggleMediaToAdd = (mediaId: string) => {
    setMediaIdsToRemove((currentIds) => currentIds.filter((id) => id !== mediaId));
    setMediaIdsToAdd((currentIds) => (currentIds.includes(mediaId) ? currentIds.filter((id) => id !== mediaId) : getUniqueIds([...currentIds, mediaId])));
  };

  const toggleMediaToRemove = (mediaId: string) => {
    setMediaIdsToAdd((currentIds) => currentIds.filter((id) => id !== mediaId));
    setMediaIdsToRemove((currentIds) => (currentIds.includes(mediaId) ? currentIds.filter((id) => id !== mediaId) : getUniqueIds([...currentIds, mediaId])));
  };

  const addNewFiles = (files: File[]) => {
    if (!files.length) {
      return;
    }

    setNewFilesToAdd((currentFiles) => getUniqueFiles([...currentFiles, ...files]));
  };

  const removeNewFile = (fileKey: string) => {
    setNewFilesToAdd((currentFiles) => currentFiles.filter((file) => getFileKey(file) !== fileKey));
  };

  const savePost = async () => {
    if (!editingPost) {
      return;
    }

    const location = editDetails.location.trim();
    const caption = editDetails.caption.trim();
    if (!location || !caption) {
      setStatusError(t('media.postDetailsRequired'));
      return;
    }

    setIsSavingPost(true);
    setStatusError('');
    setStatusMessage('');

    try {
      let uploadedMediaIds: string[] = [];
      if (newFilesToAdd.length) {
        if (!uploaderId) {
          setStatusError(t('media.uploadRequiresUploader'));
          return;
        }

        const formData = new FormData();
        newFilesToAdd.forEach((file) => formData.append('files', file));
        formData.append('path', 'media');
        formData.append('is_public', 'true');
        formData.append('uploaded_by', uploaderId);
        formData.append('location', location);
        formData.append('caption', caption);

        const uploadPayload = await api<UploadResponse>('/upload', {
          method: 'POST',
          body: formData,
        });
        uploadedMediaIds = getUploadedMediaIds(uploadPayload);
      }

      const attachedIds = new Set(editingPost.media.map((media) => media.id));
      const removeIds = new Set(mediaIdsToRemove);
      const existingMediaIdsToAdd = mediaIdsToAdd.filter((mediaId) => !attachedIds.has(mediaId) && !removeIds.has(mediaId));

      await api(`/posts/${encodeURIComponent(String(editingPost.id))}`, {
        method: 'PATCH',
        body: {
          ...getTripStoryPayload(editDetails),
          status: 'published',
          media_ids_to_add: getUniqueIds([...existingMediaIdsToAdd, ...uploadedMediaIds]),
          media_ids_to_remove: getUniqueIds(mediaIdsToRemove),
        },
      });
      setEditingPost(null);
      setNewFilesToAdd([]);
      setStatusMessage(t('posted.updateSuccess'));
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : t('posted.updateError'));
    } finally {
      setIsSavingPost(false);
    }
  };

  const updateEditDetails = (key: keyof TripStoryDetails) => (value: string) => {
    setEditDetails((currentDetails) => ({ ...currentDetails, [key]: value }));
  };

  const detailItems = (post: TimelinePost) =>
    [
      post.travelDate ? { label: t('media.travelDateLabel'), value: post.travelDate.slice(0, 10) } : null,
      post.duration ? { label: t('media.durationLabel'), value: post.duration } : null,
      post.travelStyle ? { label: t('media.travelStyleLabel'), value: post.travelStyle } : null,
      post.companions ? { label: t('media.companionsLabel'), value: post.companions } : null,
      post.budget ? { label: t('media.budgetLabel'), value: post.budget } : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <StudioShell active="posted">
      <Modal
        className="romlek-edit-posting-modal"
        title={t('posted.editTitle')}
        open={Boolean(editingPost)}
        okText={t('posted.savePost')}
        cancelText={t('media.deleteCancel')}
        confirmLoading={isSavingPost}
        onOk={() => void savePost()}
        onCancel={() => setEditingPost(null)}
      >
        <div className="studio-post-details modal-fields">
          <label className="wide">
            <span><Sparkles size={15} aria-hidden="true" /> {t('media.storyTitleLabel')}</span>
            <input value={editDetails.title} disabled={isSavingPost} placeholder={t('media.storyTitlePlaceholder')} onChange={(event) => updateEditDetails('title')(event.target.value)} />
          </label>
          <label>
            <span><MapPin size={15} aria-hidden="true" /> {t('media.locationLabel')}</span>
            <input value={editDetails.location} disabled={isSavingPost} placeholder={t('media.locationPlaceholder')} onChange={(event) => updateEditDetails('location')(event.target.value)} />
          </label>
          <label>
            <span><CalendarDays size={15} aria-hidden="true" /> {t('media.travelDateLabel')}</span>
            <input type="date" value={editDetails.travelDate} disabled={isSavingPost} onChange={(event) => updateEditDetails('travelDate')(event.target.value)} />
          </label>
          <label>
            <span><Clock3 size={15} aria-hidden="true" /> {t('media.durationLabel')}</span>
            <input value={editDetails.duration} disabled={isSavingPost} placeholder={t('media.durationPlaceholder')} onChange={(event) => updateEditDetails('duration')(event.target.value)} />
          </label>
          <label>
            <span><Sparkles size={15} aria-hidden="true" /> {t('media.travelStyleLabel')}</span>
            <input value={editDetails.travelStyle} disabled={isSavingPost} placeholder={t('media.travelStylePlaceholder')} onChange={(event) => updateEditDetails('travelStyle')(event.target.value)} />
          </label>
          <label>
            <span><Users size={15} aria-hidden="true" /> {t('media.companionsLabel')}</span>
            <input value={editDetails.companions} disabled={isSavingPost} placeholder={t('media.companionsPlaceholder')} onChange={(event) => updateEditDetails('companions')(event.target.value)} />
          </label>
          <label>
            <span><Wallet size={15} aria-hidden="true" /> {t('media.budgetLabel')}</span>
            <input value={editDetails.budget} disabled={isSavingPost} placeholder={t('media.budgetPlaceholder')} onChange={(event) => updateEditDetails('budget')(event.target.value)} />
          </label>
          <label className="wide">
            <span><MessageSquareText size={15} aria-hidden="true" /> {t('media.captionLabel')}</span>
            <CaptionEditor
              value={editDetails.caption}
              disabled={isSavingPost}
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
              onChange={updateEditDetails('caption')}
            />
          </label>
          <label className="wide">
            <span><Sparkles size={15} aria-hidden="true" /> {t('media.highlightsLabel')}</span>
            <textarea value={editDetails.highlights} disabled={isSavingPost} placeholder={t('media.highlightsPlaceholder')} rows={3} onChange={(event) => updateEditDetails('highlights')(event.target.value)} />
          </label>
          <label className="wide">
            <span><Lightbulb size={15} aria-hidden="true" /> {t('media.tipsLabel')}</span>
            <textarea value={editDetails.tips} disabled={isSavingPost} placeholder={t('media.tipsPlaceholder')} rows={3} onChange={(event) => updateEditDetails('tips')(event.target.value)} />
          </label>
          {editingPost ? (
            <div className="studio-post-media-editor">
              <section>
                <span>{t('posted.attachedMedia')}</span>
                <div className="studio-post-media-strip">
                  {editingPost.media.map((media) => {
                    const isRemoving = mediaIdsToRemove.includes(media.id);
                    return (
                      <button
                        key={media.id}
                        type="button"
                        className={isRemoving ? 'removing' : ''}
                        disabled={isSavingPost}
                        onClick={() => toggleMediaToRemove(media.id)}
                      >
                        {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                        {media.kind === 'video' ? <Video size={24} aria-hidden="true" /> : null}
                        {media.kind === 'file' ? <span className="studio-file-preview">{getFileName(media)}</span> : null}
                        <small><X size={12} aria-hidden="true" /> {t('posted.moveToLibrary')}</small>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section>
                <span>{t('posted.addFromLibrary')}</span>
                {libraryMedia.length ? (
                  <div className="studio-post-media-strip">
                    {libraryMedia.map((media) => {
                      const isAdding = mediaIdsToAdd.includes(media.id);
                      return (
                        <button
                          key={media.id}
                          type="button"
                          className={isAdding ? 'adding' : ''}
                          disabled={isSavingPost}
                          onClick={() => toggleMediaToAdd(media.id)}
                        >
                          {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                          {media.kind === 'video' ? <Video size={24} aria-hidden="true" /> : null}
                          {media.kind === 'file' ? <span className="studio-file-preview">{getFileName(media)}</span> : null}
                          <small><Plus size={12} aria-hidden="true" /> {t('posted.addMedia')}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p>{t('posted.noLibraryMedia')}</p>
                )}
              </section>
              <section>
                <span>{t('posted.addNewFiles')}</span>
                <label className="studio-post-file-picker">
                  <input
                    type="file"
                    multiple
                    disabled={isSavingPost}
                    onChange={(event) => {
                      addNewFiles(Array.from(event.target.files ?? []));
                      event.target.value = '';
                    }}
                  />
                  <Plus size={16} aria-hidden="true" />
                  <strong>{t('posted.chooseNewFiles')}</strong>
                  <small>{newFilesToAdd.length ? t('media.filesSelected').replace('{count}', String(newFilesToAdd.length)) : t('media.noFilesSelected')}</small>
                </label>
                {newFilesToAdd.length ? (
                  <div className="studio-post-new-file-list">
                    {newFilesToAdd.map((file) => (
                      <span key={getFileKey(file)}>
                        <span>{file.name}</span>
                        <button type="button" disabled={isSavingPost} aria-label={t('media.deleteMedia')} onClick={() => removeNewFile(getFileKey(file))}>
                          <X size={13} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}
        </div>
      </Modal>

      <section className="studio-posted-page">
        <header className="studio-posted-header">
          <div>
            <h1>{t('posted.title')}</h1>
            <p>{t('posted.subtitle')}</p>
          </div>
          <div className="studio-posted-summary" aria-label={t('posted.summary')}>
            <span>
              <strong>{postedStats.posts}</strong>
              <small>{t('posted.posts')}</small>
            </span>
            <span>
              <strong>{postedStats.media}</strong>
              <small>{t('posted.media')}</small>
            </span>
            <span>
              <strong>{postedStats.albums}</strong>
              <small>{t('posted.albums')}</small>
            </span>
          </div>
        </header>

        {statusMessage ? <p className="studio-upload-status success">{statusMessage}</p> : null}
        {statusError ? <p className="studio-upload-status error">{statusError}</p> : null}

        {posts.length ? (
          <section className="feed-list studio-posted-feed-list" aria-label={t('posted.title')}>
            {posts.map((post) => {
              const referenceDocs = post.media.filter((media) => media.kind !== 'image' && media.kind !== 'video');
              const visualMedia = post.media.filter((media) => media.kind === 'image' || media.kind === 'video');

              return (
              <article key={post.id} className="feed-card studio-posted-card">
                <div className="feed-card-header">
                  <div className="mini-avatar feed-avatar">{post.initials}</div>
                  <div className="feed-author">
                    <div className="feed-author-line">
                      <strong>{post.name}</strong>
                      <span>@{post.username}</span>
                      <span>{getPostDate(post.createdAt) || post.time}</span>
                    </div>
                    <div className="studio-posted-badges">
                      <small className="feed-location"><MapPin size={13} aria-hidden="true" /> {post.location || t('posted.untitledDestination')}</small>
                      <small className="studio-post-status">{t('posted.published')}</small>
                    </div>
                  </div>
                  <Button type="text" shape="circle" className="save-button" aria-label={t('posted.editPost')} icon={<Edit3 size={18} aria-hidden="true" />} onClick={() => openEditor(post)} />
                </div>
                {post.title ? <h2 className="studio-posted-title">{post.title}</h2> : null}
                {referenceDocs.length ? (
                  <div className="feed-reference-docs" aria-label={t('feed.referenceDocs')}>
                    {referenceDocs.map((media) => (
                      <a key={media.id} href={media.url} target="_blank" rel="noopener noreferrer" aria-label={t('feed.openDocument').replace('{name}', getFileName(media))}>
                        <span>{getFileName(media)}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
                <RichCaption value={post.body || ''} fallback={t('posted.emptyCaption')} className="feed-card-body" />
                {detailItems(post).length ? (
                  <dl className="studio-posted-details">
                    {detailItems(post).map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {post.highlights ? (
                  <p className="studio-posted-note"><Sparkles size={15} aria-hidden="true" /> {post.highlights}</p>
                ) : null}
                {post.tips ? (
                  <p className="studio-posted-note"><Lightbulb size={15} aria-hidden="true" /> {post.tips}</p>
                ) : null}
                {visualMedia.length ? (
                  <div className={`feed-album count-${Math.min(visualMedia.length, 5)} ${visualMedia.length > 1 ? 'album' : 'single'}`}>
                    <div className="feed-album-header">
                      <span>{post.albumCode || t('feed.album')}</span>
                      <small>{visualMedia.length} {t('feed.albumItem')}</small>
                    </div>
                    <div className="feed-album-stage">
                      <div className="feed-album-track">
                        {visualMedia.slice(0, 5).map((media) => (
                          <figure key={media.id} className={`feed-media-item ${media.kind}`}>
                            {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                            {media.kind === 'video' ? <HlsVideo src={media.url} hlsSrc={media.hlsUrl} poster={media.poster} autoPlay={false} /> : null}
                          </figure>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="feed-card-actions studio-posted-actions">
                  <Button type="text" onClick={() => openEditor(post)}><Edit3 size={18} aria-hidden="true" /><span>{t('posted.editPost')}</span></Button>
                  <span><ImageIcon size={16} aria-hidden="true" /> {post.media.filter((media) => media.kind === 'image').length}</span>
                  <span><Video size={16} aria-hidden="true" /> {post.media.filter((media) => media.kind === 'video').length}</span>
                </div>
              </article>
              );
            })}
          </section>
        ) : (
          <section className="studio-media-empty">
            <ImageIcon size={34} aria-hidden="true" />
            <h2>{t('posted.emptyTitle')}</h2>
            <p>{t('posted.emptyBody')}</p>
          </section>
        )}
      </section>
    </StudioShell>
  );
}

'use client';

import { useState, type CSSProperties } from 'react';
import { Button, Modal } from 'antd';
import { Bookmark, ChevronLeft, ChevronRight, Grid2X2, Heart, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { AppShell, getInitials } from '@/app/_components/AppShell';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { MediaPreviewActions } from '@/app/_components/MediaPreviewActions';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { useTimelinePosts, type TimelineMedia, type TimelinePost } from '@/app/_hooks/useTimelinePosts';

function FeedAlbum({
  media,
  labels,
  onPreviewImage,
}: {
  media: TimelineMedia[];
  labels: { album: string; item: string; previous: string; next: string; preview: string };
  onPreviewImage: (media: TimelineMedia) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = media.length > 1;
  const activeMedia = media[activeIndex];
  const goToPrevious = () => setActiveIndex((index) => (index === 0 ? media.length - 1 : index - 1));
  const goToNext = () => setActiveIndex((index) => (index === media.length - 1 ? 0 : index + 1));
  const trackStyle = { '--active-slide': activeIndex } as CSSProperties;

  return (
    <div className={`feed-album count-${Math.min(media.length, 5)} ${hasMultiple ? 'album' : 'single'}`}>
      {hasMultiple ? (
        <div className="feed-album-header">
          <span><Grid2X2 size={14} aria-hidden="true" /> {labels.album}</span>
          <small className="feed-album-count desktop">{media.length} {labels.item}</small>
          <small className="feed-album-count mobile">{activeIndex + 1} / {media.length}</small>
        </div>
      ) : null}
      <div className="feed-album-stage">
        <div className="feed-album-track" style={trackStyle}>
          {media.map((item, index) => (
            <figure key={item.id} className={`feed-media-item ${item.kind}`}>
              {item.kind === 'image' ? (
                <button type="button" className="feed-media-preview-button" onClick={() => onPreviewImage(item)} aria-label={labels.preview.replace('{name}', item.alt)}>
                  <img src={item.url} alt={item.alt} loading="lazy" decoding="async" />
                </button>
              ) : null}
              {item.kind === 'video' ? <HlsVideo src={item.url} hlsSrc={item.hlsUrl} poster={item.poster} /> : null}
              {item.kind === 'file' ? (
                <a className="feed-media-file" href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.alt}
                </a>
              ) : null}
            </figure>
          ))}
        </div>
        {hasMultiple ? (
          <>
            <button className="feed-album-nav previous" type="button" onClick={goToPrevious} aria-label={labels.previous}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button className="feed-album-nav next" type="button" onClick={goToNext} aria-label={labels.next}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
      {hasMultiple ? (
        <div className="feed-album-dots" aria-label={`${labels.album}: ${activeMedia?.alt || labels.item}`}>
          {media.map((item, index) => (
            <button
              key={item.id}
              className={index === activeIndex ? 'active' : undefined}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${labels.item} ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [previewMedia, setPreviewMedia] = useState<TimelineMedia | null>(null);
  const apiPosts = useTimelinePosts(0, { publicOnly: true });
  const displayName = user?.name || user?.username || user?.email || 'Welcome';
  const initials = getInitials(displayName);

  const fallbackPosts: TimelinePost[] = [
    { id: 'fallback-1', initials, name: displayName, username: user?.username || 'you', time: 'now', body: t('feed.firstPost'), media: [] },
    { id: 'fallback-2', initials: 'R', name: 'Romlek', username: 'romlek', time: '12m', body: t('feed.secondPost'), media: [] },
  ];
  const posts = apiPosts.length ? apiPosts : fallbackPosts;

  return (
    <AppShell active="feed">
      <Modal
        className="romlek-media-preview-modal fullscreen"
        title={previewMedia?.alt || t('media.preview')}
        open={Boolean(previewMedia)}
        footer={null}
        width="100vw"
        closable={false}
        onCancel={() => setPreviewMedia(null)}
      >
        {previewMedia ? (
          <div className="studio-preview-content image">
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
            <img src={previewMedia.url} alt={previewMedia.alt} />
          </div>
        ) : null}
      </Modal>
      <header className="feed-hero">
        <div className="feed-hero-copy">
          <span className="feed-kicker"><Sparkles size={16} aria-hidden="true" /> {t('feed.kicker')}</span>
          <h1>{t('feed.title')}</h1>
          <p>{t('feed.subtitle')}</p>
        </div>
      </header>

      <section className="feed-list" aria-label={t('feed.title')}>
        {posts.map((post) => (
          <article key={post.id} className="feed-card">
            <div className="feed-card-header">
              <div className="mini-avatar feed-avatar">{post.initials}</div>
              <div className="feed-author">
                <div className="feed-author-line">
                  <strong>{post.name}</strong>
                  <span>@{post.username}</span>
                  <span>{post.time}</span>
                </div>
                {post.location ? <small className="feed-location"><MapPin size={13} aria-hidden="true" /> {post.location}</small> : null}
              </div>
              <Button type="text" shape="circle" className="save-button" aria-label={t('feed.save')}><Bookmark size={18} aria-hidden="true" /></Button>
            </div>
            {post.body ? <p className="feed-card-body">{post.body}</p> : null}
            {post.media.length ? (
              <FeedAlbum
                media={post.media}
                labels={{
                  album: t('feed.album'),
                  item: t('feed.albumItem'),
                  previous: t('feed.previousMedia'),
                  next: t('feed.nextMedia'),
                  preview: t('media.previewMedia'),
                }}
                onPreviewImage={setPreviewMedia}
              />
            ) : null}
            <div className="feed-card-actions">
              <Button type="text" aria-label={t('feed.reply')}><MessageCircle size={18} aria-hidden="true" /><span>{t('feed.reply')}</span></Button>
              <Button type="text" aria-label={t('feed.like')}><Heart size={18} aria-hidden="true" /><span>{t('feed.like')}</span></Button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

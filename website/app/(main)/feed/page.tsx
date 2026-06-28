'use client';

import { Button } from 'antd';
import { Bookmark, Heart, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { AppShell, getInitials } from '@/app/_components/AppShell';
import { HlsVideo } from '@/app/_components/HlsVideo';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import { useTimelinePosts, type TimelinePost } from '@/app/_hooks/useTimelinePosts';

export default function FeedPage() {
  const { user } = useAuth();
  const { t } = usePreferences();
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
              <div className={`feed-media-grid ${post.media.length === 1 ? 'single' : ''}`}>
                {post.media.map((media) => (
                  <figure key={media.id} className={`feed-media-item ${media.kind}`}>
                    {media.kind === 'image' ? <img src={media.url} alt={media.alt} loading="lazy" decoding="async" /> : null}
                    {media.kind === 'video' ? <HlsVideo src={media.url} hlsSrc={media.hlsUrl} poster={media.poster} /> : null}
                    {media.kind === 'file' ? (
                      <a className="feed-media-file" href={media.url} target="_blank" rel="noopener noreferrer">
                        {media.alt}
                      </a>
                    ) : null}
                  </figure>
                ))}
              </div>
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

---
name: romlek-product
description: Product guidance for Romlek, a travel-focused web app for recording trips, tours, destinations, media, and trip histories, then preparing AI-assisted travel stories. Use when designing, implementing, reviewing, or copywriting Romlek features related to trips, tours, destinations, travel media, albums, feeds, studio pages, auth, AI assistance, or product positioning.
---

# Romlek Product

## Purpose

Romlek is a web application for trips, travel, and tours. It helps users record trip histories, collect destination media, organize travel albums, and prepare AI-assisted travel stories.

## Product Model

Keep these domain objects in mind when shaping features:

- **Destination**: A city, landmark, hotel, restaurant, activity, or tour stop with location, notes, and media.
- **Trip**: A sequence of destinations grouped by date, route, tour, city, or travel purpose.
- **Travel media**: Images, videos, PDFs, and files captured during trips or attached after the journey.
- **Trip album**: A grouped set of travel media connected to a trip story. Use generated album codes for labels when available.
- **Trip story**: AI-assisted captions, summaries, highlights, hashtags, thumbnails, or story variants generated from trip and media data.

## Product Principles

- Make trip capture fast on mobile. Favor short forms, progressive details, and media-first workflows.
- Treat trip history as a reusable source of truth, not just a log. AI assistance should draw from destinations, media, and notes.
- Keep AI assistance reviewable. Users should be able to regenerate, edit, compare, and approve content before publishing.
- Separate library media from trip-story-ready media clearly. Uploaded media should not look ready for public feed use until required trip details are complete.
- Use "Travel Feed" for public browsing, "Travel Studio" for authenticated media and trip management, "Trip Story" for publish-ready grouped media, and "Library" for private saved media.
- Avoid visible UI copy centered on store visits, generic social media, creator workspace language, software communities, or developer examples.
- Design for repeat travel work: calm screens, predictable navigation, clear upload progress, and reliable error recovery where relevant.

## Implementation Guidance

When adding or changing features:

1. Identify whether the work belongs to capture, history, content creation, or publishing.
2. Prefer data structures that can connect destinations, trips, media, albums, drafts, and feed stories.
3. Use real backend state for destructive actions, publishing status, upload completion, and AI generation completion.
4. Keep UI copy aligned with the product purpose: trips, tours, destinations, albums, and travel stories.
5. Update English and Khmer locale files together when changing user-facing wording.
6. Keep backend/API names if already established, such as `posts` or `media`, unless the user asks for schema renames; translate user-facing labels instead.

## Useful Feature Directions

Consider these as natural next steps when the user asks for product improvements:

- Destination recording form with location, tour stop, notes, tags, and media.
- Trip timeline grouped by date and route order.
- AI travel-caption generator using selected destinations and media.
- Trip story composer with preview, location, caption, and album details.
- Travel feed status history with draft, ready, shared, and failed states.
- Media library actions connected to trips and albums, including upload, delete, and reuse in trip stories.

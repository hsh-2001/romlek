---
name: romlek-product
description: Product guidance for Romlek, a web app for recording store visits and trip histories, creating AI-assisted content from those visits, and publishing directly to social media. Use when designing, implementing, reviewing, or copywriting Romlek features related to visits, trips, media, AI content generation, publishing, auth, feeds, studio pages, or product positioning.
---

# Romlek Product

## Purpose

Romlek is a web application that lets users record store visits and trip histories, turn those visits into content with AI assistance, and publish that content directly to social media.

## Product Model

Keep these domain objects in mind when shaping features:

- **Visit**: A stop at a store or place, with time, location, notes, media, and optional purchase or experience details.
- **Trip**: A sequence of visits grouped by date, purpose, route, city, or campaign.
- **Media**: Images, videos, and files captured during visits or attached after the trip.
- **Content draft**: AI-assisted text, captions, summaries, hashtags, thumbnails, or post variants generated from visit and trip data.
- **Publisher**: A flow that prepares and sends finalized content to social platforms.

## Product Principles

- Make visit capture fast on mobile. Favor short forms, progressive details, and media-first workflows.
- Treat trip history as a reusable source of truth, not just a log. Content generation should draw from recorded visits, media, and notes.
- Keep AI assistance reviewable. Users should be able to regenerate, edit, compare, and approve content before publishing.
- Separate capture, creation, and publishing states clearly. Avoid making uploaded media or generated text look published before the user confirms it.
- Preserve trust around social publishing. Show destination, account, preview, and confirmation before posting externally.
- Design for repeat field work: dense but calm screens, predictable navigation, clear progress, and reliable offline/error recovery where relevant.

## Implementation Guidance

When adding or changing features:

1. Identify whether the work belongs to capture, history, content creation, or publishing.
2. Prefer data structures that can connect visits, trips, media, drafts, and published posts.
3. Use real backend state for destructive actions, publishing status, upload completion, and AI generation completion.
4. Keep UI copy aligned with the product purpose: visits and trips become social-ready content with AI help.
5. For mobile UI, prioritize recording a visit, adding media, reviewing trip history, and approving generated content.

## Useful Feature Directions

Consider these as natural next steps when the user asks for product improvements:

- Visit recording form with store name, location, rating, notes, tags, and media.
- Trip timeline grouped by date and visit order.
- AI caption generator using selected visits and media.
- Social post composer with platform-specific previews.
- Publishing status history with draft, scheduled, published, and failed states.
- Media library actions connected to visits and trips, including upload, delete, and reuse in drafts.

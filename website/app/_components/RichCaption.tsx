import sanitizeHtml from 'sanitize-html';

type RichCaptionProps = {
  value: string;
  fallback?: string;
  className?: string;
};

const htmlPattern = /<\/?[a-z][\s\S]*>/i;

const plainTextToHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${sanitizeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');

const sanitizeCaption = (value: string) =>
  sanitizeHtml(htmlPattern.test(value) ? value : plainTextToHtml(value), {
    allowedTags: ['p', 'br', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  });

export function RichCaption({ value, fallback, className }: RichCaptionProps) {
  const caption = value.trim() || fallback?.trim() || '';

  if (!caption) {
    return null;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeCaption(caption) }} />;
}

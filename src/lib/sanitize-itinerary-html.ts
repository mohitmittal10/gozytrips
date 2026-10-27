/**
 * sanitize-itinerary-html.ts
 *
 * Universal utility to detect, strip, and convert accidental HTML code stored
 * inside itinerary fields (timeline step details, activity titles, summaries, etc.)
 * into clean, human-readable bulleted text.
 */

/**
 * Checks if a string contains HTML tags.
 */
export function containsHtml(str: any): boolean {
  if (!str || typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Converts an HTML snippet (such as React span trees from renderFormattedText,
 * or raw HTML from contenteditable DOM extraction) into clean bulleted text.
 *
 * Examples:
 *   '<span style="..."><span ...>●</span><span>Morning: Check in</span></span>'
 *   -> '• Morning: Check in'
 */
export function cleanHtmlToBulletText(str: any): string {
  if (str === undefined || str === null || str === '') return '';
  const textStr = String(str);

  if (!containsHtml(textStr)) {
    return textStr;
  }

  // 1. Browser DOM environment: use DOM parser for exact rendering
  if (typeof document !== 'undefined') {
    try {
      const div = document.createElement('div');
      div.innerHTML = textStr;

      // Remove accidental timestamp badges or non-content elements
      div.querySelectorAll('.num, script, style, svg').forEach(el => el.remove());

      const raw = div.innerText || div.textContent || '';
      const lines = raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          const cleaned = l.replace(/^[●•\-\*▸▸\+]\s*/, '').trim();
          return cleaned ? `• ${cleaned}` : '';
        })
        .filter(Boolean);

      if (lines.length > 0) {
        return lines.join('\n');
      }
    } catch {
      // Fallback to regex below
    }
  }

  // 2. Pure regex string sanitization (SSR / Node safe)
  const cleaned = textStr
    // Remove accidental timestamp badges: <span class="num">...</span>
    .replace(/<span\s+class=["']num["'][^>]*>[\s\S]*?<\/span>/gi, '')
    // Remove script and style tags
    .replace(/<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Turn block-level endings and list endings into newlines
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Handle renderFormattedText span trees: </span\s*><span style="display: flex...
    .replace(/<\/span>\s*(?=<span[^>]*style=[^>]*display:\s*flex)/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  const lines = cleaned
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    // Remove standalone bullet characters that were orphaned onto their own lines
    .filter(l => l !== '●' && l !== '•' && l !== '▸' && l !== '-' && l !== '*')
    .map(l => {
      const withoutBullet = l.replace(/^[●•\-\*▸▸\+]\s*/, '').trim();
      return withoutBullet ? `• ${withoutBullet}` : '';
    })
    .filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : '';
}

/**
 * Cleans simple single-line text fields (such as titles, locations, notes)
 * ensuring no HTML tags are saved.
 */
export function cleanSimpleFieldText(str: any): string {
  if (str === undefined || str === null || str === '') return '';
  const textStr = String(str);
  if (!containsHtml(textStr)) return textStr.trim();

  return textStr
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

/**
 * Deeply sanitizes an itinerary object so any HTML in timeline activities,
 * day summaries, inclusions, etc. is cleaned into plain bulleted text.
 */
export function sanitizeItineraryObject<T = any>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const cloned: any = JSON.parse(JSON.stringify(data));

  // Sanitize days & timeline
  if (Array.isArray(cloned.itinerary)) {
    cloned.itinerary.forEach((day: any) => {
      if (!day || typeof day !== 'object') return;

      if (typeof day.areaFocus === 'string' && containsHtml(day.areaFocus)) {
        day.areaFocus = cleanSimpleFieldText(day.areaFocus);
      }
      if (typeof day.location === 'string' && containsHtml(day.location)) {
        day.location = cleanSimpleFieldText(day.location);
      }
      if (typeof day.title === 'string' && containsHtml(day.title)) {
        day.title = cleanSimpleFieldText(day.title);
      }

      if (Array.isArray(day.timeline)) {
        day.timeline.forEach((step: any) => {
          if (!step || typeof step !== 'object') return;
          if (typeof step.details === 'string' && containsHtml(step.details)) {
            step.details = cleanHtmlToBulletText(step.details);
          }
          if (typeof step.activityTitle === 'string' && containsHtml(step.activityTitle)) {
            step.activityTitle = cleanHtmlToBulletText(step.activityTitle);
          }
        });
      }

      if (Array.isArray(day.activities)) {
        day.activities = day.activities.map((act: any) =>
          typeof act === 'string' && containsHtml(act) ? cleanHtmlToBulletText(act) : act
        );
      }
    });
  }

  // Sanitize day summaries
  if (Array.isArray(cloned.daySummaries)) {
    cloned.daySummaries = cloned.daySummaries.map((item: any) =>
      typeof item === 'string' && containsHtml(item) ? cleanHtmlToBulletText(item) : item
    );
  }

  // Sanitize list fields
  const listFields = ['inclusions', 'exclusions', 'termsAndConditions', 'cancellationPolicy', 'paymentMethods'];
  listFields.forEach(field => {
    if (Array.isArray(cloned[field])) {
      cloned[field] = cloned[field].map((item: any) =>
        typeof item === 'string' && containsHtml(item) ? cleanSimpleFieldText(item) : item
      );
    } else if (typeof cloned[field] === 'string' && containsHtml(cloned[field])) {
      cloned[field] = cleanHtmlToBulletText(cloned[field]);
    }
  });

  return cloned;
}

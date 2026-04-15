import jsPDF from 'jspdf';
import type { Event } from '../types';

// Matches CATEGORY_COLORS in EventCard.tsx and EventDetail.tsx
const CATEGORY_COLORS: Record<string, [number, number, number]> = {
  'pop-up':         [101, 205, 182],
  'festival':       [ 91, 184, 212],
  'sports':         [212, 184,  67],
  'educational':    [ 45, 139, 118],
  'wellness':       [123, 184, 164],
  'gaming':         [224, 123,  90],
  'leader meeting': [155, 126, 200],
  'marathon':       [212, 184,  67],
  // local-business categories
  'cafe':           [255, 179, 102],
  'food truck':     [255, 153,  85],
  'fitness':        [123, 184, 164],
  'tech services':  [ 91, 155, 212],
  'bookstore':      [155, 126, 200],
  'grocery':        [107, 185, 107],
  'art':            [212, 139, 139],
  'pet services':   [255, 200, 100],
  'finance':        [ 91, 140, 170],
};
const DEFAULT_COLOR: [number, number, number] = [143, 168, 180];

function getCategoryColor(category: string): [number, number, number] {
  return CATEGORY_COLORS[category.toLowerCase()] ?? DEFAULT_COLOR;
}

function fmt24(t: string, tEnd?: string): string {
  if (!t) return '';
  const pad = (s: string) => { const [h, m] = s.split(':'); return `${h.padStart(2, '0')}:${m}`; };
  return tEnd ? `${pad(t)} – ${pad(tEnd)}` : pad(t);
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function priceLabel(event: Event): string {
  if (event.experience_type === 'local-business') return '';
  if (event.is_free) return 'FREE';
  const min = event.min_price ?? '?';
  const max = event.max_price;
  if (max && max !== event.min_price) return `$${min} – $${max}`;
  return `$${min}`;
}

// Lighten an RGB color by mixing with white at `amount` (0–1)
function lighten([r, g, b]: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  ];
}

/**
 * Export a list of experiences (events / local businesses) to a PDF file.
 * Reusable: pass any array of Event objects and an optional filename.
 */
export function exportExperiencesToPDF(experiences: Event[], filename = 'nyc-explorer.pdf'): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW   = doc.internal.pageSize.getWidth();
  const pageH   = doc.internal.pageSize.getHeight();
  const margin  = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 20) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COVER HEADER
  // ══════════════════════════════════════════════════════════════════════════
  doc.setFillColor(173, 43, 11);
  doc.rect(0, 0, pageW, 80, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('NYC Explorer', margin, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const subtitle = `${experiences.length} experience${experiences.length === 1 ? '' : 's'} · Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  doc.text(subtitle, margin, 66);

  y = 100;

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE CARDS
  // ══════════════════════════════════════════════════════════════════════════
  experiences.forEach(event => {
    const isBusiness  = event.experience_type === 'local-business';
    const cardHeight  = 190;
    checkPage(cardHeight);

    const catColor  = getCategoryColor(event.category);
    const lightBg   = lighten(catColor, 0.82);  // very light tint for card body
    const headerBg  = lighten(catColor, 0.3);   // medium shade for header strip

    const cardX = margin;
    const cardY = y;
    const cardW = contentW;
    const headerH = 38;

    // Card body
    doc.setFillColor(...lightBg);
    doc.roundedRect(cardX, cardY, cardW, cardHeight, 6, 6, 'F');

    // Colored header strip
    doc.setFillColor(...headerBg);
    doc.roundedRect(cardX, cardY, cardW, headerH, 6, 6, 'F');
    // Cover bottom corners of header (rounded only on top)
    doc.setFillColor(...headerBg);
    doc.rect(cardX, cardY + headerH - 6, cardW, 6, 'F');

    // Category + type label in header
    const badge = isBusiness ? 'LOCAL BUSINESS' : 'EVENT';
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${badge}  ·  ${event.category.toUpperCase()}`, cardX + 14, cardY + 14);

    // Event name in header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const nameLines = doc.splitTextToSize(event.name, cardW - 28) as string[];
    nameLines.slice(0, 1).forEach((line: string) => {
      doc.text(line, cardX + 14, cardY + 30);
    });

    // Body content
    const tx = cardX + 14;
    let cy = cardY + headerH + 14;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    // Date / time OR hours
    if (!isBusiness && event.date) {
      doc.text(`${formatDate(event.date)}  ·  ${fmt24(event.time, event.time_end)}`, tx, cy);
      cy += 13;
    }
    if (isBusiness && event.operating_hours) {
      doc.text(`Hours: ${event.operating_hours}`, tx, cy);
      cy += 13;
    }

    // Location
    if (event.location) {
      doc.text(`Location: ${event.location}`, tx, cy);
      cy += 13;
    }

    // Hosted by
    if (event.company_hosted) {
      doc.text(`Hosted by: ${event.company_hosted}`, tx, cy);
      cy += 13;
    }

    // Price
    const price = priceLabel(event);
    if (price) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...catColor);
      doc.text(price, tx, cy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      cy += 13;
    }

    // Description (max 2 lines)
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(event.description, cardW - 28) as string[];
    descLines.slice(0, 2).forEach((line: string) => { doc.text(line, tx, cy); cy += 12; });

    // Learn More link
    if (event.link) {
      cy += 3;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...catColor);
      doc.textWithLink('Learn More ↗', tx, cy, { url: event.link });
      doc.setFont('helvetica', 'normal');
    }

    y += cardHeight + 10;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY PAGE
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = margin;

  doc.setFillColor(173, 43, 11);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, 38);

  y = 80;

  const categoryCounts: Record<string, number> = {};
  experiences.forEach(e => {
    const key = e.category || 'other';
    categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Experiences by Category', margin, y);
  y += 22;

  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const barMaxW = contentW - 90;

  sortedCats.forEach(([cat, count]) => {
    checkPage(28);
    const barW   = Math.max(8, (count / experiences.length) * barMaxW);
    const color  = getCategoryColor(cat);

    // Colored bar per category
    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 11, barW, 14, 3, 3, 'F');

    // Count label inside bar if wide enough, else after
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    if (barW > 30) {
      doc.setTextColor(255, 255, 255);
      doc.text(String(count), margin + 6, y);
    } else {
      doc.setTextColor(...color);
      doc.text(String(count), margin + barW + 4, y);
    }

    // Category name after bar
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(cat, margin + barW + (barW > 30 ? 6 : 18), y);

    y += 24;
  });

  y += 12;

  const eventCount    = experiences.filter(e => e.experience_type !== 'local-business').length;
  const businessCount = experiences.filter(e => e.experience_type === 'local-business').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(`Total events: ${eventCount}`, margin, y);       y += 16;
  doc.text(`Total local businesses: ${businessCount}`, margin, y); y += 16;
  doc.text(`Total experiences: ${experiences.length}`, margin, y);

  doc.save(filename);
}

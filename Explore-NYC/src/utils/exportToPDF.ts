import jsPDF from 'jspdf';
import type { Event } from '../types';

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

/**
 * Export a list of experiences (events / local businesses) to a PDF file.
 * Reusable: pass any array of Event objects and an optional filename.
 */
export function exportExperiencesToPDF(experiences: Event[], filename = 'nyc-explorer.pdf'): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helper: check page break ────────────────────────────────────────────
  function checkPage(needed = 20) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ── Helper: wrapped text, returns new y ─────────────────────────────────
  function wrappedText(text: string, x: number, maxWidth: number, lineHeight: number): number {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    lines.forEach((line: string) => {
      checkPage(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COVER HEADER
  // ══════════════════════════════════════════════════════════════════════════
  // Red banner
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
  experiences.forEach((event, index) => {
    const isBusiness = event.experience_type === 'local-business';
    const cardHeight = isBusiness ? 160 : 185;
    checkPage(cardHeight);

    const cardX = margin;
    const cardY = y;
    const cardW = contentW;

    // Card background (alternating slight tint)
    doc.setFillColor(index % 2 === 0 ? 250 : 245, 245, 250);
    doc.roundedRect(cardX, cardY, cardW, cardHeight, 6, 6, 'F');

    // Category strip on left
    doc.setFillColor(173, 43, 11);
    doc.roundedRect(cardX, cardY, 6, cardHeight, 3, 3, 'F');

    const tx = cardX + 16;
    let cy = cardY + 18;

    // Type badge
    const badge = isBusiness ? 'LOCAL BUSINESS' : 'EVENT';
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(173, 43, 11);
    doc.text(badge, tx, cy);

    // Category
    const catX = tx + doc.getTextWidth(badge) + 8;
    doc.setTextColor(130, 130, 130);
    doc.text(event.category.toUpperCase(), catX, cy);
    cy += 14;

    // Name
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    const nameLines = doc.splitTextToSize(event.name, cardW - 24) as string[];
    nameLines.forEach((line: string) => { doc.text(line, tx, cy); cy += 15; });
    cy += 2;

    // Date / time OR operating hours
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
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
      doc.setTextColor(173, 43, 11);
      doc.text(price, tx, cy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      cy += 13;
    }

    // Description (capped at 2 lines)
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(event.description, cardW - 24) as string[];
    descLines.slice(0, 2).forEach((line: string) => { doc.text(line, tx, cy); cy += 12; });

    // Learn More link
    if (event.link) {
      cy += 2;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(240, 66, 81);
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

  // Red banner
  doc.setFillColor(173, 43, 11);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, 38);

  y = 80;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  experiences.forEach(e => {
    const key = e.category || 'other';
    categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Experiences by Category', margin, y);
  y += 20;

  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const barMaxW = contentW - 80;

  sortedCats.forEach(([cat, count]) => {
    checkPage(24);
    const barW = Math.max(4, (count / experiences.length) * barMaxW);

    // Bar
    doc.setFillColor(240, 66, 81);
    doc.roundedRect(margin, y - 10, barW, 12, 2, 2, 'F');

    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(`${cat}  ·  ${count}`, margin + barW + 6, y);

    y += 22;
  });

  y += 10;

  // Totals
  const eventCount    = experiences.filter(e => e.experience_type !== 'local-business').length;
  const businessCount = experiences.filter(e => e.experience_type === 'local-business').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(`Total events: ${eventCount}`, margin, y);
  y += 16;
  doc.text(`Total local businesses: ${businessCount}`, margin, y);
  y += 16;
  doc.text(`Total experiences: ${experiences.length}`, margin, y);

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(filename);
}

import jsPDF from 'jspdf';
import type { EducationOrg } from '../data/educationProfiles';

const TODAY = new Date().toISOString().split('T')[0];

function isOpen(dueDate?: string): boolean {
  if (!dueDate) return true;
  const evergreen = ['rolling', 'ongoing', 'seasonal', 'varies'];
  return evergreen.includes(dueDate.toLowerCase()) || dueDate >= TODAY;
}

function formatDueDate(d: string): string {
  const evergreen = ['rolling', 'ongoing', 'seasonal', 'varies'];
  if (evergreen.includes(d.toLowerCase())) return d.charAt(0).toUpperCase() + d.slice(1);
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

const FOCUS_COLORS_PDF: Record<string, [number, number, number]> = {
  'Technology':               [ 96, 165, 250],
  'STEAM':                    [ 74, 222, 128],
  'Healthcare':               [244, 114, 182],
  'Law':                      [129, 140, 248],
  'Sciences':                 [ 52, 211, 153],
  'Teaching':                 [250, 204,  21],
  'Media':                    [251, 191,  36],
  'Entertainment':            [248, 113, 113],
  'Professional Development': [156, 163, 175],
  'Robotic':                  [ 34, 211, 238],
  'Job Platform':             [167, 139, 250],
  'Students & Early Careers': [251, 191,  36],
};
const DEFAULT_COLOR: [number, number, number] = [74, 158, 224];

function lighten([r, g, b]: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  ];
}

export function exportEducationToPDF(
  orgs: EducationOrg[],
  sectionLabel = 'High Education',
  filename = 'nyc-education.pdf',
): void {
  const doc      = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW    = doc.internal.pageSize.getWidth();
  const pageH    = doc.internal.pageSize.getHeight();
  const margin   = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPage(needed = 20) {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  }

  // ── Header ─────────────────────────────────────────────────────────────
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, pageW, 80, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`NYC Explorer · ${sectionLabel}`, margin, 44);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${orgs.length} result${orgs.length === 1 ? '' : 's'} · Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin, 62,
  );

  y = 100;

  // ── Org cards ──────────────────────────────────────────────────────────
  orgs.forEach(org => {
    const cardH = 175;
    checkPage(cardH);

    const color    = FOCUS_COLORS_PDF[org.focusArea] ?? DEFAULT_COLOR;
    const lightBg  = lighten(color, 0.88);
    const headerBg = lighten(color, 0.3);

    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y, contentW, cardH, 6, 6, 'F');

    doc.setFillColor(...headerBg);
    doc.roundedRect(margin, y, contentW, 36, 6, 6, 'F');
    doc.setFillColor(...headerBg);
    doc.rect(margin, y + 30, contentW, 6, 'F');

    const tx = margin + 14;
    let cy = y + 13;

    // Type badge + focus area
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const typeLabel = org.type === 'event' ? 'PROFESSIONAL EVENT' : 'JOB / INTERNSHIP';
    doc.text(`${typeLabel}  ·  ${org.focusArea.toUpperCase()}`, tx, cy);
    cy += 14;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const nameLines = doc.splitTextToSize(org.name, contentW - 28) as string[];
    nameLines.slice(0, 1).forEach((l: string) => { doc.text(l, tx, cy); cy += 14; });

    cy = y + 50;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Program / Role: ${org.otherCategory}`, tx, cy);
    cy += 13;

    doc.text(`Who can apply: ${org.requirement}`, tx, cy);
    cy += 13;

    doc.text(`Services: ${org.services.join(' · ')}`, tx, cy);
    cy += 13;

    const open = isOpen(org.dueDate);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(open ? 22 : 220, open ? 163 : 38, open ? 74 : 38);
    const statusText = open
      ? `Open${org.dueDate ? `  ·  ${formatDueDate(org.dueDate)}` : ''}`
      : `Closed${org.dueDate ? `  ·  Ended: ${formatDueDate(org.dueDate)}` : ''}`;
    doc.text(statusText, tx, cy);
    cy += 13;

    if (org.registrationLink && open) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 158, 224);
      const linkLabel = org.type === 'job' ? 'Apply Now ↗' : 'Register Now ↗';
      doc.textWithLink(linkLabel, tx, cy, { url: org.registrationLink });
    } else if (org.registrationLink) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(org.registrationLink, tx, cy);
    }

    y += cardH + 10;
  });

  // ── Summary page ───────────────────────────────────────────────────────
  doc.addPage();
  y = margin;

  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, 38);
  y = 80;

  const eventCount = orgs.filter(o => o.type === 'event').length;
  const jobCount   = orgs.filter(o => o.type === 'job').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(`Professional Events: ${eventCount}`, margin, y);     y += 16;
  doc.text(`Jobs & Internships: ${jobCount}`, margin, y);        y += 24;

  const focusCounts: Record<string, number> = {};
  orgs.forEach(o => { focusCounts[o.focusArea] = (focusCounts[o.focusArea] ?? 0) + 1; });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Results by Focus Area', margin, y);
  y += 20;

  const barMaxW = contentW - 90;
  Object.entries(focusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([area, count]) => {
      checkPage(26);
      const barW  = Math.max(8, (count / orgs.length) * barMaxW);
      const color = FOCUS_COLORS_PDF[area] ?? DEFAULT_COLOR;

      doc.setFillColor(...color);
      doc.roundedRect(margin, y - 11, barW, 14, 3, 3, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      if (barW > 30) {
        doc.setTextColor(255, 255, 255);
        doc.text(String(count), margin + 6, y);
      } else {
        doc.setTextColor(...color);
        doc.text(String(count), margin + barW + 4, y);
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(area, margin + barW + (barW > 30 ? 6 : 18), y);
      y += 22;
    });

  doc.save(filename);
}

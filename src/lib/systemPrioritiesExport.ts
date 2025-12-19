import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SYSTEM_FEATURES, SystemFeatureCategory } from '@/data/systemFeatures';
import { FeaturePriority } from '@/hooks/useSystemFeaturePriorities';

interface PriorityData {
  category: string;
  feature_key: string;
  priority: FeaturePriority;
  notes: string | null;
}

const priorityLabels: Record<string, string> = {
  green: '🟢 Kritisch',
  yellow: '🟡 Wichtig',
  red: '🔴 Unwichtig',
};

const priorityColors: Record<string, [number, number, number]> = {
  green: [34, 197, 94],
  yellow: [234, 179, 8],
  red: [239, 68, 68],
};

export const exportPrioritiesToPdf = (
  priorities: PriorityData[],
  organizationName: string = 'Organisation'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.text('System-Funktionen Prioritäten', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(organizationName, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Exportiert am: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 35, {
    align: 'center',
  });

  // Summary
  const greenCount = priorities.filter((p) => p.priority === 'green').length;
  const yellowCount = priorities.filter((p) => p.priority === 'yellow').length;
  const redCount = priorities.filter((p) => p.priority === 'red').length;
  const unratedCount =
    SYSTEM_FEATURES.reduce((acc, cat) => acc + cat.features.length, 0) - priorities.length;

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(
    `Zusammenfassung: ${greenCount} Kritisch | ${yellowCount} Wichtig | ${redCount} Unwichtig | ${unratedCount} Nicht bewertet`,
    pageWidth / 2,
    45,
    { align: 'center' }
  );

  let yPos = 55;

  // Categories
  SYSTEM_FEATURES.forEach((category: SystemFeatureCategory) => {
    const categoryPriorities = priorities.filter((p) => p.category === category.key);

    // Category header
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(category.labelDe, 14, yPos);
    yPos += 8;

    // Features table
    const tableData = category.features.map((feature) => {
      const priorityData = categoryPriorities.find((p) => p.feature_key === feature.key);
      const priority = priorityData?.priority;
      const notes = priorityData?.notes || '';

      return [feature.labelDe, priority ? priorityLabels[priority] : '⚪ Nicht bewertet', notes];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Funktion', 'Priorität', 'Notizen']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 70 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const cellText = data.cell.text[0] || '';
          if (cellText.includes('Kritisch')) {
            data.cell.styles.textColor = priorityColors.green;
          } else if (cellText.includes('Wichtig')) {
            data.cell.styles.textColor = priorityColors.yellow;
          } else if (cellText.includes('Unwichtig')) {
            data.cell.styles.textColor = priorityColors.red;
          }
        }
      },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  });

  doc.save(`system-prioritaeten-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportPrioritiesToJson = (
  priorities: PriorityData[],
  organizationName: string = 'Organisation'
) => {
  const exportData = {
    organization: organizationName,
    exportedAt: new Date().toISOString(),
    summary: {
      critical: priorities.filter((p) => p.priority === 'green').length,
      important: priorities.filter((p) => p.priority === 'yellow').length,
      unimportant: priorities.filter((p) => p.priority === 'red').length,
      unrated:
        SYSTEM_FEATURES.reduce((acc, cat) => acc + cat.features.length, 0) - priorities.length,
    },
    categories: SYSTEM_FEATURES.map((category) => ({
      key: category.key,
      label: category.labelDe,
      features: category.features.map((feature) => {
        const priorityData = priorities.find(
          (p) => p.category === category.key && p.feature_key === feature.key
        );
        return {
          key: feature.key,
          label: feature.labelDe,
          priority: priorityData?.priority || null,
          notes: priorityData?.notes || null,
        };
      }),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system-prioritaeten-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

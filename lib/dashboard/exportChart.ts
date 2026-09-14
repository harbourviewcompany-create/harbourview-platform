'use client';

/**
 * Exports the currently visible chart as PNG or PDF.
 * Uses html-to-image under the hood for high-quality capture.
 */
export async function exportChart(
  chartId: string,
  format: 'png' | 'pdf' = 'png',
  filename?: string
) {
  try {
    const { toPng } = await import('html-to-image');

    const element = document.getElementById(chartId);
    if (!element) {
      console.error(`Chart element with id "${chartId}" not found`);
      return;
    }

    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = filename || `harbourview-chart-${chartId}-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export chart:', error);
  }
}

/**
 * Optional PDF export using jsPDF.
 */
export async function exportChartAsPDF(chartId: string, filename?: string) {
  try {
    const { toPng } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById(chartId);
    if (!element) return;

    const dataUrl = await toPng(element, { pixelRatio: 2 });
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [element.offsetWidth, element.offsetHeight],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
    pdf.save(filename || `harbourview-chart-${chartId}.pdf`);
  } catch (error) {
    console.error('Failed to export chart as PDF:', error);
  }
}

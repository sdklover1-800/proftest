import { useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const usePdfExport = (contentRef: RefObject<HTMLDivElement>) => {
    const { t } = useTranslation();
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);

    /**
     * Generate and download PDF using html2canvas and jspdf.
     */
    const downloadPDF = async (prefix: string = 'Profile') => {
        if (!contentRef.current) return;

        setIsPdfGenerating(true);

        try {
            // Wait for charts to settle
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = contentRef.current;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f9fafb',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = 210;
            const pdfHeight = 297;

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 20) / imgHeight);
            const scaledWidth = imgWidth * ratio;
            const scaledHeight = imgHeight * ratio;

            const pdf = new jsPDF({
                orientation: scaledHeight > scaledWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const xOffset = (pdfWidth - scaledWidth) / 2;
            const yOffset = 10;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight);

            const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
            const filename = `${prefix}_${dateStr}.pdf`;

            pdf.save(filename);

        } catch (err) {
            console.error('Error generating PDF:', err);
            alert(t('results.error_generating_pdf', 'Error creating PDF. Please try again.'));
        } finally {
            setIsPdfGenerating(false);
        }
    };

    return {
        isPdfGenerating,
        downloadPDF
    };
};

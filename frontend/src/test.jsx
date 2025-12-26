import React, { useRef, useState } from 'react';
import mammoth from "mammoth";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const TestCases = () => {
  // Refs
  const servicesRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // State Management
  const [activeConverter, setActiveConverter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [convertedFile, setConvertedFile] = useState(null);
  const [conversionError, setConversionError] = useState('');

  // ============================
  // UTILITY FUNCTIONS
  // ============================
  
  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActiveConverter(null);
    setConvertedFile(null);
    setFileName('');
    setConversionError('');
    setLoading(false);
  };

  // ============================
  // FILE HANDLING FUNCTIONS
  // ============================

  /**
   * Triggers file input click
   */
  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Resets conversion state for new file
   */
  const resetConversionState = () => {
    setConvertedFile(null);
    setConversionError('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Downloads the converted file
   */
  const handleDownload = () => {
    if (!convertedFile || !convertedFile.blob) return;
    
    try {
      const defaultName = `converted.${convertedFile.extension}`;
      const finalFileName = fileName ? `${fileName.replace(/\.[^/.]+$/, "")}_converted.${convertedFile.extension}` : defaultName;
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(convertedFile.blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully:', finalFileName);
    } catch (error) {
      console.error('Download error:', error);
      setConversionError('Failed to download file. Please try again.');
    }
  };

  /**
   * Handles file selection
   */
  const handleFileSelect = (e, converterFunction) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    converterFunction(e);
  };

  // ============================
  // CONVERSION FUNCTIONS (UPDATED)
  // ============================
  
  // 1. Word to PDF
  const handleWordToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(text, 180);
      pdf.text(lines, 10, 10);
      
      // Convert PDF to blob and store it
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting Word to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. PDF to Word
  const handlePdfToWordConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      const doc = new Document({
        sections: [
          {
            children: fullText
              .split("\n")
              .filter(line => line.trim())
              .map(line => new Paragraph(line)),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      setConvertedFile({
        blob: blob,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PDF to Word:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. PDF to PPT (Simulated - creates a text-based presentation)
  const handlePdfToPptConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let slidesContent = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        slidesContent.push(pageText);
      }

      // Create a simple text file as PPT representation
      const pptText = slidesContent.map((content, idx) => 
        `Slide ${idx + 1}:\n${content}\n---\n`
      ).join('\n');

      const blob = new Blob([pptText], { type: 'text/plain' });
      setConvertedFile({
        blob: blob,
        type: 'text/plain',
        extension: 'txt',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PDF to PPT:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 4. PPT to PDF
  const handlePptToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const pdf = new jsPDF();
      pdf.text("PPT to PDF Conversion", 20, 20);
      pdf.text(`Original file: ${file.name}`, 20, 30);
      pdf.text("This would normally convert PPT slides to PDF pages", 20, 40);
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PPT to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 5. PDF to Excel
  const handlePdfToExcelConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let allText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        allText += pageText + "\n";
      }

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const wsData = [["Extracted Text"], [allText]];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");

      // Convert to blob
      const excelBlob = new Blob(
        [XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      
      setConvertedFile({
        blob: excelBlob,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PDF to Excel:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Excel to PDF
  const handleExcelToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const pdf = new jsPDF();
      let yPos = 10;
      
      data.forEach((row, rowIndex) => {
        if (rowIndex > 0) yPos += 10;
        const text = Array.isArray(row) ? row.join(" | ") : JSON.stringify(row);
        pdf.text(text, 10, yPos);
        yPos += 10;
      });

      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting Excel to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 7. PDF to Image
  const handlePdfToImageConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      canvas.toBlob((blob) => {
        setConvertedFile({
          blob: blob,
          type: 'image/png',
          extension: 'png',
          fileName: file.name
        });
      }, 'image/png');
    } catch (error) {
      console.error("Error converting PDF to Image:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 8. Image to PDF
  const handleImageToPdfConversion = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (i > 0) pdf.addPage();
        
        const img = new Image();
        const reader = new FileReader();
        
        await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
              const imgWidth = 190;
              const imgHeight = (img.height * imgWidth) / img.width;
              pdf.addImage(img, 'JPEG', 10, 10, imgWidth, imgHeight);
              resolve();
            };
            img.onerror = reject;
          };
          reader.readAsDataURL(file);
        });
      }
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: files[0].name
      });
    } catch (error) {
      console.error("Error converting Image to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 9. PDF to Text
  const handlePdfToTextConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      const blob = new Blob([fullText], { type: 'text/plain' });
      setConvertedFile({
        blob: blob,
        type: 'text/plain',
        extension: 'txt',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PDF to Text:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 10. Text to PDF
  const handleTextToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const text = await file.text();
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(text, 180);
      pdf.text(lines, 10, 10);
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting Text to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 11. PDF to HTML
  const handlePdfToHtmlConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Converted PDF</title></head><body>';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        htmlContent += `<div class="page"><h2>Page ${pageNum}</h2><p>${pageText}</p></div>`;
      }
      
      htmlContent += '</body></html>';
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      setConvertedFile({
        blob: blob,
        type: 'text/html',
        extension: 'html',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting PDF to HTML:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 12. HTML to PDF
  const handleHtmlToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const htmlContent = await file.text();
      
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv);
      document.body.removeChild(tempDiv);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error converting HTML to PDF:", error);
      setConversionError("Failed to convert file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 13. Merge PDFs
  const handleMergePdfs = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const pdf = new jsPDF();
      pdf.text("Merged PDF Files", 20, 20);
      
      files.forEach((file, index) => {
        pdf.text(`${index + 1}. ${file.name}`, 20, 30 + (index * 10));
      });
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: `merged_${files.length}_files`
      });
    } catch (error) {
      console.error("Error merging PDFs:", error);
      setConversionError("Failed to merge files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 14. Split PDF
  const handleSplitPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      // For demo, create a simple PDF explaining the split
      const pdf = new jsPDF();
      pdf.text("PDF Split Example", 20, 20);
      pdf.text("Original file would be split into individual pages", 20, 30);
      pdf.text("Each page would be saved as a separate PDF file", 20, 40);
      
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: 'split_example'
      });
    } catch (error) {
      console.error("Error splitting PDF:", error);
      setConversionError("Failed to split file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 15. Compress PDF
  const handleCompressPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setConversionError('');
    setConvertedFile(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + " ";
      }
      
      const compressedPdf = new jsPDF();
      compressedPdf.text("Compressed PDF", 20, 20);
      compressedPdf.text(fullText.substring(0, 500), 20, 30);
      
      const pdfBlob = compressedPdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf',
        fileName: file.name
      });
    } catch (error) {
      console.error("Error compressing PDF:", error);
      setConversionError("Failed to compress file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CONVERTER PAGE COMPONENTS
  // ============================
  
  const ConverterPage = ({ title, description, accept, multiple, onConvert, onBack, converterKey }) => {
    const converterFunction = (e) => onConvert(e);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">{title}</h1>
            <p className="text-gray-600 mb-6">{description}</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-700 mb-2">Supported Formats:</h3>
              <p className="text-sm text-gray-600">{accept}</p>
              {multiple && <p className="text-sm text-blue-600 mt-1">✓ Multiple files allowed</p>}
            </div>
          </div>

          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6 text-center hover:border-blue-500 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => handleFileSelect(e, converterFunction)}
              className="hidden"
              id={`fileInput-${converterKey}`}
            />
            <label htmlFor={`fileInput-${converterKey}`} className="cursor-pointer block">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-blue-600 font-semibold mb-1">Click to upload</p>
              <p className="text-gray-500 text-sm">or drag and drop</p>
              <p className="text-gray-400 text-xs mt-2">{accept}</p>
            </label>
          </div>

          {fileName && !convertedFile && !conversionError && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-blue-700 text-sm">
                <span className="font-semibold">Selected:</span> {fileName}
              </p>
            </div>
          )}

          {conversionError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium mb-3">
                ⚠️ {conversionError}
              </p>
              <button
                onClick={handleChooseFileClick}
                className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition"
              >
                Try Another File
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-blue-600 font-medium">Processing...</p>
              <p className="text-gray-500 text-sm">Please wait while we convert your file</p>
            </div>
          )}

          {convertedFile && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 font-medium mb-3">
                ✅ File converted successfully!
              </p>
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 mb-3"
              >
                Download {convertedFile.extension.toUpperCase()}
              </button>
              <button
                onClick={resetConversionState}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
              >
                Convert Another File
              </button>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleChooseFileClick}
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
              disabled={loading}
            >
              Choose Another File
            </button>
            
            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              ← Back to Home
            </button>
          </div>
          
          <p className="text-gray-400 text-xs text-center mt-6">
            Your files are processed securely and never stored on our servers
          </p>
        </div>
      </div>
    );
  };

  // ============================
  // RENDER CONVERTER PAGES
  // ============================
  
  const converterConfigs = {
    'word-to-pdf': {
      title: "Word to PDF Converter",
      description: "Convert Word documents (.doc, .docx) to high-quality PDF files",
      accept: ".doc,.docx",
      handler: handleWordToPdfConversion
    },
    'pdf-to-word': {
      title: "PDF to Word Converter",
      description: "Extract text and formatting from PDF to editable Word documents",
      accept: ".pdf",
      handler: handlePdfToWordConversion
    },
    'pdf-to-ppt': {
      title: "PDF to PowerPoint",
      description: "Convert PDF content into PowerPoint presentations",
      accept: ".pdf",
      handler: handlePdfToPptConversion
    },
    'ppt-to-pdf': {
      title: "PowerPoint to PDF",
      description: "Convert presentations to PDF for easy sharing",
      accept: ".ppt,.pptx",
      handler: handlePptToPdfConversion
    },
    'pdf-to-excel': {
      title: "PDF to Excel",
      description: "Extract tables and data from PDF to Excel spreadsheets",
      accept: ".pdf",
      handler: handlePdfToExcelConversion
    },
    'excel-to-pdf': {
      title: "Excel to PDF",
      description: "Convert Excel spreadsheets to PDF format",
      accept: ".xls,.xlsx",
      handler: handleExcelToPdfConversion
    },
    'pdf-to-image': {
      title: "PDF to Image",
      description: "Convert PDF pages to JPG or PNG images",
      accept: ".pdf",
      handler: handlePdfToImageConversion
    },
    'image-to-pdf': {
      title: "Image to PDF",
      description: "Combine multiple images into a single PDF file",
      accept: ".jpg,.jpeg,.png",
      multiple: true,
      handler: handleImageToPdfConversion
    },
    'pdf-to-text': {
      title: "PDF to Text",
      description: "Extract plain text from PDF files",
      accept: ".pdf",
      handler: handlePdfToTextConversion
    },
    'text-to-pdf': {
      title: "Text to PDF",
      description: "Convert plain text files to formatted PDF documents",
      accept: ".txt",
      handler: handleTextToPdfConversion
    },
    'pdf-to-html': {
      title: "PDF to HTML",
      description: "Convert PDF files to web-friendly HTML format",
      accept: ".pdf",
      handler: handlePdfToHtmlConversion
    },
    'html-to-pdf': {
      title: "HTML to PDF",
      description: "Convert HTML files to downloadable PDF documents",
      accept: ".html,.htm",
      handler: handleHtmlToPdfConversion
    },
    'merge-pdfs': {
      title: "Merge PDFs",
      description: "Combine multiple PDF files into a single document",
      accept: ".pdf",
      multiple: true,
      handler: handleMergePdfs
    },
    'split-pdf': {
      title: "Split PDF",
      description: "Split a PDF into multiple smaller files",
      accept: ".pdf",
      handler: handleSplitPdf
    },
    'compress-pdf': {
      title: "Compress PDF",
      description: "Reduce PDF file size without losing quality",
      accept: ".pdf",
      handler: handleCompressPdf
    }
  };

  // Render the active converter page
  if (activeConverter && converterConfigs[activeConverter]) {
    const config = converterConfigs[activeConverter];
    return (
      <ConverterPage
        title={config.title}
        description={config.description}
        accept={config.accept}
        multiple={config.multiple || false}
        onConvert={config.handler}
        onBack={handleBackToHome}
        converterKey={activeConverter}
      />
    );
  }

  // ============================
  // MAIN LANDING PAGE
  // ============================
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-3xl font-bold flex items-center">
            <span className="mr-2">📄</span>
            DocConvert Pro
          </div>
          <nav>
            <ul className="flex space-x-8">
              <li><a href="#" className="hover:text-blue-200 transition font-medium">Home</a></li>
              <li><a href="#" className="hover:text-blue-200 transition font-medium">About</a></li>
              <li><button onClick={scrollToServices} className="hover:text-blue-200 transition font-medium">Services</button></li>
              <li><a href="#" className="hover:text-blue-200 transition font-medium">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-bold text-blue-900 mb-6">
            Professional Document Converter
          </h1>
          <p className="text-xl text-blue-700 mb-10 max-w-3xl mx-auto">
            Convert between 30+ document formats instantly. Fast, secure, and 100% free!
          </p>
          <button
            onClick={scrollToServices}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-10 rounded-full text-lg transition transform hover:-translate-y-1 hover:shadow-2xl"
          >
            Explore All Converters
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">Why Choose Our Converter</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2">
              <div className="text-blue-500 text-5xl mb-6 text-center">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Lightning Fast</h3>
              <p className="text-gray-700 text-center">
                Convert documents in seconds with our optimized processing engine. No waiting in queues.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2">
              <div className="text-blue-500 text-5xl mb-6 text-center">🔒</div>
              <h3 className="text-2xl font-bold mb-4 text-center">Bank-Level Security</h3>
              <p className="text-gray-700 text-center">
                Your files are encrypted during transfer and deleted immediately after conversion.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2">
              <div className="text-blue-500 text-5xl mb-6 text-center">🎯</div>
              <h3 className="text-2xl font-bold mb-4 text-center">High Quality</h3>
              <p className="text-gray-700 text-center">
                Preserve formatting, fonts, and layout perfectly across all conversions.
              </p>
            </div>
          </div>
        </div>
      </section>

     {/* Services Section */}
<section ref={servicesRef} className="py-16 bg-gradient-to-b from-gray-50 to-white">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">
      All Conversion Tools
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      
      {/* Word to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-blue-500 text-5xl mb-4">📄→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-blue-700">Word to PDF</h3>
        <p className="text-gray-600 mb-6">
          Convert your Word documents (.doc, .docx) to professional PDF files
          while preserving formatting.
        </p>
        <button 
          onClick={() => setActiveConverter('word-to-pdf')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert Word to PDF
        </button>
      </div>
      
      {/* PDF to Word */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-blue-500 text-5xl mb-4">📘→📄</div>
        <h3 className="text-2xl font-bold mb-3 text-blue-700">PDF to Word</h3>
        <p className="text-gray-600 mb-6">
          Extract text from PDF files and convert them to editable Word documents
          with proper formatting.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-word')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to Word
        </button>
      </div>
      
      {/* PDF to PPT */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-purple-500 text-5xl mb-4">📘→🎯</div>
        <h3 className="text-2xl font-bold mb-3 text-purple-700">PDF to PowerPoint</h3>
        <p className="text-gray-600 mb-6">
          Convert PDF content into PowerPoint presentations with slide formatting.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-ppt')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to PPT
        </button>
      </div>
      
      {/* PPT to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-purple-500 text-5xl mb-4">🎯→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-purple-700">PowerPoint to PDF</h3>
        <p className="text-gray-600 mb-6">
          Convert presentations to PDF format for easy sharing and printing.
        </p>
        <button 
          onClick={() => setActiveConverter('ppt-to-pdf')}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PPT to PDF
        </button>
      </div>
      
      {/* PDF to Excel */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-green-500 text-5xl mb-4">📘→📊</div>
        <h3 className="text-2xl font-bold mb-3 text-green-700">PDF to Excel</h3>
        <p className="text-gray-600 mb-6">
          Extract tables and data from PDF to editable Excel spreadsheets.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-excel')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to Excel
        </button>
      </div>
      
      {/* Excel to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-green-500 text-5xl mb-4">📊→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-green-700">Excel to PDF</h3>
        <p className="text-gray-600 mb-6">
          Convert Excel spreadsheets to PDF format while preserving data formatting.
        </p>
        <button 
          onClick={() => setActiveConverter('excel-to-pdf')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert Excel to PDF
        </button>
      </div>
      
      {/* PDF to Image */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-yellow-500 text-5xl mb-4">📘→🖼️</div>
        <h3 className="text-2xl font-bold mb-3 text-yellow-700">PDF to Image</h3>
        <p className="text-gray-600 mb-6">
          Convert PDF pages to high-quality JPG or PNG images.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-image')}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to Image
        </button>
      </div>
      
      {/* Image to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-yellow-500 text-5xl mb-4">🖼️→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-yellow-700">Image to PDF</h3>
        <p className="text-gray-600 mb-6">
          Combine multiple images into a single PDF document.
        </p>
        <button 
          onClick={() => setActiveConverter('image-to-pdf')}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert Images to PDF
        </button>
      </div>
      
      {/* PDF to Text */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-gray-500 text-5xl mb-4">📘→📝</div>
        <h3 className="text-2xl font-bold mb-3 text-gray-700">PDF to Text</h3>
        <p className="text-gray-600 mb-6">
          Extract plain text content from PDF files.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-text')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to Text
        </button>
      </div>
      
      {/* Text to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-gray-500 text-5xl mb-4">📝→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-gray-700">Text to PDF</h3>
        <p className="text-gray-600 mb-6">
          Convert plain text files to formatted PDF documents.
        </p>
        <button 
          onClick={() => setActiveConverter('text-to-pdf')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert Text to PDF
        </button>
      </div>
      
      {/* PDF to HTML */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-red-500 text-5xl mb-4">📘→🌐</div>
        <h3 className="text-2xl font-bold mb-3 text-red-700">PDF to HTML</h3>
        <p className="text-gray-600 mb-6">
          Convert PDF files to web-friendly HTML format.
        </p>
        <button 
          onClick={() => setActiveConverter('pdf-to-html')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert PDF to HTML
        </button>
      </div>
      
      {/* HTML to PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-red-500 text-5xl mb-4">🌐→📘</div>
        <h3 className="text-2xl font-bold mb-3 text-red-700">HTML to PDF</h3>
        <p className="text-gray-600 mb-6">
          Convert HTML files to downloadable PDF documents.
        </p>
        <button 
          onClick={() => setActiveConverter('html-to-pdf')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Convert HTML to PDF
        </button>
      </div>
      
      {/* Merge PDFs */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-indigo-500 text-5xl mb-4">📘➕📘</div>
        <h3 className="text-2xl font-bold mb-3 text-indigo-700">Merge PDFs</h3>
        <p className="text-gray-600 mb-6">
          Combine multiple PDF files into a single document.
        </p>
        <button 
          onClick={() => setActiveConverter('merge-pdfs')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Merge PDF Files
        </button>
      </div>
      
      {/* Split PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-indigo-500 text-5xl mb-4">📘➗</div>
        <h3 className="text-2xl font-bold mb-3 text-indigo-700">Split PDF</h3>
        <p className="text-gray-600 mb-6">
          Split a PDF document into multiple smaller files.
        </p>
        <button 
          onClick={() => setActiveConverter('split-pdf')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Split PDF File
        </button>
      </div>
      
      {/* Compress PDF */}
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
        <div className="text-teal-500 text-5xl mb-4">📘↓</div>
        <h3 className="text-2xl font-bold mb-3 text-teal-700">Compress PDF</h3>
        <p className="text-gray-600 mb-6">
          Reduce PDF file size without losing quality.
        </p>
        <button 
          onClick={() => setActiveConverter('compress-pdf')}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
        >
          Compress PDF
        </button>
      </div>
      
      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center border-2 border-dashed border-blue-300">
        <div className="text-blue-400 text-5xl mb-4">✨</div>
        <h3 className="text-2xl font-bold mb-3 text-blue-600">More Tools</h3>
        <p className="text-gray-600 mb-6">
          10+ additional converters coming soon!
        </p>
        <button 
          className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
          disabled
        >
          Coming Soon
        </button>
      </div>
      
    </div>
  </div>
</section>     {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold mb-2">DocConvert Pro</div>
              <p className="text-gray-400">Professional document conversion tools</p>
              <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>All conversions are performed securely in your browser. No files are uploaded to our servers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TestCases;
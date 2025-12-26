import React, { useRef, useState } from 'react';
import mammoth from "mammoth";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const SimpleLayout = () => {
  // Refs
  const servicesRef = useRef(null);
  
  // State variables
  const [showWordToPdfPage, setShowWordToPdfPage] = useState(false);
  const [showPdfToWordPage, setShowPdfToWordPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');

  /**
   * Handles Word to PDF conversion
   */
  const handleWordToPdfConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setOriginalFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text from Word file using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;

      // Create PDF
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(text, 180);
      pdf.text(lines, 10, 10);

      // Convert PDF to blob and store it
      const pdfBlob = pdf.output('blob');
      setConvertedFile({
        blob: pdfBlob,
        type: 'application/pdf',
        extension: 'pdf'
      });
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles PDF to Word conversion
   */
  const handlePdfToWordConversion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setOriginalFileName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      // Create Word document
      const doc = new Document({
        sections: [
          {
            children: fullText
              .split("\n")
              .map(line => new Paragraph(line)),
          },
        ],
      });

      // Convert to blob and store it
      const blob = await Packer.toBlob(doc);
      setConvertedFile({
        blob: blob,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx'
      });
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Downloads the converted file
   */
  const handleDownload = () => {
    if (!convertedFile) return;
    
    const blob = convertedFile.blob;
    const fileName = `${originalFileName}_converted.${convertedFile.extension}`;
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Resets the conversion state when going back
   */
  const resetConversionState = () => {
    setConvertedFile(null);
    setOriginalFileName('');
  };

  /**
   * Navigation handlers
   */
  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted1 = () => {
    resetConversionState();
    setShowWordToPdfPage(true);
  };

  const handleGetStarted2 = () => {
    resetConversionState();
    setShowPdfToWordPage(true);
  };

  const handleBackToHome1 = () => {
    resetConversionState();
    setShowWordToPdfPage(false);
  };

  const handleBackToHome2 = () => {
    resetConversionState();
    setShowPdfToWordPage(false);
  };

  /**
   * Word to PDF Page Component
   */
  const WordToPdfPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
          Word to PDF Converter
        </h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Word Document (.docx)
          </label>
          <input
            type="file"
            accept=".docx"
            onChange={handleWordToPdfConversion}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="text-center my-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 mt-2">Converting...</p>
          </div>
        )}

        {convertedFile && !loading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium mb-3">
              ✅ File converted successfully!
            </p>
            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Download PDF
            </button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => document.querySelector('input[type="file"]').click()}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
            disabled={loading}
          >
            Choose Another File
          </button>
          
          <button
            onClick={handleBackToHome1}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * PDF to Word Page Component
   */
  const PdfToWordPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
          PDF to Word Converter
        </h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Document
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfToWordConversion}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="text-center my-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 mt-2">Converting...</p>
          </div>
        )}

        {convertedFile && !loading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium mb-3">
              ✅ File converted successfully!
            </p>
            <button
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Download Word Document
            </button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => document.querySelector('input[type="file"]').click()}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
            disabled={loading}
          >
            Choose Another File
          </button>
          
          <button
            onClick={handleBackToHome2}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  // Render conversion pages if active
  if (showWordToPdfPage) {
    return <WordToPdfPage />;
  }

  if (showPdfToWordPage) {
    return <PdfToWordPage />;
  }

  /**
   * Main Home Page
   */
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">DocConverter</div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="hover:text-blue-200 transition">Home</a></li>
              <li><a href="#" className="hover:text-blue-200 transition">About</a></li>
              <li><a href="#" className="hover:text-blue-200 transition">Services</a></li>
              <li><a href="#" className="hover:text-blue-200 transition">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-blue-50 py-20">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl font-bold text-blue-800 mb-4">
              Document Converter Pro
            </h1>
            <p className="text-xl text-blue-600 mb-8 max-w-2xl mx-auto">
              Convert your documents between Word and PDF formats seamlessly.
              Fast, secure, and completely free!
            </p>
            <button
              onClick={scrollToServices}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-blue-500 text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">Fast Conversion</h3>
                <p className="text-gray-600">
                  Convert documents in seconds with our optimized processing engine.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-blue-500 text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Your documents are processed locally - no files are uploaded to servers.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-blue-500 text-4xl mb-4">🆓</div>
                <h3 className="text-xl font-semibold mb-2">Completely Free</h3>
                <p className="text-gray-600">
                  No subscriptions, no hidden fees. Convert as many files as you need.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section ref={servicesRef} className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">
              Our Conversion Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
                <div className="text-blue-500 text-5xl mb-4">📄→📘</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-700">Word to PDF</h3>
                <p className="text-gray-600 mb-6">
                  Convert your Word documents (.doc, .docx) to professional PDF files
                  while preserving formatting.
                </p>
                <button 
                  onClick={handleGetStarted1}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  Convert Word to PDF
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-8 flex flex-col items-center text-center">
                <div className="text-blue-500 text-5xl mb-4">📘→📄</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-700">PDF to Word</h3>
                <p className="text-gray-600 mb-6">
                  Extract text from PDF files and convert them to editable Word documents
                  with proper formatting.
                </p>
                <button 
                  onClick={handleGetStarted2}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  Convert PDF to Word
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg font-semibold mb-1">DocConverter</p>
              <p>© 2023 DocConverter. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-blue-300 transition">Privacy Policy</a>
              <a href="#" className="hover:text-blue-300 transition">Terms of Service</a>
              <a href="#" className="hover:text-blue-300 transition">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLayout;
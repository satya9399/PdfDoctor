import React from 'react';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const File = () => {
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      convertPdfToDocx(file);
    } else {
      convertTextToDocx(file);
    }
  };

  const convertTextToDocx = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph(text)],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "ConvertedFile.docx");
    };
    reader.readAsText(file);
  };

  const convertPdfToDocx = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        fullText += strings.join(' ') + '\n\n';
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [new Paragraph(fullText)],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "ConvertedPDF.docx");
    };
    reader.readAsArrayBuffer(file);
  };

  const triggerFileInput = () => {
    document.getElementById('hiddenFileInput').click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">Logo</div>
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
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-8 w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <input
            type="file"
            id="hiddenFileInput"
            onChange={handleFileImport}
            style={{ display: 'none' }}
            accept=".txt,.pdf,.csv,.json"
          />

          <button
            onClick={triggerFileInput}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Import Your File
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>© 2023 My Company. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
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

export default File;

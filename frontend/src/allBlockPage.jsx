import React from 'react';

const BlocksPage = () => {
  // Sample data for the blocks
const blocks = [
  {
    title: "Word to PDF",
    content: "It will take a .doc or .docx file and convert it into a PDF file."
  },
  {
    title: "PDF to Word",
    content: "It will extract text and formatting from a PDF file and convert it into a .docx file."
  },
  {
    title: "PDF to PPT",
    content: "Convert your PDF content into a PowerPoint (.pptx) presentation."
  },
  {
    title: "PPT to PDF",
    content: "Convert a PowerPoint presentation into a PDF file for easy sharing."
  },
  {
    title: "PDF to Excel",
    content: "Extract tables and data from PDF files and convert them into Excel format."
  },
  {
    title: "Excel to PDF",
    content: "Convert .xls or .xlsx files into PDF format."
  },
  {
    title: "PDF to Image",
    content: "Convert PDF pages into JPG or PNG images."
  },
  {
    title: "Image to PDF",
    content: "Combine one or more images (JPG/PNG) into a single PDF file."
  },
  {
    title: "PDF to Text",
    content: "Extract plain text from PDF files."
  },
  {
    title: "Text to PDF",
    content: "Convert plain text files (.txt) into a formatted PDF document."
  },
  {
    title: "PDF to HTML",
    content: "Convert PDF files into web-friendly HTML format."
  },
  {
    title: "HTML to PDF",
    content: "Convert HTML web pages into downloadable PDF files."
  },
  {
    title: "Merge PDFs",
    content: "Combine multiple PDF files into a single document."
  },
  {
    title: "Split PDF",
    content: "Split a PDF into multiple smaller files based on pages."
  },
  {
    title: "Compress PDF",
    content: "Reduce the file size of PDF documents without losing quality."
  },
  {
    title: "Rotate PDF",
    content: "Rotate specific pages or entire PDF files."
  },
  {
    title: "Unlock PDF",
    content: "Remove password protection from a secured PDF."
  },
  {
    title: "Protect PDF",
    content: "Add password protection and encryption to your PDF files."
  },
  {
    title: "Add Watermark to PDF",
    content: "Insert text or image watermarks to your PDF files."
  },
  {
    title: "Extract Images from PDF",
    content: "Pull all embedded images from a PDF file."
  },
  {
    title: "Reorder PDF Pages",
    content: "Change the order of pages in a PDF file."
  },
  {
    title: "Word to Text",
    content: "Convert .doc or .docx files into plain text format."
  },
  {
    title: "Text to Word",
    content: "Convert plain .txt files into .docx format."
  },
  {
    title: "Word to PPT",
    content: "Convert a Word document into a PowerPoint presentation."
  },
  {
    title: "PPT to Word",
    content: "Convert presentation slides into a Word document."
  },
  {
    title: "PPT to Video",
    content: "Export your PowerPoint presentation into a video file format."
  },
  {
    title: "Excel to CSV",
    content: "Convert Excel spreadsheet into comma-separated values (.csv) format."
  },
  {
    title: "CSV to Excel",
    content: "Convert .csv files back into Excel spreadsheets."
  },
  {
    title: "Excel to Image",
    content: "Turn your Excel sheets into image formats like PNG or JPG."
  },
  {
    title: "Markdown to HTML",
    content: "Convert Markdown (.md) files into HTML for web use."
  },
  {
    title: "Text to HTML",
    content: "Wrap your plain text into a basic HTML structure."
  },
  {
    title: "ePub to PDF",
    content: "Convert ePub ebooks into PDF format."
  },
  {
    title: "PDF to ePub",
    content: "Convert PDF books into ePub format for eReaders."
  }
];


  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Same as original */}
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

      {/* Main Content - 8 Blocks */}
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12 text-blue-800">Our Services</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blocks.map((block, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 flex flex-col">
                <h2 className="text-xl font-semibold mb-4 text-blue-700">{block.title}</h2>
                <p className="text-gray-600 mb-6 flex-grow">{block.content}</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition self-start">
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer - Same as original */}
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

export default BlocksPage;
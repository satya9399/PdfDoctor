import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SimpleLayout from './sample'
import File from './file';
import BlocksPage from './allBlockPage'
import TestCases from './test';



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestCases />} />
        <Route path="/simple" element={<SimpleLayout />} />
        <Route path="/file" element={<File />} />
         <Route path="/allpage" element={<BlocksPage />} />
      </Routes>
    </Router>
  );
};

export default App;

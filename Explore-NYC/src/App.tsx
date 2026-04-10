import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StartScreen from './home/StartScreen';
import Questionnaire from './questionary/Questionnaire';
import ResultsPage from './results/ResultsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

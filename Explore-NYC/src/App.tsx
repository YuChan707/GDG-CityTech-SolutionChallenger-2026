import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import StartScreen from './home/StartScreen';
import Questionnaire from './questionary/Questionnaire';
import ResultsPage from './results/ResultsPage';
import AboutPage from './pages/AboutPage';
import ReviewPage from './pages/ReviewPage';
import SubmitPage from './pages/SubmitPage';
import EducationQuestionnaire from './education/EducationQuestionnaire';
import EducationResults from './education/EducationResults';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<StartScreen />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/education/questionnaire" element={<EducationQuestionnaire />} />
          <Route path="/education/results" element={<EducationResults />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

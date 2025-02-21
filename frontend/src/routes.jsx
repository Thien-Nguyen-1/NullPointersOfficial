import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import QuestionnairePage from "./pages/QuestionnairePage";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questionnaire" element={<QuestionnairePage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
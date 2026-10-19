
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import DashboardPage from "./pages/DashboardPage";
import MongoDBPage from "./pages/MongoDBPage";
import Neo4jPage from "./pages/Neo4jPage";
import ExploradorGrafoPage from "./pages/ExploradorGrafoPage";
import BuscadorPage from "./pages/BuscadorPage";
import ImportarCSVPage from "./pages/ImportarCSVPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/mongodb" element={<MongoDBPage />} />
          <Route path="/neo4j" element={<Neo4jPage />} />
          <Route path="/explorador" element={<ExploradorGrafoPage />} />
          <Route path="/buscador" element={<BuscadorPage />} />
          <Route path="/importar" element={<ImportarCSVPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

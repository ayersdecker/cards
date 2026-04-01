import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import CardSearch from './components/Cards/CardSearch';
import CollectionsList from './components/Collections/CollectionsList';
import CollectionDetail from './components/Collections/CollectionDetail';
import DecksList from './components/Decks/DecksList';
import DeckBuilder from './components/Decks/DeckBuilder';
import CardRecognition from './components/CardRecognition/CardRecognition';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/cards">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route element={<Layout />}>
            <Route index element={<CardSearch />} />
            <Route path="/collections" element={<CollectionsList />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/decks" element={<DecksList />} />
            <Route path="/decks/:id" element={<DeckBuilder />} />
            <Route path="/recognize" element={<CardRecognition />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

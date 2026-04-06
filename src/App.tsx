import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StorageSettingsProvider } from './context/StorageSettingsContext';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import CardSearch from './components/Cards/CardSearch';
import CollectionsList from './components/Collections/CollectionsList';
import CollectionDetail from './components/Collections/CollectionDetail';
import DeckBuilder from './components/Decks/DeckBuilder';
import StorageSettingsPage from './components/Settings/StorageSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <StorageSettingsProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/search" element={<CardSearch />} />
              <Route path="/collections" element={<CollectionsList />} />
              <Route path="/collections/deck/:id" element={<DeckBuilder />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/decks" element={<Navigate to="/collections" replace />} />
              <Route path="/decks/:id" element={<Navigate to="/collections" replace />} />
              <Route path="/recognize" element={<Navigate to="/search" replace />} />
              <Route path="/settings" element={<StorageSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </StorageSettingsProvider>
    </AuthProvider>
  );
}

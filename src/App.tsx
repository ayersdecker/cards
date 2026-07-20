import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StorageSettingsProvider } from './context/StorageSettingsContext';
import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import HomePage from './components/Home/HomePage';
import CardSearch from './components/Cards/CardSearch';
import CollectionsList from './components/Collections/CollectionsList';
import CollectionDetail from './components/Collections/CollectionDetail';
import DeckBuilder from './components/Decks/DeckBuilder';
import TradeBinderPage from './components/Trade/TradeBinderPage';
import StorageSettingsPage from './components/Settings/StorageSettingsPage';
import ProxyHubPage from './components/Proxy/ProxyHubPage';
import ProxyPrintPage from './components/Proxy/ProxyPrintPage';
import MissingFirebaseConfigPage from './components/System/MissingFirebaseConfigPage';
import { firebaseEnvIssue, missingFirebaseEnvVars } from './services/firebase';

export default function App() {
  if (firebaseEnvIssue) {
    return <MissingFirebaseConfigPage missingVars={missingFirebaseEnvVars} />;
  }

  return (
    <AuthProvider>
      <StorageSettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/search" element={<CardSearch />} />
              <Route path="/collections" element={<CollectionsList />} />
              <Route path="/trade" element={<TradeBinderPage />} />
              <Route path="/proxies" element={<ProxyHubPage />} />
              <Route path="/proxies/:sourceType/:id" element={<ProxyPrintPage />} />
              <Route path="/proxies/deck/:id" element={<ProxyPrintPage />} />
              <Route path="/collections/deck/:id" element={<DeckBuilder />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route path="/decks" element={<Navigate to="/collections" replace />} />
              <Route path="/decks/:id" element={<Navigate to="/collections" replace />} />
              <Route path="/recognize" element={<Navigate to="/search" replace />} />
              <Route path="/settings" element={<StorageSettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StorageSettingsProvider>
    </AuthProvider>
  );
}

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignupModal from './components/SignupModal';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './components/Dashboard';
import CreateContent from './components/CreateContent';
import CreatorProfile from './components/CreatorProfile';
import SubscribeModal from './components/SubscribeModal';
import TipModal from './components/TipModal';
import Vault from './components/Vault';
import ExplorePage from './components/ExplorePage';
import { supabase } from './lib/supabase';
import type { User } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'onboarding' | 'dashboard' | 'create' | 'vault' | 'explore'>('landing');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [signupData, setSignupData] = useState<{ method: 'wallet' | 'email'; data: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const handleGetStarted = () => {
    setShowSignupModal(true);
  };

  const handleSignup = async (method: 'wallet' | 'email', data: string) => {
    setIsCheckingUser(true);

    // Verificar si ya existe un usuario con esta wallet/email
    const lookupField = method === 'wallet' ? 'wallet_address' : 'email';
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq(lookupField, data)
      .maybeSingle();

    setIsCheckingUser(false);

    if (existingUser) {
      // Usuario existe, hacer login automático
      console.log('User found, logging in automatically:', existingUser);
      setCurrentUser(existingUser);
      setShowSignupModal(false);
      setCurrentPage('dashboard');
    } else {
      // Usuario nuevo, ir al onboarding
      setSignupData({ method, data });
      setShowSignupModal(false);
      setCurrentPage('onboarding');
    }
  };

  const handleOnboardingComplete = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');

    const confetti = document.createElement('div');
    confetti.innerHTML = '🎉';
    confetti.style.position = 'fixed';
    confetti.style.top = '50%';
    confetti.style.left = '50%';
    confetti.style.fontSize = '100px';
    confetti.style.zIndex = '9999';
    confetti.style.pointerEvents = 'none';
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 2000);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as any);
  };

  const handleSubscribe = (creator: User) => {
    setSelectedCreator(creator);
    setShowSubscribeModal(true);
  };

  const handleTip = (creator: User) => {
    setSelectedCreator(creator);
    setShowTipModal(true);
  };

  const handleContentPublished = () => {
    setCurrentPage('dashboard');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              {currentPage === 'landing' && <LandingPage onGetStarted={handleGetStarted} />}
              {currentPage === 'onboarding' && signupData && (
                <OnboardingWizard userData={signupData} onComplete={handleOnboardingComplete} />
              )}
              {currentPage === 'dashboard' && currentUser && (
                <Dashboard user={currentUser} onNavigate={handleNavigate} />
              )}
              {currentPage === 'create' && currentUser && (
                <CreateContent
                  user={currentUser}
                  onBack={() => setCurrentPage('dashboard')}
                  onComplete={handleContentPublished}
                />
              )}
              {currentPage === 'vault' && currentUser && (
                <Vault user={currentUser} onBack={() => setCurrentPage('dashboard')} />
              )}
              {currentPage === 'explore' && (
                <ExplorePage onBack={() => setCurrentPage(currentUser ? 'dashboard' : 'landing')} />
              )}

              <SignupModal
                isOpen={showSignupModal}
                onClose={() => setShowSignupModal(false)}
                onSignup={handleSignup}
              />

              {selectedCreator && (
                <>
                  <SubscribeModal
                    isOpen={showSubscribeModal}
                    onClose={() => setShowSubscribeModal(false)}
                    creator={selectedCreator}
                  />
                  <TipModal
                    isOpen={showTipModal}
                    onClose={() => setShowTipModal(false)}
                    creator={selectedCreator}
                  />
                </>
              )}
            </>
          }
        />
        <Route
          path="/:username"
          element={
            <CreatorProfile
              username={window.location.pathname.slice(1)}
              onSubscribe={handleSubscribe}
              onTip={handleTip}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

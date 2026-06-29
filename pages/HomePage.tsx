import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import DeferredSection from '../components/DeferredSection';
import Hero from '../components/Hero';
import StaffPartnerTeamPopup from '../components/StaffPartnerTeamPopup';
import { DEFAULT_SEASON_ID } from '../config/seasons';
import { useSeason } from '../hooks/useSeason';

const ActiveHomeContent = lazy(() => import('../components/home/ActiveHomeContent'));
const RegistrationHomeContent = lazy(() => import('../components/home/RegistrationHomeContent'));
const StatusHomeContent = lazy(() => import('../components/home/StatusHomeContent'));

const HomeContentFallback: React.FC = () => (
  <div className="min-h-[520px] animate-pulse bg-gradient-to-b from-neutral-50 to-white" aria-hidden="true" />
);

const HomePage: React.FC = () => {
  const { activeSeasonId, activeSeason } = useSeason();

  if (activeSeasonId !== DEFAULT_SEASON_ID) {
    return <Navigate to="/" replace />;
  }

  const content = activeSeason.status === 'registration'
    ? <RegistrationHomeContent />
    : activeSeason.status === 'review' || activeSeason.status === 'upcoming'
      ? <StatusHomeContent status={activeSeason.status} />
      : <ActiveHomeContent />;

  return (
    <div className="w-full overflow-x-hidden">
      {activeSeason.status === 'registration' && <StaffPartnerTeamPopup />}
      <Hero />
      <DeferredSection minHeight={520} rootMargin="1000px 0px">
        <Suspense fallback={<HomeContentFallback />}>
          {content}
        </Suspense>
      </DeferredSection>
    </div>
  );
};

export default HomePage;

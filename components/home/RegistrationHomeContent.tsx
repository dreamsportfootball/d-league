import React from 'react';
import BrandStory from '../BrandStory';
import ClubGrid from '../ClubGrid';
import NewsSection from '../NewsSection';
import RegistrationOverview from '../RegistrationOverview';

const RegistrationHomeContent: React.FC = () => (
  <>
    <RegistrationOverview />
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <NewsSection />
    </section>
    <div id="teams">
      <ClubGrid />
    </div>
    <BrandStory />
  </>
);

export default RegistrationHomeContent;

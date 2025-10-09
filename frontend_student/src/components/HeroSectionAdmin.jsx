import React, { useState } from 'react';
import '../css/HeroSection.css';


const HeroSection = ({message}) => {
  return (
    <section className="hero-section admin">
      <div className="hero-background">
        <img src="../public/1.png" alt="Mountains" className="hero-bg-image" />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <h1>{message}</h1>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
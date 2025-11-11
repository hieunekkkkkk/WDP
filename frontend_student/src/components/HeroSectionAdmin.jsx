import React, { useState } from 'react';
import '../css/HeroSection.css';


const HeroSection = ({message}) => {
  return (
    <section className="hero-section admin">
      <div className="hero-background">
        <img src="https://res.cloudinary.com/diqpghsfm/image/upload/v1762696086/1_ypkvxn.jpg" alt="Mountains" className="hero-bg-image" />
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
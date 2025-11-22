'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Heading from './Heading';
import Section from './Section';
import morganImage from '../assets/agents/morgan.jpeg';
import claudiaImage from '../assets/agents/claudia.jpeg';
import walterImage from '../assets/agents/Walter.jpeg';
import irisImage from '../assets/agents/iris.jpeg';
import noraImage from '../assets/agents/nora.jpeg';
import missSehatImage from '../assets/agents/miss-sehat.jpeg';

const agents = [
    {
        name: 'Miss Sehat',
        image: missSehatImage,
        description: 'Main character: Routes you to the specialized Agent',
      },
    {
    name: 'Morgan',
    image: morganImage,
    description: 'Helps the user find the right doctor for him',
  },
  {
    name: 'Claudia',
    image: claudiaImage,
    description: 'Sits in a clinical session and records the minutes of meeting and the whole symptoms prescription and keeps a record of everything',
  },
  {
    name: 'Walter',
    image: walterImage,
    description: 'Is a voice agent that calls the clinic for you and book the appointment for you',
  },
  {
    name: 'Iris',
    image: irisImage,
    description: 'Helps you finding health program where you are eligible',
  },
  {
    name: 'Nora',
    image: noraImage,
    description: 'Your dedicated health assistant for figuring out your symptoms',
  },
];

const AgentsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % agents.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + agents.length) % agents.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % agents.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <Section id="agents" className="overflow-hidden">
      <div className="container relative z-2">
        <Heading
          className="md:max-w-md lg:max-w-2xl"
          title="Meet the sehat agency"
        />

        <div className="relative">
          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
              style={{
                transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
              }}
            >
              {agents.map((agent, index) => (
                <div
                  key={index}
                  className="min-w-full px-4 md:px-8 lg:px-12"
                >
                  <div className="max-w-md mx-auto">
                    <div className="relative group">
                      {/* Card Container */}
                      <div className="relative h-[500px] rounded-2xl overflow-hidden bg-n-7 shadow-2xl">
                        {/* Agent Image */}
                        <div className="absolute inset-0">
                          <Image
                            src={agent.image}
                            alt={agent.name}
                            fill
                            className="object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 will-change-transform"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 400px"
                            quality={90}
                          />
                          {/* Dark Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-n-8/95 via-n-8/70 to-n-8/50" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-8 text-n-1 z-10">
                          <h3 className="h3 mb-4 text-n-1 font-bold">
                            {agent.name}
                          </h3>
                          <p className="body-1 text-n-2 leading-relaxed">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-n-8/90 hover:bg-n-8 backdrop-blur-sm border border-n-1/20 rounded-full p-3 md:p-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-color-1 shadow-lg"
            aria-label="Previous agent"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-n-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-n-8/90 hover:bg-n-8 backdrop-blur-sm border border-n-1/20 rounded-full p-3 md:p-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-color-1 shadow-lg"
            aria-label="Next agent"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-n-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {agents.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full ${
                  index === currentIndex
                    ? 'bg-color-1 w-8 h-2 shadow-lg shadow-color-1/50'
                    : 'bg-n-6 w-2 h-2 hover:bg-n-5 hover:w-3'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AgentsCarousel;


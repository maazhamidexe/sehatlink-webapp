'use client';

import React from "react";
import Section from "./Section";
import { socials } from "../constants";
import { brainwaveSymbol } from "../assets";

const Footer = () => {
  return (
    <Section crosses className="!px-0 !py-10">
      <div className="container flex sm:justify-between justify-center items-center gap-10 max-sm:flex-col">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={brainwaveSymbol} width={24} height={24} alt="Sehat Link" />
            <span className="font-bold text-n-1">Sehat Link</span>
          </div>
          <p className="caption text-n-4">
            © {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>

        <ul className="flex gap-5 flex-wrap">
          {socials.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              className="flex items-center justify-center w-10 h-10 bg-n-7 rounded-full transition-colors hover:bg-n-6"
            >
              <img src={item.iconUrl} width={16} height={16} alt={item.title} />
            </a>
          ))}
        </ul>
      </div>
    </Section>
  );
};

export default Footer;

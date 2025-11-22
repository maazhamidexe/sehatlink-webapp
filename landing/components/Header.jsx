'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { disablePageScroll, enablePageScroll } from "scroll-lock";

import { brainwaveSymbol } from "../assets";
import { navigation } from "../constants";
import Button from "./Button";
import MenuSvg from "../assets/svg/MenuSvg";
import { HamburgerMenu } from "./design/Header";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const router = useRouter();
  const { loggedIn } = useAuth();
  const [openNavigation, setOpenNavigation] = useState(false);
  const [activeHash, setActiveHash] = useState("#hero");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#hero");
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const closeNavigation = () => {
    enablePageScroll();
    setOpenNavigation(false);
  };

  const toggleNavigation = () => {
    if (openNavigation) {
      closeNavigation();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleNavClick = (url) => {
    if (url?.startsWith("#")) {
      setActiveHash(url);
    }

    if (openNavigation) {
      closeNavigation();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50  border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ${
        openNavigation ? "bg-n-8" : "bg-n-8/90 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">
        <a className="flex items-center gap-2 xl:mr-8" href="#hero">
          <Image src={brainwaveSymbol} width={40} height={40} alt="Sehat Link" priority />
          <span className="text-2xl font-bold text-n-1">Sehat Link</span>
        </a>

        <nav
          className={`${
            openNavigation ? "flex" : "hidden"
          } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
        >
          <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={() => handleNavClick(item.url)}
                className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-color-1 ${
                  item.onlyMobile ? "lg:hidden" : ""
                } px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-xs lg:font-semibold ${
                  item.url === activeHash
                    ? "z-2 lg:text-n-1"
                    : "lg:text-n-1/50"
                } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
              >
                {item.title}
              </a>
            ))}
          </div>

          <HamburgerMenu />
        </nav>

        <a
          onClick={(e) => {
            e.preventDefault();
            router.push(loggedIn ? "/chat" : "/auth");
          }}
          className="button hidden mr-4 text-n-1/50 transition-colors hover:text-n-1 lg:block cursor-pointer"
        >
          {loggedIn ? "Dashboard" : "New account"}
        </a>
        
        <a
          onClick={(e) => {
            e.preventDefault();
            router.push("/auth/doctor");
          }}
          className="button hidden mr-8 text-color-1/70 transition-colors hover:text-color-1 lg:block cursor-pointer"
        >
          Doctor Portal
        </a>

        <Button className="hidden lg:flex" onClick={() => router.push(loggedIn ? "/chat" : "/auth")}>
          {loggedIn ? "Go to Chat" : "Sign in"}
        </Button>

        <Button
          className="ml-auto lg:hidden"
          px="px-3"
          onClick={toggleNavigation}
        >
          <MenuSvg openNavigation={openNavigation} />
        </Button>
      </div>
    </div>
  );
};

export default Header;

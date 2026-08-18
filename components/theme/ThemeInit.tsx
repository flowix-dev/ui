"use client";

import { useEffect } from "react";

const SCRIPT = `(function(){try{var t=localStorage.getItem("flowix-theme");var dark=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(dark){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export function ThemeInit() {
  useEffect(() => {
    const s = document.createElement("script");
    s.textContent = SCRIPT;
    document.head.prepend(s);
  }, []);

  return null;
}

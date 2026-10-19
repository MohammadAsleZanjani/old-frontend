"use client";

import { Blog } from "@/features/public-site/sections/Blog";
import { Clients } from "@/features/public-site/sections/Clients";
import { CodeShowcase } from "@/features/public-site/sections/CodeShowcase";
import { CTA } from "@/features/public-site/sections/CTA";
import { FAQ } from "@/features/public-site/sections/FAQ";
import { Footer } from "@/features/public-site/sections/Footer";
import { IdeaGenerator } from "@/features/public-site/sections/IdeaGenerator";
import { Portfolio } from "@/features/public-site/sections/Portfolio";
import { Process } from "@/features/public-site/sections/Process";
import { Services } from "@/features/public-site/sections/Services";
import { Stats } from "@/features/public-site/sections/Stats";
import { TechStack } from "@/features/public-site/sections/TechStack";
import { Testimonials } from "@/features/public-site/sections/Testimonials";

export function LandingSections() {
  return (
    <>
      <IdeaGenerator />
      <CodeShowcase />
      <Stats />
      <Services />
      <Portfolio />
      <Process />
      <TechStack />
      <Testimonials />
      <FAQ />
      <Blog />
      <CTA />
      <Clients />
      <Footer />
    </>
  );
}


'use client';

import Link from 'next/link';
import { Briefcase, Wand2, Lightbulb, FileScan, Mail, Brain, MessageSquare, Menu, X, List, Map, Send, UserCheck, DollarSign, Eye } from 'lucide-react'; // Added Eye
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", text: "Jobs", icon: List },
    { href: "/ai-search", text: "AI Search", icon: Wand2 },
    { href: "/resume-analyzer", text: "Resume AI", icon: FileScan },
    { href: "/cover-letter-generator", text: "Cover Letter AI", icon: Mail },
    { href: "/skill-gap-analyzer", text: "Skill Gap AI", icon: Brain },
    { href: "/job-description-analyzer", text: "JD Analyzer AI", icon: Eye }, // New Link
    { href: "/outreach-optimizer", text: "Outreach AI", icon: Send },
    { href: "/career-path-advisor", text: "Career Path AI", icon: Map },
    { href: "/application-strategist", text: "App Strategist AI", icon: UserCheck },
    { href: "/salary-negotiator", text: "Salary Coach AI", icon: DollarSign },
    { href: "/mock-interview", text: "Mock Interview", icon: MessageSquare },
    { href: "/guidance", text: "Guidance", icon: Lightbulb },
  ];

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Briefcase className="h-7 w-7" />
          <h1 className="text-2xl font-semibold">Career Compass</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 md:gap-2 text-xs sm:text-sm flex-wrap justify-end">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap px-2 py-1 rounded-md"
            >
              <link.icon className="h-4 w-4" />
              {link.text}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-foreground hover:text-primary p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-border shadow-lg z-40">
          <nav className="flex flex-col items-stretch px-2 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleMobileLinkClick}
                className="flex items-center gap-3 px-3 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span>{link.text}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

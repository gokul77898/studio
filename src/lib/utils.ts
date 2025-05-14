import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Job } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TECH_KEYWORDS = [
  // Software General
  'software',
  'engineer', // Often combined with software, e.g., "software engineer"
  'developer', // e.g., "software developer", "web developer"
  'programmer',
  // Full Stack
  'full stack',
  'full-stack',
  // Frontend / Backend (parts of software/full stack)
  'frontend',
  'backend',
  'web develop', // Covers web application software
  'app develop', // Covers application software
  // AI - Artificial Intelligence
  ' ai ', // Space to avoid matching "pair", "train", etc.
  'artificial intelligence',
  'deep learning',
  'natural language processing',
  'nlp',
  'computer vision',
  // ML - Machine Learning
  'ml ', // Space to avoid matching "html", "xml"
  'machine learning',
  // Roles very closely tied to AI/ML project success
  'data scientist', // Often designs/builds ML models
  'data engineer',  // Builds data pipelines for ML
  'algorithm developer', // Generic but often very relevant to software/AI/ML
];

export function isTechJob(job: Job): boolean {
  const titleLower = job.title.toLowerCase();
  const descriptionLower = job.description.toLowerCase();

  // Check title first for common tech roles
  if (TECH_KEYWORDS.some(keyword => titleLower.includes(keyword.trim()))) {
    return true;
  }

  // If title isn't conclusive, check description for tech keywords
  if (TECH_KEYWORDS.some(keyword => descriptionLower.includes(keyword.trim()))) {
    // Avoid overly broad matches for "manager" or "analyst" if only found in description
    // and not clearly tech-related in title.
    const nonSpecificManagerOrAnalyst = (titleLower.includes('manager') || titleLower.includes('analyst')) &&
                                        !TECH_KEYWORDS.some(kw => titleLower.includes(kw.trim()));

    if (nonSpecificManagerOrAnalyst) {
        // If "manager" or "analyst" is in title without other tech keywords,
        // require stronger tech signals in the description related to software, AI, ML.
        if (descriptionLower.includes('software') ||
            descriptionLower.includes(' ai ') ||
            descriptionLower.includes('artificial intelligence') ||
            descriptionLower.includes('ml ') ||
            descriptionLower.includes('machine learning') ||
            descriptionLower.includes('full stack') ||
            descriptionLower.includes('frontend') ||
            descriptionLower.includes('backend') ||
            descriptionLower.includes('data-driven platform') ||
            descriptionLower.includes('technical team lead') ||
            descriptionLower.includes('development lifecycle')) {
            return true;
        }
        return false;
    }
    return true;
  }

  return false;
}

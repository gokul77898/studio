import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Job } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TECH_KEYWORDS = [
  'software', 'engineer', 'developer', 'programmer', ' ai ', 'artificial intelligence', 
  'machine learning', 'data scientist', 'data analyst', 'cloud ', 'devops', 'cybersecurity', 
  'frontend', 'backend', 'full stack', 'web develop', 'mobile develop', ' ux ', ' ui ', 
  'product manager', // often tech-focused
  ' it ', 'information technology', 'technical writer', 'qa ', 'quality assurance', 'tester',
  'database administrator', 'dba', 'network engineer', 'systems administrator', 'solution architect',
  'technician', // Can be broad, but often tech-related in job contexts
  'bioinformatics', 'computational', 'robotics', 'firmware', 'embedded system',
  'blockchain', 'crypto', 'web3', // Added blockchain and related terms
  'game develop', 'game design', // Added game development
  'site reliability', 'sre', 'platform engineer', 'security engineer',
  'systems engineer', 'technical support engineer', 'application support engineer',
  'technical program manager', 'tpm', 'data engineer', 'analytics engineer',
  'business intelligence', 'bi developer', 'iot', 'internet of things',
  'ar/vr', 'augmented reality', 'virtual reality', 'quantum computing' // Added more emerging tech
];

export function isTechJob(job: Job): boolean {
  const titleLower = job.title.toLowerCase();
  const descriptionLower = job.description.toLowerCase();

  // Check title first for common tech roles
  if (TECH_KEYWORDS.some(keyword => titleLower.includes(keyword.trim()))) { // .trim() for keywords with spaces
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
        // require stronger tech signals in the description
        if (descriptionLower.includes('software') || 
            descriptionLower.includes('technology') || 
            descriptionLower.includes(' saas') ||
            descriptionLower.includes('technical team') ||
            descriptionLower.includes('data-driven') ||
            descriptionLower.includes(' agile ') ||
            descriptionLower.includes(' it ')) {
            return true;
        }
        return false; 
    }
    return true;
  }

  return false;
}

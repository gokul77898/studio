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
  'product manager', // often tech-focused, can be refined if too broad
  ' it ', 'information technology', 'technical writer', 'qa ', 'quality assurance', 'tester',
  'database administrator', 'network engineer', 'systems administrator', 'solution architect',
  'technician', 'bioinformatics', 'computational', 'robotics', 'firmware', 'embedded',
  'blockchain', 'game develop', 'site reliability', 'sre', 'platform engineer', 'security engineer'
];

export function isTechJob(job: Job): boolean {
  const titleLower = job.title.toLowerCase();
  const descriptionLower = job.description.toLowerCase();

  // Check title first for common tech roles
  if (TECH_KEYWORDS.some(keyword => titleLower.includes(keyword))) {
    return true;
  }

  // If title isn't conclusive, check description for tech keywords
  // This is a broader check and might need tuning
  if (TECH_KEYWORDS.some(keyword => descriptionLower.includes(keyword))) {
    // Add more specific checks here if needed to avoid false positives from description
    // For example, "product manager" in description is more likely tech if it's in "product manager for a software company"
    if (titleLower.includes('manager') && !TECH_KEYWORDS.some(kw => titleLower.includes(kw))) {
        // Avoid "manager" roles in non-tech companies if only description matches weakly
        if (descriptionLower.includes('software') || descriptionLower.includes('tech') || descriptionLower.includes('saas')) {
            return true;
        }
        return false; 
    }
    return true;
  }

  return false;
}

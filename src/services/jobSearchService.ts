
'use server';
import type { Job, FilterCriteria, JobType } from '@/types';

// --- IMPORTANT SETUP ---
// This service is pre-configured for JSearch API (available on RapidAPI).
// 1. GET YOUR JSEARCH API KEY:
//    - Go to RapidAPI: https://rapidapi.com/
//    - Search for "JSearch" API and subscribe (e.g., to the free tier).
//    - Find your 'X-RapidAPI-Key' on the API's "Endpoints" page.
// 2. SET API KEY IN .env:
//    - Open your .env file in the project root.
//    - Paste your key: JOB_SEARCH_API_KEY=your_actual_jsearch_api_key_here
//    - Restart your Next.js development server.

const API_BASE_URL = process.env.JOB_API_BASE_URL || 'https://jsearch.p.rapidapi.com';
const API_HOST = process.env.JOB_API_HOST || 'jsearch.p.rapidapi.com';
const API_KEY = process.env.JOB_SEARCH_API_KEY;

// This interface is based on the typical structure of a JSearch API response item.
// Verify against JSearch documentation if you encounter issues.
interface ApiJobResponseItem {
  job_id: string;
  job_title: string;
  employer_name?: string;
  employer_logo?: string | null;
  job_description: string;
  job_country?: string;
  job_city?: string;
  job_state?: string;
  job_employment_type?: string; // e.g., FULLTIME, CONTRACTOR, PARTTIME, INTERN
  job_apply_link?: string;
  job_posted_at_timestamp?: number;
  job_posted_at_datetime_utc?: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string | null;
  job_salary_period?: string | null; // e.g., HOURLY, MONTHLY, YEARLY
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_is_remote?: boolean;
  // Add other fields as provided by JSearch if needed
}

function mapApiJobType(apiJobType?: string): Job['type'] {
  const type = apiJobType?.toUpperCase();
  if (!type) return 'Full-time'; // Default if undefined

  if (type.includes('FULLTIME') || type.includes('FULL_TIME')) return 'Full-time';
  if (type.includes('PARTTIME') || type.includes('PART_TIME')) return 'Part-time';
  if (type.includes('CONTRACTOR') || type.includes('CONTRACT')) return 'Contract';
  if (type.includes('INTERN') || type.includes('INTERNSHIP')) return 'Internship';
  return 'Full-time'; // Default for unknown types
}

function formatSalary(apiJob: ApiJobResponseItem): string | undefined {
  if (!apiJob.job_min_salary && !apiJob.job_max_salary) return undefined;
  
  const formatNumber = (num: number) => num.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const currency = apiJob.job_salary_currency || '';
  let period = '';
  if (apiJob.job_salary_period) {
      const p = apiJob.job_salary_period.toLowerCase();
      if (p !== 'yearly' && p !== 'annum') { // Only add period if not yearly, as yearly is often implied
        period = ` per ${p.replace('ly', '')}`; // hourly -> hour
      }
  }
  
  if (apiJob.job_min_salary && apiJob.job_max_salary) {
    return `${formatNumber(apiJob.job_min_salary)} - ${formatNumber(apiJob.job_max_salary)} ${currency}${period}`;
  }
  if (apiJob.job_min_salary) return `${formatNumber(apiJob.job_min_salary)} ${currency}${period}`;
  if (apiJob.job_max_salary) return `${formatNumber(apiJob.job_max_salary)} ${currency}${period}`;
  return undefined;
}

function getPostedDate(apiJob: ApiJobResponseItem): string {
  if (apiJob.job_posted_at_datetime_utc) {
    try {
      return new Date(apiJob.job_posted_at_datetime_utc).toISOString();
    } catch (e) { /* ignore invalid date */ }
  }
  if (apiJob.job_posted_at_timestamp) {
    try {
      // JSearch timestamp is in seconds, convert to milliseconds
      return new Date(apiJob.job_posted_at_timestamp * 1000).toISOString();
    } catch (e) { /* ignore invalid date */ }
  }
  // Fallback to current date if parsing fails or no date provided from API
  // This helps ensure the 'postedDate' field is always a valid ISO string
  return new Date().toISOString(); 
}

export async function fetchRealTimeJobs(filters: FilterCriteria, limit: number = 20): Promise<Job[]> {
  if (!API_KEY || API_KEY === 'your_actual_jsearch_api_key_here' || API_KEY.trim() === '') {
    console.error('JOB_SEARCH_API_KEY is not set or is still the placeholder in .env file. Please obtain a valid API key for JSearch from RapidAPI.');
    console.warn("Returning empty job list. Configure API key for real job data.");
    return [];
  }
   if (API_BASE_URL === 'https://jsearch.p.rapidapi.com' && API_HOST === 'jsearch.p.rapidapi.com' && (API_KEY === 'your_actual_api_key_here' || !API_KEY)) { // Redundant check, but safe
     console.warn('Using placeholder API URL/Host or missing API Key for JSearch. Please configure `JOB_SEARCH_API_KEY` in .env for real job data. Service will return empty array.');
     return [];
  }

  let queryParts = [];
  if (filters.keyword) queryParts.push(filters.keyword);
  
  let locationQuery = "";
  // Prioritize detailed location fields if provided
  if (filters.area) locationQuery = `${filters.area}`;
  if (filters.city) locationQuery = `${filters.city}${filters.area ? `, ${filters.area}` : ''}`;
  if (filters.state) locationQuery = `${filters.state}${filters.city ? `, ${filters.city}` : ''}${filters.area ? `, ${filters.area}` : ''}`;
  if (filters.country) locationQuery = `${filters.country}${filters.state ? `, ${filters.state}` : ''}${filters.city ? `, ${filters.city}` : ''}${filters.area ? `, ${filters.area}` : ''}`;
  
  if (!locationQuery || filters.location?.toLowerCase().includes('remote')) {
    if (filters.location && filters.location !== 'All Locations' && filters.location.toLowerCase() !== 'worldwide') {
        locationQuery = filters.location; 
    }
  }
  
  if (locationQuery && locationQuery.toLowerCase() !== 'worldwide' && locationQuery.toLowerCase() !== 'all locations' && !locationQuery.toLowerCase().includes('remote (global)')) {
      queryParts.push(locationQuery); // JSearch query format often "keyword location" e.g. "React Developer New York"
  }
  
  const query = queryParts.join(' ') || 'Software Developer Worldwide'; // Default if query is empty


  const queryParams = new URLSearchParams({
    query: query,
    page: '1',
    num_pages: '1', // JSearch usually returns ~40 results per page with num_pages=1. Adjust if more needed.
    date_posted: 'month', // Fetch jobs posted in the last month by default
  });

  if (filters.jobTypes && filters.jobTypes.length > 0) {
    // JSearch expects comma-separated, uppercase employment types
    const apiJobTypes = filters.jobTypes.map(jt => {
        switch(jt) {
            case 'Full-time': return 'FULLTIME';
            case 'Part-time': return 'PARTTIME';
            case 'Contract': return 'CONTRACTOR';
            case 'Internship': return 'INTERN';
            default: return jt.toUpperCase().replace(' ', '_'); // Fallback
        }
    }).join(',');
    queryParams.append('employment_types', apiJobTypes);
  }

  if (locationQuery.toLowerCase().includes('remote (usa only)')) {
    queryParams.append('remote_jobs_only', 'true');
    // JSearch doesn't have a direct filter for "remote USA only" in a single param usually.
    // The query "Remote USA" is often the best bet. The locationQuery part already adds "Remote (USA Only)".
  } else if (locationQuery.toLowerCase().includes('remote')) {
     queryParams.append('remote_jobs_only', 'true');
  }


  const endpoint = `${API_BASE_URL}/search`;

  try {
    console.log(`Fetching jobs from JSearch: ${endpoint} with query: ${queryParams.toString()}`);
    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`JSearch API Error ${response.status}: ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch jobs from JSearch (${response.status}): ${errorBody || response.statusText}`);
    }

    const result = await response.json();
    const apiJobs: ApiJobResponseItem[] = result.data || []; 

    if (!apiJobs || apiJobs.length === 0) {
      console.log("No jobs found from JSearch API for the given query.");
      return [];
    }

    return apiJobs.slice(0, limit).map((apiJob): Job => ({
      id: apiJob.job_id || crypto.randomUUID(),
      title: apiJob.job_title || 'N/A',
      company: apiJob.employer_name || 'N/A',
      description: apiJob.job_description || 'No description available.',
      location: apiJob.job_is_remote 
        ? (apiJob.job_city || apiJob.job_state || apiJob.job_country ? `Remote (${apiJob.job_city || ''}${apiJob.job_city && (apiJob.job_state || apiJob.job_country) ? ', ' : ''}${apiJob.job_state || ''}${apiJob.job_state && apiJob.job_country ? ', ' : ''}${apiJob.job_country || ''})`.replace(/\(\s*,*\s*\)/g, '(Global)') : 'Remote (Global)')
        : `${apiJob.job_city ? apiJob.job_city + ', ' : ''}${apiJob.job_state ? apiJob.job_state + ', ' : ''}${apiJob.job_country || 'Unknown Location'}`,
      type: mapApiJobType(apiJob.job_employment_type),
      url: apiJob.job_apply_link || '#',
      postedDate: getPostedDate(apiJob),
      salary: formatSalary(apiJob),
      equity: apiJob.job_highlights?.Benefits?.some(b => typeof b === 'string' && b.toLowerCase().includes('equity')) || false,
    }));

  } catch (error) {
    console.error('Error in fetchRealTimeJobs (JSearch):', error);
    if (error instanceof Error && (error.message.includes('API Key is missing') || error.message.includes('JOB_SEARCH_API_KEY is not set'))) {
      // Already handled, or handle more gracefully
    } else {
       // Re-throw other errors to be caught by the calling page
       throw error;
    }
    return []; // Fallback to empty array on error
  }
}

    

import type { Job, JobType } from '@/types';

const today = new Date();
const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(today.getDate() - 7);
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(today.getDate() - 15);
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);
const fortyFiveDaysAgo = new Date();
fortyFiveDaysAgo.setDate(today.getDate() - 45);


export const mockJobs: Job[] = [
  // USA
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Innovatech Solutions',
    description: 'Join our dynamic team to build next-generation web applications using React, Next.js, and TypeScript. Strong focus on UI/UX and performance.',
    location: 'New York, NY, USA',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/innovatech-frontend-ny',
    postedDate: twoDaysAgo.toISOString(),
    salary: '$120,000 - $150,000 USD',
    equity: true,
  },
  {
    id: '2',
    title: 'Product Manager, AI Platforms',
    company: 'FutureTech Corp',
    description: 'Lead the product vision, strategy, and execution for our AI-powered platform. Work closely with engineering, design, and marketing teams.',
    location: 'San Francisco, CA, USA',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/futuretech-pm-sf',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$130,000 - $160,000 USD',
  },
  {
    id: '7',
    title: 'Data Scientist, Machine Learning',
    company: 'Alpha Analytics',
    description: 'Analyze large datasets to extract meaningful insights and build predictive models. Strong Python, R, and SQL skills needed. Focus on NLP projects.',
    location: 'Seattle, WA, USA',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/alpha-ds-seattle',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$140,000 - $170,000 USD',
    equity: true,
  },
  {
    id: '8',
    title: 'Customer Support Lead',
    company: 'HelpNow Services',
    description: 'Lead a team of customer support representatives. Develop training materials and improve support processes. Patience and problem-solving skills are key.',
    location: 'Austin, TX, USA',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/helpnow-supportlead-austin',
    postedDate: twoDaysAgo.toISOString(),
    salary: '$75,000 - $90,000 USD',
  },
   {
    id: '20',
    title: 'DevOps Engineer',
    company: 'CloudNet Dynamics',
    description: 'Manage and automate our cloud infrastructure on AWS. Experience with Kubernetes, Terraform, and CI/CD pipelines essential.',
    location: 'Chicago, IL, USA',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/cloudnet-devops-chicago',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$110,000 - $140,000 USD',
  },

  // UK
  {
    id: '5',
    title: 'Backend Developer (Node.js & Python)',
    company: 'ServerSystems Ltd.',
    description: 'Develop and maintain scalable backend services using Node.js, Python, Express, and PostgreSQL. Experience with microservices and Azure is a plus.',
    location: 'London, UK',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/serversystems-backend-london',
    postedDate: twoDaysAgo.toISOString(),
    salary: '£60,000 - £80,000 GBP',
    equity: false,
  },
  {
    id: '21',
    title: 'Cybersecurity Analyst',
    company: 'SecureSoft Solutions',
    description: 'Monitor security threats, conduct vulnerability assessments, and respond to incidents. CISSP or similar certification preferred.',
    location: 'Manchester, UK',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/securesoft-cyber-manchester',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '£50,000 - £70,000 GBP',
  },

  // Canada
  {
    id: '22',
    title: 'Mobile App Developer (iOS/Android)',
    company: 'AppWorks Canada',
    description: 'Design and build advanced applications for the iOS and Android platforms. Proficient in Swift, Kotlin, and React Native.',
    location: 'Toronto, ON, Canada',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/appworks-mobile-toronto',
    postedDate: thirtyDaysAgo.toISOString(),
    salary: '$90,000 - $120,000 CAD',
  },
  {
    id: '23',
    title: 'Game Developer (Unity)',
    company: 'PixelPlay Studios',
    description: 'Join our team to create exciting new mobile and PC games using Unity Engine. Strong C# skills and passion for gaming required.',
    location: 'Vancouver, BC, Canada',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/pixelplay-gamedev-vancouver',
    postedDate: twoDaysAgo.toISOString(),
    salary: '$85,000 - $110,000 CAD',
    equity: true,
  },

  // Germany
  {
    id: '24',
    title: 'Cloud Architect (Azure/GCP)',
    company: 'CloudStratus GmbH',
    description: 'Design and implement cloud solutions for enterprise clients on Azure and GCP. Deep understanding of cloud services and best practices.',
    location: 'Berlin, Germany',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/cloudstratus-architect-berlin',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '€80,000 - €110,000 EUR',
  },
  {
    id: '25',
    title: 'AI Research Scientist',
    company: 'IntelliForce AI',
    description: 'Conduct cutting-edge research in machine learning, particularly in computer vision and reinforcement learning. PhD required.',
    location: 'Munich, Germany',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/intelliforce-research-munich',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '€90,000 - €120,000 EUR',
  },

  // India
  {
    id: '26',
    title: 'Full Stack Developer (MERN)',
    company: 'TechLeap India',
    description: 'Develop web applications using MongoDB, Express.js, React, and Node.js. Looking for candidates with 3+ years of experience.',
    location: 'Bangalore, India',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/techleap-fullstack-bangalore',
    postedDate: thirtyDaysAgo.toISOString(),
    salary: '₹1,500,000 - ₹2,500,000 INR per annum',
  },
  {
    id: '27',
    title: 'QA Automation Engineer',
    company: 'QualityFirst Software',
    description: 'Design and implement automated test scripts using Selenium, Appium, and TestNG. Strong understanding of QA methodologies.',
    location: 'Pune, India',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/qualityfirst-qa-pune',
    postedDate: twoDaysAgo.toISOString(),
    salary: '₹1,200,000 - ₹2,000,000 INR per annum',
  },

  // Australia
  {
    id: '28',
    title: 'Digital Marketing Manager',
    company: 'OzzieConnect Digital',
    description: 'Lead digital marketing strategies including SEO, PPC, social media, and email marketing. Proven track record of successful campaigns.',
    location: 'Sydney, Australia',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/ozzieconnect-marketing-sydney',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$90,000 - $120,000 AUD',
  },

  // Singapore
  {
    id: '29',
    title: 'Fintech Business Analyst',
    company: 'SG Finance Solutions',
    description: 'Bridge the gap between business needs and technology solutions in the fintech space. Experience with payment systems and regulatory compliance.',
    location: 'Singapore',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/sgfinance-ba-singapore',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$80,000 - $110,000 SGD',
  },

  // Japan
  {
    id: '30',
    title: 'Robotics Engineer',
    company: 'RoboCorp Japan',
    description: 'Design, build, and test robotic systems for industrial automation. Experience with ROS, C++, and Python.',
    location: 'Tokyo, Japan',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/robocorp-robotics-tokyo',
    postedDate: thirtyDaysAgo.toISOString(),
    salary: '¥7,000,000 - ¥10,000,000 JPY per annum',
  },

  // France
  {
    id: '31',
    title: 'UX Researcher',
    company: 'UserFirst Labs Paris',
    description: 'Conduct user research, usability testing, and data analysis to inform product design decisions. Passion for understanding user behavior.',
    location: 'Paris, France',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/userfirst-uxr-paris',
    postedDate: twoDaysAgo.toISOString(),
    salary: '€55,000 - €75,000 EUR',
  },
  
  // Remote / Global
  {
    id: '3',
    title: 'UX/UI Designer (Web & Mobile)',
    company: 'Creative Minds Global',
    description: 'Design intuitive and engaging user experiences for mobile and web applications. Proficiency in Figma, Sketch, and Adobe Creative Suite. Portfolio required.',
    location: 'Remote (Global)',
    type: 'Contract',
    url: 'https://jobs.example.com/job/creativeminds-uxui-remote',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$60 - $90 USD / hour',
  },
  {
    id: '4',
    title: 'Software Engineering Intern (Python/JS)',
    company: 'Innovatech Solutions (Remote Program)',
    description: 'Exciting remote internship opportunity for aspiring software engineers. Gain hands-on experience with modern web technologies, Python, and JavaScript.',
    location: 'Remote (USA preferred)',
    type: 'Internship',
    url: 'https://jobs.example.com/job/innovatech-intern-remote',
    postedDate: thirtyDaysAgo.toISOString(),
    salary: '$25 - $35 USD / hour (stipend)',
  },
  {
    id: '6',
    title: 'Content Marketing Specialist (Tech)',
    company: 'Growth Hackers Worldwide',
    description: 'Plan and execute content marketing campaigns for tech clients. SEO, technical writing, and social media skills required.',
    location: 'Remote (Anywhere)',
    type: 'Part-time',
    url: 'https://jobs.example.com/job/growthhackers-content-remote',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$30 - $50 USD / hour',
  },
   {
    id: '32',
    title: 'Technical Writer (SaaS)',
    company: 'DocuPerfect Inc.',
    description: 'Create clear, concise, and comprehensive documentation for SaaS products, including API guides, tutorials, and user manuals.',
    location: 'Remote (Europe Timezones)',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/docuperfect-writer-remote-eu',
    postedDate: fortyFiveDaysAgo.toISOString(),
    salary: '€50,000 - €70,000 EUR',
  },
  {
    id: '33',
    title: 'Community Manager (Gaming)',
    company: 'Nexus Gaming Collective',
    description: 'Engage with and grow our online gaming community across Discord, Reddit, and social media. Passion for gaming and excellent communication skills.',
    location: 'Remote (North America Timezones)',
    type: 'Contract',
    url: 'https://jobs.example.com/job/nexusgaming-cm-remote-na',
    postedDate: fifteenDaysAgo.toISOString(),
    salary: '$40 - $60 USD / hour',
  },
  {
    id: '34',
    title: 'Blockchain Developer (Solidity)',
    company: 'DeFiChain Labs',
    description: 'Develop and deploy smart contracts on Ethereum and other EVM-compatible chains. Strong experience with Solidity, Hardhat/Truffle, and Web3.js/Ethers.js.',
    location: 'Remote (Global)',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/defichain-blockchain-remote',
    postedDate: sevenDaysAgo.toISOString(),
    salary: '$100,000 - $150,000 USD (or crypto equivalent)',
    equity: true,
  },
   {
    id: '35',
    title: 'Head of Remote Operations',
    company: 'WorkAnywhere Corp',
    description: 'Oversee and optimize all operational aspects of a fully remote company. Experience in managing distributed teams and developing remote-first policies.',
    location: 'Remote (Global)',
    type: 'Full-time',
    url: 'https://jobs.example.com/job/workanywhere-ops-remote',
    postedDate: twoDaysAgo.toISOString(),
    salary: '$130,000 - $180,000 USD',
  },
];

export const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

// Enhanced global locations list
export const locations: string[] = [
  'All Locations',
  'Remote (Global)',
  'Remote (USA Only)',
  'Remote (Europe Only)',
  'Remote (North America)',
  // USA
  'New York, NY, USA',
  'San Francisco, CA, USA',
  'Austin, TX, USA',
  'Seattle, WA, USA',
  'Boston, MA, USA',
  'Chicago, IL, USA',
  'Los Angeles, CA, USA',
  'Washington D.C., USA',
  'Silicon Valley, CA, USA',
  'Atlanta, GA, USA',
  'Denver, CO, USA',
  'Miami, FL, USA',
  'Raleigh, NC, USA',
  // UK
  'London, UK',
  'Manchester, UK',
  'Cambridge, UK',
  'Edinburgh, UK',
  'Bristol, UK',
  'Birmingham, UK',
  'Oxford, UK',
  // Canada
  'Toronto, ON, Canada',
  'Vancouver, BC, Canada',
  'Montreal, QC, Canada',
  'Waterloo, ON, Canada',
  'Calgary, AB, Canada',
  'Ottawa, ON, Canada',
  // Germany
  'Berlin, Germany',
  'Munich, Germany',
  'Hamburg, Germany',
  'Frankfurt, Germany',
  'Cologne, Germany',
  'Stuttgart, Germany',
  // India
  'Bangalore, India',
  'Hyderabad, India',
  'Pune, India',
  'Gurgaon, India',
  'Mumbai, India',
  'Chennai, India',
  'Noida, India',
  // Japan
  'Tokyo, Japan',
  'Osaka, Japan',
  'Kyoto, Japan',
  'Fukuoka, Japan',
  'Yokohama, Japan',
  // Australia
  'Sydney, Australia',
  'Melbourne, Australia',
  'Brisbane, Australia',
  'Perth, Australia',
  'Canberra, Australia',
  // Singapore
  'Singapore',
  // France
  'Paris, France',
  'Lyon, France',
  'Marseille, France',
  'Nice, France',
  // Netherlands
  'Amsterdam, Netherlands',
  'Rotterdam, Netherlands',
  'Utrecht, Netherlands',
  'The Hague, Netherlands',
  // China
  'Beijing, China',
  'Shanghai, China',
  'Shenzhen, China',
  'Hangzhou, China',
  // Brazil
  'Sao Paulo, Brazil',
  'Rio de Janeiro, Brazil',
  'Belo Horizonte, Brazil',
  // Ireland
  'Dublin, Ireland',
  'Cork, Ireland',
  // Switzerland
  'Zurich, Switzerland',
  'Geneva, Switzerland',
  'Lausanne, Switzerland',
  // Sweden
  'Stockholm, Sweden',
  'Gothenburg, Sweden',
  // Israel
  'Tel Aviv, Israel',
  // UAE
  'Dubai, UAE',
  // South Korea
  'Seoul, South Korea',
  // Other major hubs
  'Buenos Aires, Argentina',
  'Mexico City, Mexico',
  'Kuala Lumpur, Malaysia',
  'Warsaw, Poland',
  'Prague, Czech Republic',
  'Vienna, Austria',
  'Barcelona, Spain',
  'Madrid, Spain',
  'Milan, Italy',
  'Rome, Italy',
];

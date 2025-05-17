
import Link from 'next/link';
import { Briefcase, Wand2, Lightbulb, FileScan, Mail, Brain, MessageSquare } from 'lucide-react'; // Added MessageSquare

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Briefcase className="h-7 w-7" />
          <h1 className="text-2xl font-semibold">Career Compass</h1>
        </Link>
        <nav className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm flex-wrap justify-end">
          <Link href="/" className="font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            Jobs
          </Link>
          <Link href="/ai-search" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Wand2 className="h-4 w-4" />
            AI&nbsp;Search
          </Link>
          <Link href="/resume-analyzer" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <FileScan className="h-4 w-4" />
            Resume&nbsp;AI
          </Link>
          <Link href="/cover-letter-generator" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Mail className="h-4 w-4" />
            Cover&nbsp;Letter&nbsp;AI
          </Link>
          <Link href="/skill-gap-analyzer" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Brain className="h-4 w-4" />
            Skill&nbsp;Gap&nbsp;AI
          </Link>
          <Link href="/mock-interview" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <MessageSquare className="h-4 w-4" /> {/* Icon for Mock Interview */}
            Mock&nbsp;Interview
          </Link>
          <Link href="/guidance" className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
            <Lightbulb className="h-4 w-4" />
            Guidance
          </Link>
        </nav>
      </div>
    </header>
  );
}

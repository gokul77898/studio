import Link from 'next/link';
import { Briefcase } from 'lucide-react'; // Or a more generic 'Compass' icon if available

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Briefcase className="h-7 w-7" />
          <h1 className="text-2xl font-semibold">Career Compass</h1>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Jobs
          </Link>
          <Link href="/guidance" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Guidance
          </Link>
        </nav>
      </div>
    </header>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Nav() {
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-xl font-bold">
              AI Tutor
            </Button>
          </Link>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">Subjects</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

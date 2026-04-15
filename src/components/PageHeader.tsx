import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import appLogo from "@/assets/app-logo.png";
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  children?: React.ReactNode;
}
export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backTo,
  children,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (backTo) return;
    navigate(-1);
  };
  const BackElement = backTo ? (
    <Link to={backTo} className="p-2 hover:bg-muted rounded-lg transition-colors">
      <ArrowLeft className="h-5 w-5" />
    </Link>
  ) : (
    <button onClick={handleBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
  return (
    <header className="sticky top-0 z-[60] bg-background border-b border-border/50 before:absolute before:top-[-100px] before:left-0 before:right-0 before:h-[100px] before:bg-background" style={{ isolation: 'isolate', paddingTop: 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))' }}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && BackElement}
          <img src={appLogo} alt="Red Vitalium" className="h-8 w-auto" />
          <div>
            <span className="text-lg font-display font-bold text-primary">{title}</span>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell, User, LogOut, LogIn, Shield, ArrowLeftRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import { RoleSelectionDialog } from "@/components/admin/RoleSelectionDialog";
import vitaliumLogo from "@/assets/vitalium-logo.png";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tests", href: "/tests" },
  { label: "Citas", href: "/appointments" },
  { label: "Recordatorios", href: "/reminders" },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { 
    isViewingAsAdmin, 
    selectedPatient, 
    setSelectedPatient,
    currentMode,
    setCurrentMode,
    shouldShowRoleSelection,
    setShouldShowRoleSelection,
    resetMode
  } = useAdminMode();

  // Show role selection dialog when admin logs in
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    if (shouldShowRoleSelection && isAdmin && user) {
      setShowRoleDialog(true);
    }
  }, [shouldShowRoleSelection, isAdmin, user]);

  const handleSignOut = async () => {
    resetMode();
    await signOut();
    navigate('/');
  };

  const handleSwitchMode = () => {
    if (currentMode === 'admin') {
      setCurrentMode('patient');
      setSelectedPatient(null);
      navigate('/dashboard');
    } else {
      setCurrentMode(null);
      setShouldShowRoleSelection(true);
      setShowRoleDialog(true);
    }
  };

  const handleChangePatient = () => {
    navigate('/admin/select-patient');
  };

  const allNavItems = isAdmin 
    ? [...navItems, { label: "Admin", href: "/admin" }] 
    : navItems;

  return (
    <>
      {/* Admin Viewing Banner */}
      <AnimatePresence>
        {isViewingAsAdmin && selectedPatient && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-accent text-accent-foreground overflow-hidden"
          >
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                <span>
                  Viendo como: <strong>{selectedPatient.fullName}</strong>
                  {selectedPatient.email && (
                    <span className="text-accent-foreground/70 ml-1">({selectedPatient.email})</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-accent-foreground hover:bg-accent-foreground/10"
                  onClick={handleChangePatient}
                >
                  <UserCircle className="h-4 w-4 mr-1" />
                  Cambiar paciente
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-accent-foreground hover:bg-accent-foreground/10"
                  onClick={() => {
                    setSelectedPatient(null);
                    setCurrentMode('patient');
                    navigate('/dashboard');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Salir de vista admin
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={vitaliumLogo}
                alt="Vitalium Logo"
                className="h-14 w-auto transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-display font-bold text-primary">Vitalium</h1>
                <p className="text-xs text-muted-foreground">Salud, Rendimiento y Longevidad</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {user && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => navigate('/notification-settings')}
                >
                  <Bell className="h-5 w-5" />
                </Button>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSwitchMode}>
                          <ArrowLeftRight className="h-4 w-4 mr-2" />
                          {currentMode === 'admin' ? 'Cambiar a mi dashboard' : 'Cambiar modo'}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-card border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {allNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="justify-start px-4 py-3 h-auto"
                    onClick={() => {
                      handleSwitchMode();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {currentMode === 'admin' ? 'Cambiar a mi dashboard' : 'Cambiar modo'}
                  </Button>
                )}
                
                {user ? (
                  <Button 
                    variant="ghost" 
                    className="justify-start px-4 py-3 h-auto"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="justify-start px-4 py-3 h-auto"
                    onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Role Selection Dialog */}
      <RoleSelectionDialog 
        open={showRoleDialog} 
        onOpenChange={(open) => {
          setShowRoleDialog(open);
          if (!open && currentMode === null) {
            // If they closed the dialog without choosing, default to patient mode
            setCurrentMode('patient');
            setShouldShowRoleSelection(false);
          }
        }}
      />
    </>
  );
}

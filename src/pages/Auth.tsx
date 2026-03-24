import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Lock, User, Fingerprint, Apple } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';
import { InformedConsentDialog } from '@/components/InformedConsentDialog';

export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  
  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      toast.error('Error al iniciar sesión', { description: error.message });
    } else {
      toast.success('¡Bienvenido de vuelta!');
      navigate('/home');
    }
    
    setLoading(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Show informed consent before creating the account
    setShowConsent(true);
  };

  const handleConsentAccepted = async ({ generalConsent, researchConsent }: { generalConsent: boolean; researchConsent: boolean }) => {
    setShowConsent(false);
    setLoading(true);
    
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName);
    
    if (error) {
      toast.error('Error al registrarse', { description: error.message });
      setLoading(false);
      return;
    }

    // BUG 2 FIX: Check if we actually have a session after signup.
    // If email confirmation is enabled in Supabase, signUp succeeds but
    // there's no active session yet → navigating to /home would bounce
    // the user back to /auth via ProtectedRoute (user = null).
    //
    // If email confirmation is DISABLED (recommended for Gen Zero),
    // the session is immediately active and navigate('/home') works.
    //
    // We import supabase here just for the session check:
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // Save research consent if accepted
      if (researchConsent) {
        await supabase.from('profiles')
          .update({ 
            research_consent: true, 
            research_consent_at: new Date().toISOString() 
          })
          .eq('user_id', session.user.id);
      }
      // Email confirmation is disabled — session is active, go to home
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/home');
    } else {
      // Email confirmation is enabled — no session yet
      // Show a friendly message instead of navigating to a protected route
      toast.success('¡Cuenta creada exitosamente!', { 
        description: '¡Revisa tu correo! Te enviamos un enlace de confirmación.',
        duration: 8000,
      });
      // Stay on /auth so user can check email and come back to sign in
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast.error('Error con Google', { description: error.message });
      setLoading(false);
    }
    // Note: Google OAuth redirects the browser, so no navigate() needed here.
    // The redirectTo in useAuth.tsx handles where the user lands after OAuth.
  };

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) {
      toast.error('Biometría no soportada', { 
        description: 'Tu navegador no soporta autenticación biométrica.' 
      });
      return;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        toast.error('Biometría no disponible', { 
          description: 'Por favor, usa otro método de autenticación.' 
        });
        return;
      }

      toast.info('Biometría', { 
        description: 'La autenticación biométrica requiere una cuenta existente. Por favor, inicia sesión primero para configurarla.' 
      });
    } catch (error) {
      toast.error('Error de biometría', { 
        description: 'No se pudo acceder a la autenticación biométrica.' 
      });
    }
  };

  return (
    <>
      <InformedConsentDialog
        open={showConsent}
        onAccept={handleConsentAccepted}
        onCancel={() => setShowConsent(false)}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary via-secondary/95 to-primary/90 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.img
                src={appLogo}
                alt="Red Vitalium"
                className="h-24 w-auto mx-auto"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              />
              <div>
                <CardTitle className="text-2xl font-display">Bienvenido a Red Vitalium</CardTitle>
                <CardDescription>Longevidad y Bienestar Basado en Datos</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="signup">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="flex items-center justify-center gap-3 w-full h-[44px] rounded-[4px] border border-[#DADCE0] bg-[#FFFFFF] hover:bg-[#F8F9FA] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      <span style={{ fontFamily: "'Roboto', system-ui, sans-serif", color: '#3C4043', fontSize: '14px', fontWeight: 500 }}>
                        Continuar con Google
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAppleSignIn}
                      disabled={loading}
                      className="flex items-center justify-center gap-3 w-full h-[44px] rounded-[4px] bg-[#000000] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span style={{ fontFamily: "system-ui, sans-serif", color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>
                        Continuar con Apple
                      </span>
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nombre Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Tu nombre"
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          className="pl-10"
                          minLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">O regístrate con</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toast.info('Apple Sign-In', { description: 'Próximamente disponible' })}
                      disabled={loading}
                      className="w-full"
                    >
                      <Apple className="h-4 w-4 mr-2" />
                      Apple
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

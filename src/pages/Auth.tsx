import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';
import { InformedConsentDialog } from '@/components/InformedConsentDialog';
import { supabase } from '@/integrations/supabase/custom-client';
import { Capacitor } from '@capacitor/core';

const REMEMBER_KEY = 'rv_remember_email';

async function loadRememberedEmail(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: REMEMBER_KEY });
      return value || '';
    } catch { return ''; }
  }
  try { return localStorage.getItem(REMEMBER_KEY) || ''; } catch { return ''; }
}

async function saveRememberedEmail(email: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: REMEMBER_KEY, value: email });
    } catch {}
  }
  try { localStorage.setItem(REMEMBER_KEY, email); } catch {}
}

async function clearRememberedEmail() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key: REMEMBER_KEY });
    } catch {}
  }
  try { localStorage.removeItem(REMEMBER_KEY); } catch {}
}

function ForgotPasswordForm() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      toast.error('Error al enviar el correo', { description: error.message });
    } else {
      setSent(true);
      toast.success('¡Correo enviado!', {
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
        duration: 6000,
      });
    }
    setSending(false);
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="w-full text-center text-sm text-primary hover:underline mt-2"
      >
        ¿Olvidaste tu contraseña?
      </button>
    );
  }

  if (sent) {
    return (
      <div className="text-center text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
        <Mail className="h-5 w-5 mx-auto mb-2 text-primary" />
        Revisa tu correo electrónico para restablecer tu contraseña.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 p-3 bg-muted/30 rounded-lg">
      <p className="text-sm text-muted-foreground">Ingresa tu email para recibir un enlace de recuperación:</p>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar enlace'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShow(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PasswordInput({ id, value, onChange, placeholder = '••••••••', ...props }: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  [key: string]: any;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value: savedEmail } = await Preferences.get({ key: 'vitalium_email' });
        const { value: savedPassword } = await Preferences.get({ key: 'vitalium_password' });
        const { value: savedRemember } = await Preferences.get({ key: 'vitalium_remember' });
        if (savedRemember === 'true' && savedEmail) {
          setSignInEmail(savedEmail);
          if (savedPassword) setSignInPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log('Could not load saved credentials');
      }
    };
    loadSaved();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      toast.error('Error al iniciar sesión', { description: error.message });
    } else {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        if (rememberMe) {
          await Preferences.set({ key: 'vitalium_email', value: signInEmail });
          await Preferences.set({ key: 'vitalium_password', value: signInPassword });
          await Preferences.set({ key: 'vitalium_remember', value: 'true' });
        } else {
          await Preferences.remove({ key: 'vitalium_email' });
          await Preferences.remove({ key: 'vitalium_password' });
          await Preferences.remove({ key: 'vitalium_remember' });
        }
      } catch (e) {}
      toast.success('¡Bienvenido de vuelta!');
      navigate('/home');
    }
    
    setLoading(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
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

    const { supabase } = await import('@/integrations/supabase/custom-client');
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      if (researchConsent) {
        await supabase.from('profiles')
          .update({ 
            research_consent: true, 
            research_consent_at: new Date().toISOString() 
          })
          .eq('user_id', session.user.id);
      }
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/home');
    } else {
      toast.success('¡Cuenta creada exitosamente!', { 
        description: '¡Revisa tu correo! Te enviamos un enlace de confirmación.',
        duration: 8000,
      });
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
  };

  const handleAppleSignIn = () => {
    toast.info('Apple Sign-In', { description: 'Apple Sign-In disponible próximamente' });
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
                      <PasswordInput
                        id="signin-password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                        Recordarme
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>

                  <ForgotPasswordForm />

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
                      <PasswordInput
                        id="signup-password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        minLength={6}
                        required
                      />
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
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

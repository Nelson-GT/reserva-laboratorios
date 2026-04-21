import { Microscope } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión — Lab Manager UJAP',
};

interface Props {
  searchParams: Promise<{ verified?: string; msg?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white">Lab Manager</h1>
            <p className="text-blue-300 text-sm">Universidad José Antonio Páez</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Iniciar sesión</h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {sp.verified === '1' && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
            ¡Correo verificado! Tu cuenta está pendiente de aprobación por el
            administrador.
          </div>
        )}

        <LoginForm />

        <p className="text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <a
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}

import { Microscope } from 'lucide-react';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Crear cuenta — Lab Manager UJAP',
};

export default function RegisterPage() {
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
          <h2 className="text-xl font-semibold text-slate-900">Crear cuenta</h2>
          <p className="text-sm text-slate-500 mt-1">
            Completa el formulario. El administrador validará tu identidad antes
            de activar tu cuenta.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <a
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}

import { Microscope, MailCheck } from 'lucide-react';
import { OtpForm } from '@/components/auth/otp-form';

export const metadata = {
  title: 'Verificar código — Lab Manager UJAP',
};

interface Props {
  searchParams: Promise<{ msg?: string }>;
}

export default async function VerifyOtpPage({ searchParams }: Props) {
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
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Verifica tu correo
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Hemos enviado un código de 6 dígitos a tu correo electrónico.
              Ingresa el código para continuar.
            </p>
          </div>
        </div>

        {sp.msg === 'email_unverified' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
            Tu correo no estaba verificado. Te enviamos un nuevo código.
          </div>
        )}

        <OtpForm />

        <p className="text-center text-sm text-slate-500">
          <a href="/login" className="text-blue-600 hover:underline">
            Volver al inicio de sesión
          </a>
        </p>
      </div>
    </div>
  );
}

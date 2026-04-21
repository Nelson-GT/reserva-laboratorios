'use client';

import { useActionState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { verifyOtpAction, resendOtpAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useState } from 'react';

const initialState = { error: undefined, success: undefined };

export function OtpForm() {
  const [verifyState, verifyAction, isVerifying] = useActionState(
    verifyOtpAction,
    initialState
  );
  const [resendState, resendAction, isResending] = useActionState(
    resendOtpAction,
    initialState
  );
  const [otpValue, setOtpValue] = useState('');

  return (
    <div className="space-y-6">
      <form action={verifyAction} className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={setOtpValue}
            name="code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {/* Hidden input con el valor real para el server action */}
          <input type="hidden" name="code" value={otpValue} />
        </div>

        {verifyState?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
            {verifyState.error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isVerifying || otpValue.length < 6}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar código'
          )}
        </Button>
      </form>

      {/* Reenviar */}
      <form action={resendAction} className="text-center">
        {resendState?.success && (
          <p className="text-green-600 text-sm mb-2">{resendState.success}</p>
        )}
        {resendState?.error && (
          <p className="text-red-600 text-sm mb-2">{resendState.error}</p>
        )}
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isResending}
          className="text-slate-500 hover:text-slate-700"
        >
          {isResending ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          Reenviar código
        </Button>
      </form>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { registerAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState = { error: undefined, success: undefined };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Juan García"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cedula">Cédula de identidad</Label>
        <Input
          id="cedula"
          name="cedula"
          type="text"
          placeholder="12345678"
          required
          inputMode="numeric"
          pattern="\d{6,10}"
          title="Solo números, entre 6 y 10 dígitos"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="correo@ujap.edu.ve"
          required
          autoComplete="email"
        />
        <p className="text-xs text-slate-400">
          Se recomienda usar tu correo institucional (@ujap.edu.ve).
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          required
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecciona tu rol</option>
          <option value="professor">Docente</option>
          <option value="student">Estudiante</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          'Crear cuenta'
        )}
      </Button>
    </form>
  );
}

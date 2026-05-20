import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const wb = XLSX.utils.book_new();

  const headers = ['Nombre Completo', 'Cédula', 'Correo Electrónico', 'Contraseña', 'Rol'];
  const sample = ['María López Pérez', '12345678', 'maria.lopez@ujap.edu.ve', 'Clave1234!', 'estudiante'];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

  const instrData = [
    ['Campo', 'Obligatorio', 'Descripción', 'Valores válidos'],
    ['Nombre Completo', 'Sí', 'Nombre y apellido completo', 'Texto de 3 a 100 caracteres'],
    ['Cédula', 'Sí', 'Número de cédula (solo dígitos)', '6 a 10 dígitos numéricos, único'],
    ['Correo Electrónico', 'Sí', 'Correo electrónico del usuario', 'Dirección de correo válida, única'],
    ['Contraseña', 'Sí', 'Contraseña inicial del usuario', 'Mínimo 8 caracteres'],
    ['Rol', 'Sí', 'Rol del usuario en el sistema', '"estudiante" o "docente"'],
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instrData);
  wsI['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 42 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instrucciones');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-usuarios.xlsx"',
    },
  });
}

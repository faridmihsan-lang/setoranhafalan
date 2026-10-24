export function cn(...classes: (string | number | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, timeString?: string): string {
  const d = formatDate(dateString);
  return timeString ? `${d}, ${timeString} WIB` : d;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function getPredikatBadgeStyle(predikat: string): { bg: string; text: string; border: string } {
  if (predikat.includes('Mumtaz') || predikat.startsWith('A')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (predikat.includes('Jayyid Jiddan') || predikat.startsWith('B')) {
    return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
  }
  if (predikat.includes('Jayyid') || predikat.startsWith('C')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  }
  if (predikat.includes('Maqbul') || predikat.startsWith('D')) {
    return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  }
  return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
}

export function getStatusSantriStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'Mutqin':
      return { bg: 'bg-emerald-50 text-emerald-800', text: 'Mutqin (Kuat)' };
    case 'Aktif':
      return { bg: 'bg-blue-50 text-blue-800', text: 'Aktif Menghafal' };
    case 'Perlu Perhatian':
      return { bg: 'bg-amber-50 text-amber-800', text: 'Perlu Perhatian' };
    case 'Izin':
      return { bg: 'bg-slate-100 text-slate-700', text: 'Izin / Cuti' };
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: status };
  }
}

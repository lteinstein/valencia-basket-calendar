'use client';
import { CheckCircle2 } from 'lucide-react';

export default function NotificationToast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-vbc-orange text-black px-4 py-3 rounded-xl shadow-2xl font-bold">
      <CheckCircle2 className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
}
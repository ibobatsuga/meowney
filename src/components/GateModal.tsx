import React, { useState } from 'react';
import { Lock, Unlock, AlertCircle, ShieldCheck } from 'lucide-react';

interface GateModalProps {
  onUnlock: () => void;
  correctPassword?: string;
  isEncrypted?: boolean;
}

export const GateModal: React.FC<GateModalProps> = ({
  onUnlock,
  correctPassword,
  isEncrypted = false
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctPassword) {
      onUnlock();
      return;
    }

    if (password === correctPassword) {
      setError('');
      onUnlock();
    } else {
      setError('Password salah. Silakan coba kembali.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-stone-100 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Lucky Cat JS Logo */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <img 
            src="/lucky-cat.png" 
            alt="Lucky Cat JS" 
            className="w-full h-full object-contain drop-shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Meowney Planner Terkunci
        </h2>

        {/* Honest explanation per PRD FR-24 */}
        <div className="mt-3 bg-amber-50 rounded-2xl p-4 text-left border border-amber-200 text-xs text-amber-900">
          <p className="font-semibold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            Penjelasan Privasi & Keamanan:
          </p>
          {isEncrypted ? (
            <p>
              Data lokal Anda dienkripsi dengan <strong>AES-GCM-256</strong>. Kunci hanya tersimpan di kepala Anda. Kehilangan passphrase berarti data tidak dapat dipulihkan oleh siapa pun.
            </p>
          ) : (
            <p>
              Password ini hanya membatasi akses kasual di perangkat ini agar orang sekitar tidak langsung melihat angka Anda. Seluruh data keuangan tersimpan lokal di browser ini, tanpa akun bank atau server pusat.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 text-left mb-1.5">
              {isEncrypted ? 'Masukkan Passphrase Enkripsi' : 'Masukkan Password Pembuka'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Ketik password..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 text-left font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            Buka Planner
          </button>
        </form>

      </div>
    </div>
  );
};

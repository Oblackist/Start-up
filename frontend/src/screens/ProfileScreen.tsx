import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { updateProfileRequest, verifyProfileOtp, authChangePassword } from '../lib/api';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { MfaSettings } from './MfaSettings';
import { SessionSettings } from './SessionSettings';

export const ProfileScreen: React.FC = () => {
  const { user, refresh } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [profileMfaCode, setProfileMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Modal OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (email && !emailRegex.test(email)) {
      setError('Düzgün və etibarlı e-poçt ünvanı daxil edin');
      return;
    }
    if (!currentPassword) {
      setError('Profil məlumatlarını dəyişmək üçün cari parolu daxil et');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateProfileRequest({
        name,
        current_password: currentPassword,
        ...(user?.mfa_enabled ? { mfa_code: profileMfaCode } : {}),
        ...(email !== user?.email ? { email } : {}),
      });
      setCurrentPassword('');
      setProfileMfaCode('');
      if (res && res.requires_otp) {
        setPendingEmail(email);
        setOtpCode('');
        setShowOtpModal(true);
      } else {
        await refresh();
        setMessage('Profil uğurla yeniləndi!');
      }
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await verifyProfileOtp({ code: otpCode, email: pendingEmail });
      await refresh();
      setShowOtpModal(false);
      setOtpCode('');
      setMessage('E-poçt və profil uğurla təsdiqləndi!');
    } catch (err: any) {
      setError(err.message || 'Kod yanlışdır və ya vaxtı bitib');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authChangePassword({ current_password: currentPassword, new_password: newPassword });
      setMessage('Parol uğurla dəyişdirildi!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Parol dəyişdirilə bilmədi');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 text-slate-800 dark:text-slate-200 relative">
      <h2 className="text-2xl font-bold mb-6">Profil Tənzimləmələri</h2>
      
      {message && <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300">{message}</div>}
      {error && !showOtpModal && <div className="p-3.5 mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300">{error}</div>}

      {/* Şəxsi Məlumatlar Formu */}
      <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 space-y-4">
        <h3 className="text-base font-semibold">Şəxsi Məlumatlar</h3>
        <div>
          <label className="block text-xs font-medium mb-1.5">Ad</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">E-poçt</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Təsdiq üçün cari parol</label>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        {user?.mfa_enabled && (
          <div>
            <label className="block text-xs font-medium mb-1.5">Təzə authenticator kodu</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={profileMfaCode}
              onChange={(e) => setProfileMfaCode(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        )}
        <button 
          type="submit" 
          disabled={submitting}
          className="h-11 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Yadda saxla</span>}
        </button>
      </form>

      <div className="mb-6">
        <MfaSettings />
      </div>

      <div className="mb-6">
        <SessionSettings />
      </div>

      {/* Parol Dəyişmə Formu */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3>Parolu Dəyiş</h3>
        <div>
          <label className="block text-xs font-medium mb-1.5">Cari Parol</label>
          <input 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Yeni Parol</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <button type="submit" className="h-11 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-blue-700 transition-all">Parolu Yenilə</button>
      </form>

      {/* --- PROFİL OTP MODAL PƏNCƏRƏSİ (POP-UP) --- */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand dark:text-blue-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-navy dark:text-white">Yeni E-poçt Təsdiqi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span> ünvanına göndərilən 6 rəqəmli kodu daxil edin <br/>
                <span className="text-[11px] text-amber-500 font-medium">(Test mühiti: Terminalı yoxlayın)</span>
              </p>
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-14 rounded-[14px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-2xl tracking-[10px] font-bold text-navy dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 h-12 rounded-[12px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 rounded-[12px] bg-brand hover:bg-blue-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Yoxlanılır…</span>
                    </>
                  ) : (
                    <span>Təsdiq Et</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// auth.js - نظام المصادقة وإدارة الأعضاء
// ==========================================
import { supabaseClient } from './api.js';
import { state } from './state.js';
import { t, showToast, setLoading } from './utils.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000;
const LOCKOUT_KEY = 'loginLockoutTime';
const ATTEMPTS_KEY = 'loginAttempts';

// --- دوال الحماية من التخمين المتكرر ---
export function isAccountLocked() {
  const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
  if (!lockoutTime) return false;
  if (Date.now() < parseInt(lockoutTime, 10)) {
    const remaining = Math.ceil((parseInt(lockoutTime, 10) - Date.now()) / 60000);
    showToast((state.currentLang === 'ar' ? 'الحساب مقفل. حاول بعد ' : 'Account locked. Try again in ') + remaining + (state.currentLang === 'ar' ? ' دقيقة.' : ' minutes.'), 'error');
    return true;
  }
  localStorage.removeItem(LOCKOUT_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
  return false;
}

export function recordFailedAttempt() {
  let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(attempts));
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION));
    showToast(state.currentLang === 'ar' ? 'محاولات كثيرة. الحساب مقفل 30 دقيقة.' : 'Too many failed attempts. Account locked for 30 minutes.', 'error');
    return true;
  }
  return false;
}

export function resetLoginAttempts() { 
  localStorage.removeItem(ATTEMPTS_KEY); 
  localStorage.removeItem(LOCKOUT_KEY); 
}

// --- جلب المستخدم الحالي ---
export async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;
  return {
    UserID: session.user.id,
    Email: session.user.email,
    Name: session.user.user_metadata?.name || session.user.email.split('@')[0],
    Provider: session.user.app_metadata?.provider || 'supabase',
    Role: 'member'
  };
}

// --- دوال تسجيل الدخول والخروج (مربوطة بـ window لتعمل في HTML) ---
window.logoutUser = async function() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    localStorage.removeItem('medicalUser');
    if(window.updateUserUI) window.updateUserUI(null);
    showToast(t('toastLogout'), 'success');
    if(window.router) window.router('home');
  } catch (err) {
    console.error('خطأ في تسجيل الخروج:', err);
    showToast('خطأ في تسجيل الخروج: ' + err.message, 'error');
  }
};

window.handleGoogleSignIn = async function() {
  if (isAccountLocked()) return;
  const btn = document.getElementById('googleSignInBtn');
  setLoading(btn, true); 

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) throw error;
    resetLoginAttempts();
  } catch (err) { 
    recordFailedAttempt(); 
    showToast(t('toastAuthError') + err.message, 'error'); 
    setLoading(btn, false);
  }
};

window.handleEmailAuth = async function() {
  if (isAccountLocked()) return;
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const btn = document.getElementById('authSubmitBtn');

  if (!email || !password) return;
  setLoading(btn, true);

  try {
    // 1. التقاط رمز Turnstile المخفي في النموذج
    const turnstileResponse = document.querySelector('#emailAuthForm [name="cf-turnstile-response"]');
    const captchaToken = turnstileResponse ? turnstileResponse.value : null;

    // التأكد من أن المستخدم أكمل الكابتشا قبل الإرسال
    if (!captchaToken) {
      throw new Error("يرجى إكمال التحقق الأمني (الكابتشا).");
    }

    if (state.isSignUp) {
      if (!name) { 
        showToast(t('fullName') + ' required', 'error'); 
        setLoading(btn, false); 
        return; 
      }
      
      // 2. إرفاق الكابتشا في عملية إنشاء حساب جديد
      const { data, error } = await supabaseClient.auth.signUp({ 
        email: email, 
        password: password,
        options: { 
          captchaToken: captchaToken, // البصمة الأمنية
          data: { name: name, display_name: name }, 
          emailRedirectTo: window.location.origin 
        }
      });
      if (error) throw error;
      resetLoginAttempts();

      if (data.user) {
        // إرفاق الكابتشا أيضاً في محاولة تسجيل الدخول التلقائي بعد التسجيل
        const { error: loginError } = await supabaseClient.auth.signInWithPassword({ 
          email: email, 
          password: password,
          options: { captchaToken: captchaToken } // البصمة الأمنية
        });
        if (loginError && loginError.message.includes('Email not confirmed')) {
          showToast('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.', 'success');
        } else {
          showToast('تم إنشاء الحساب بنجاح! ' + t('toastAuthSuccess') + name, 'success');
          setTimeout(() => window.router('user-dashboard'), 500);
        }
      }
    } else {
      // 3. إرفاق الكابتشا في عملية تسجيل الدخول العادية
      const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email: email, 
        password: password,
        options: { captchaToken: captchaToken } // البصمة الأمنية
      });
      if (error) throw error;
      resetLoginAttempts();
      showToast(t('toastAuthSuccess') + (data.user.user_metadata?.name || email), 'success');
      setTimeout(() => window.router('user-dashboard'), 500);
    }
  } catch (err) {
    recordFailedAttempt();
    let msg = err.message;
    if (msg.includes('weak-password')) msg = t('weakPassword');
    else if (msg.includes('invalid-email')) msg = t('invalidEmail');
    else if (msg.includes('not found') || msg.includes('Invalid login')) msg = t('userNotFound');
    else if (msg.includes('wrong-password') || msg.includes('Invalid login credentials')) msg = t('wrongPassword');
    else if (msg.includes('already in use') || msg.includes('already registered')) msg = t('emailInUse');
    // إضافة رسالة خطأ للكابتشا
    else if (msg.includes('captcha')) msg = state.currentLang === 'ar' ? 'فشل التحقق الأمني، حاول مجدداً.' : 'Security check failed, try again.';
    showToast(t('toastAuthError') + msg, 'error');
  } finally { 
    setLoading(btn, false); 
  }
};

window.toggleAuthMode = function() {
  state.isSignUp = !state.isSignUp;
  document.getElementById('nameFieldGroup').classList.toggle('hidden', !state.isSignUp);
  
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) forgotLink.style.display = state.isSignUp ? 'none' : 'block';

  document.getElementById('authFormTitle').textContent = t(state.isSignUp ? 'signUpTitle' : 'loginTitle');
  document.getElementById('authSubmitBtn').querySelector('span').textContent = t(state.isSignUp ? 'signUpBtn' : 'loginBtn');
  document.getElementById('authToggleText').textContent = t(state.isSignUp ? 'hasAccount' : 'noAccount');
};

// --- استعادة وتغيير كلمة المرور ---
window.handleForgotPassword = function(e) {
  if (e) e.preventDefault();
  document.getElementById('resetEmailInput').value = '';
  document.getElementById('forgotPasswordModal').classList.remove('hidden');
  document.getElementById('resetEmailInput').focus();
};

window.closeForgotPasswordModal = function() {
  document.getElementById('forgotPasswordModal').classList.add('hidden');
};

window.submitPasswordReset = async function() {
  const email = document.getElementById('resetEmailInput').value.trim();
  if (!email || !email.includes('@')) {
    showToast(state.currentLang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', 'error');
    return;
  }
  const btn = document.getElementById('sendResetLinkBtn');
  setLoading(btn, true, state.currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...');

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw error;
    showToast(state.currentLang === 'ar' ? 'تم إرسال رابط الاستعادة إلى بريدك بنجاح' : 'Reset link sent successfully', 'success');
    window.closeForgotPasswordModal();
  } catch (err) {
    let msg = err.message;
    if (msg.includes('not found')) msg = state.currentLang === 'ar' ? 'هذا البريد غير مسجل لدينا' : 'Email not found';
    showToast((state.currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + msg, 'error');
  } finally {
    setLoading(btn, false, state.currentLang === 'ar' ? 'إرسال الرابط' : 'Send Link');
  }
};

window.handleChangePassword = function() {
  const input = document.getElementById('newPasswordInput');
  const icon = document.getElementById('eyeIconModal');
  input.value = ''; 
  if (input && icon) {
    input.type = 'password';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    icon.style.color = 'var(--text-secondary)';
  }
  document.getElementById('changePasswordModal').classList.remove('hidden');
  input.focus();
};

window.closeChangePasswordModal = function() {
  document.getElementById('changePasswordModal').classList.add('hidden');
};

window.submitNewPassword = async function() {
  const newPassword = document.getElementById('newPasswordInput').value;
  if (!newPassword || newPassword.length < 6) {
    showToast(state.currentLang === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل!' : 'Password must be at least 6 characters!', 'error');
    return;
  }
  const btn = document.getElementById('saveNewPasswordBtn');
  setLoading(btn, true);

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    showToast(state.currentLang === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully', 'success');
    window.closeChangePasswordModal();
  } catch (err) {
    showToast((state.currentLang === 'ar' ? 'فشل تغيير كلمة المرور: ' : 'Error: ') + err.message, 'error');
  } finally {
    setLoading(btn, false, state.currentLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes');
  }
};

window.togglePasswordVisibility = function(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    icon.style.color = 'var(--primary)';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    icon.style.color = 'var(--text-secondary)';
  }
};

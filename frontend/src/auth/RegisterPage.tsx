import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import { apiFetch } from '../api/client';
import { Mail, Lock, ArrowRight, ShieldAlert, Loader2, User, Building } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationSlug: z.string().min(1, 'Organization slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lower case, numbers or hyphens only'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const orgName = watch('organizationName');

  // Auto-slugify organization name
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('organizationName', val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('organizationSlug', slug, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true
      });
      login(result.user, result.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12 relative overflow-hidden">
      {/* Background decoration glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-xl space-y-8 bg-gray-900/60 backdrop-blur-xl border border-gray-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/10 rounded-xl text-indigo-400 mb-4 border border-indigo-500/20">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Workspace</h2>
          <p className="mt-2 text-sm text-gray-400">
            Set up your organization workspace and owner account
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2.5 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-indigo-400">Organization Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Building className="w-5 h-5" />
                    </div>
                    <input
                      id="organizationName"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Acme Corp"
                      {...register('organizationName')}
                      onChange={handleOrgNameChange}
                    />
                  </div>
                  {errors.organizationName && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.organizationName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="organizationSlug" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Workspace URL Slug
                  </label>
                  <div className="relative">
                    <input
                      id="organizationSlug"
                      type="text"
                      className="block w-full px-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="acme-corp"
                      {...register('organizationSlug')}
                    />
                  </div>
                  {errors.organizationSlug && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.organizationSlug.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-purple-400">Account Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Alice"
                      {...register('firstName')}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Owner"
                      {...register('lastName')}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="name@company.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-950/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder="•••••••• (Min 8 chars)"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-indigo-500/20 active:bg-indigo-700 transition-all duration-150 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400 mt-4">
            Already have a workspace?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

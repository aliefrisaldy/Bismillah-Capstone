import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    status?: string;
};

export default function Register({ status }: Props) {
    return (
        <>
            <Head title="Daftar" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex w-full flex-col gap-7"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Name Input */}
                        <div className="flex flex-col gap-2.5">
                            <Label htmlFor="nama" className="text-sm font-medium text-foreground">
                                Nama Lengkap
                            </Label>
                            <Input
                                id="nama"
                                type="text"
                                name="nama"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                placeholder="Nama Lengkap"
                                className="h-11 rounded-full border-2 border-stone-300 bg-transparent px-5 py-3 text-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-stone-500 focus-visible:ring-0 dark:border-stone-600 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-stone-400"
                            />
                            <InputError message={errors.nama} />
                        </div>

                        {/* Email Input */}
                        <div className="flex flex-col gap-2.5">
                            <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                placeholder="Email"
                                className="h-11 rounded-full border-2 border-stone-300 bg-transparent px-5 py-3 text-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-stone-500 focus-visible:ring-0 dark:border-stone-600 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-stone-400"
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* No Telpon Input */}
                        <div className="flex flex-col gap-2.5">
                            <Label htmlFor="no_telpon" className="text-sm font-medium text-foreground">
                                No. Telepon
                            </Label>
                            <Input
                                id="no_telpon"
                                type="tel"
                                name="no_telpon"
                                required
                                tabIndex={3}
                                autoComplete="tel"
                                placeholder="Contoh: 081234567890"
                                className="h-11 rounded-full border-2 border-stone-300 bg-transparent px-5 py-3 text-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-stone-500 focus-visible:ring-0 dark:border-stone-600 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-stone-400"
                            />
                            <InputError message={errors.no_telpon} />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-2.5">
                            <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                Kata Sandi
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Kata Sandi"
                                className="h-11 rounded-full border-2 border-stone-300 bg-transparent px-5 py-3 text-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-stone-500 focus-visible:ring-0 dark:border-stone-600 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-stone-400"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password Input */}
                        <div className="flex flex-col gap-2.5">
                            <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                                Konfirmasi Kata Sandi
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="Konfirmasi Kata Sandi"
                                className="h-11 rounded-full border-2 border-stone-300 bg-transparent px-5 py-3 text-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-stone-500 focus-visible:ring-0 dark:border-stone-600 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-stone-400"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="mt-1 h-11 w-full rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-stone-800 active:bg-stone-950 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                            tabIndex={5}
                            disabled={processing}
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Daftar
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-stone-300 dark:bg-stone-600" />
                            <span className="text-xs text-muted-foreground">atau lanjut dengan</span>
                            <div className="h-px flex-1 bg-stone-300 dark:bg-stone-600" />
                        </div>

                        {/* Social Buttons */}
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-stone-300 bg-white text-stone-900 transition-all hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-700"
                                aria-label="Register with Google"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="bold">G</text>
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-stone-300 bg-white text-stone-900 transition-all hover:border-stone-400 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-white dark:hover:border-stone-500 dark:hover:bg-stone-700"
                                aria-label="Register with Apple"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.48-2.54 3.09l-.42.02zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-blue-600 transition-all hover:border-blue-600 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-900"
                                aria-label="Register with Facebook"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center text-sm text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-500 dark:hover:text-emerald-400"
                            >
                                Masuk sekarang
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Register.layout = {
    title: 'Mulai Berkontribusi!',
    description: 'Buat akun untuk membantu menjaga kebersihan dan kerapihan Kota Palu.',
};
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <>
            <Head title="Masuk" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Nama Pengguna / Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="Nama Pengguna / Email"
                                    className="rounded-full px-4"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Kata Sandi</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-sm font-medium"
                                            tabIndex={5}
                                        >
                                            Lupa Kata Sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Kata Sandi"
                                    className="rounded-full px-4"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Ingat saya</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full rounded-full bg-gray-900 py-5 text-base font-semibold hover:bg-gray-700"
                                tabIndex={4}
                                disabled={processing}
                            >
                                {processing && <Spinner className="mr-2" />}
                                Masuk
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">atau lanjut dengan</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {/* Social buttons placeholder */}
                        <div className="flex justify-center gap-3">
                            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-border hover:bg-muted">
                                <span className="text-lg">G</span>
                            </button>
                            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-border hover:bg-muted">
                                <span className="text-lg"></span>
                            </button>
                            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-blue-600 text-white hover:bg-blue-500">
                                <span className="text-lg font-bold">f</span>
                            </button>
                        </div>

                        {/* Portal DLH */}
                        <a href="/admin/login">
                            <button
                                type="button"
                                className="w-full rounded-full border border-dashed border-green-600 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50"
                            >
                                🛡 Portal Petugas DLH
                            </button>
                        </a>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Belum punya akun?{' '}
                                <TextLink href={register()} tabIndex={6} className="font-semibold text-green-600">
                                    Daftar sekarang
                                </TextLink>
                            </div>
                        )}
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

Login.layout = {
    title: 'Selamat Datang Kembali!',
    description: 'Wujudkan Kota Palu yang Bersih. Silakan masuk untuk mulai berkontribusi.',
};
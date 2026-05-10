import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function AdminLogin() {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const form = e.currentTarget;
        const formData = new FormData(form);

        router.post('/admin/login', {
            email: formData.get('email'),
            password: formData.get('password'),
        }, {
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Portal Petugas DLH" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6">

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="email@dlh-palu.go.id"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Kata sandi"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={3}
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        Masuk ke Portal
                    </Button>

                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Akses ini hanya untuk petugas resmi<br />
                    Dinas Lingkungan Hidup Kota Palu.
                </p>
            </form>
        </>
    );
}

AdminLogin.layout = {
    title: 'Portal Petugas DLH',
    description: 'Masuk untuk mengelola laporan sampah ilegal di Kota Palu.',
};
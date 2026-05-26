import { router } from '@inertiajs/react';
import { LogOut, Moon, Sun } from 'lucide-react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useAppearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { appearance, updateAppearance } = useAppearance();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
        router.post('/admin/logout');
    };

    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    className="flex w-full cursor-pointer items-center"
                    onClick={toggleTheme}
                >
                    {appearance === 'dark' ? (
                        <Sun className="mr-2" />
                    ) : (
                        <Moon className="mr-2" />
                    )}
                    {appearance === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    className="block w-full cursor-pointer"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </button>
            </DropdownMenuItem>
        </>
    );
}

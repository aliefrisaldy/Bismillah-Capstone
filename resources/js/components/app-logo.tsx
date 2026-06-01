export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center">
                <img
                    src="/Logo/logo-pakagasa.svg"
                    alt="Pakagasa"
                    className="h-8 w-auto"
                />
            </div>
            <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight text-xl font-bold tracking-tight text-foreground">
                    Pakagasa
                </span>
            </div>
        </>
    );
}

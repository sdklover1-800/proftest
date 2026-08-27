import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import { useIsDesktop } from '../model/useMediaQuery';

interface NavItem {
    href: string;
    labelKey: string;
    fallback: string;
    icon: React.ReactNode;
}

const NAV: NavItem[] = [
    {
        href: '/home',
        labelKey: 'tabs.home',
        fallback: 'Главная',
        icon: (
            <path d="M3 9 L10 3.5 L17 9 V16.5 H3 Z" strokeLinejoin="round" />
        ),
    },
    {
        href: '/profile',
        labelKey: 'tabs.profile',
        fallback: 'Профиль',
        icon: (
            <>
                <path d="M4 16 V10 M10 16 V5 M16 16 V12" strokeLinecap="round" />
            </>
        ),
    },
    {
        href: '/plan',
        labelKey: 'tabs.plan',
        fallback: 'План',
        icon: (
            <>
                <rect x="3.5" y="3.5" width="13" height="13" rx="2.5" />
                <path d="M7 10 L9 12 L13 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
        ),
    },
];

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
    >
        {children}
    </svg>
);

/**
 * The app's chrome, chosen by width rather than stretched.
 *
 * The product has two jobs that want opposite layouts: taking the test wants a
 * narrow, undistracted column even on a large monitor, while reading the
 * result wants room for several blocks side by side. So the shell supplies the
 * navigation and a max width, and each screen says how wide it should get.
 */
export const AppShell: React.FC<{ children: React.ReactNode; showNav?: boolean }> = ({
    children,
    showNav = true,
}) => {
    const isDesktop = useIsDesktop();
    const location = useLocation();
    const { t } = useTranslation();

    // Signed-out screens (welcome, login) keep their own centred layout.
    if (!isDesktop || !showNav) {
        return <>{children}</>;
    }

    const isActive = (href: string) =>
        location.pathname === href || location.pathname.startsWith(`${href}/`);

    return (
        <div className="flex min-h-dvh bg-background text-foreground">
            <nav
                aria-label={t('tabs.primary', 'Основная навигация')}
                className="flex w-60 shrink-0 flex-col gap-7 border-r border-border px-4 py-7"
            >
                <span className="px-3 text-[15px] font-bold tracking-tight">proftest</span>

                <ul className="flex flex-col gap-1">
                    {NAV.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={classNames(
                                        'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                                        active
                                            ? 'bg-card font-semibold text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
                                    )}
                                >
                                    <NavIcon>{item.icon}</NavIcon>
                                    {t(item.labelKey, item.fallback)}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
};

export default AppShell;

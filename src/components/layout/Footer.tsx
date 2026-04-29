'use client';

import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa6';
import { IconType } from 'react-icons/lib';

import { Logo } from './Logo';
import { ThemeToggle } from '../ui';

const LEGAL_LINKS = [
  { href: '/legal?tab=terms', label: 'Terms and Conditions' },
  { href: '/legal?tab=privacy', label: 'Privacy Policy' },
  { href: '/legal?tab=refunds', label: 'Refund Policy' },
  { href: '/legal?tab=cookie', label: 'Cookie Policy' },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-black text-white border-t border-background pt-10 pb-6 font-sans text-sm">
      <div className="main_container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 lg:gap-8 mb-12">
          <div>
            <div className="flex items-center gap-4">
              <Logo />
              <ThemeToggle className="bg-accent hover:bg-accent/80 dark:bg-transparent dark:hover:bg-foreground/10" />
            </div>
          </div>
          <FooterColumn
            title="Company"
            links={[
              { href: '/about', label: 'About' },
              { href: '/support', label: 'Contact Us' },
            ]}
          />

          <FooterColumn
            title="Buy"
            links={[
              { href: '/store', label: 'Our Store' },
              { href: '/topups', label: 'Top-ups' },
            ]}
          />

          <div>
            <h3 className="text-white font-bold mb-4">Follow Us</h3>
            <ul className="flex flex-col gap-3">
              <SocialLink
                href="https://www.facebook.com/share/1DyRbUxQzY/?mibextid=wwXIfr"
                icon={FaFacebook}
                label="Facebook"
              />
              <SocialLink
                href="https://www.instagram.com/gimxa_com?igsh=NnZ0MzNrejNrbWxk&utm_source=qr"
                icon={FaInstagram}
                label="Instagram"
              />
              <SocialLink
                href="https://www.tiktok.com/@gimxa.com?_r=1&_t=ZS-95vME6iQQSr"
                icon={FaTiktok}
                label="TikTok"
              />
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/50 pt-6">
          <div>
            <Logo />
          </div>

          <ul className="flex flex-wrap justify-center gap-6 text-xs font-medium">
            {LEGAL_LINKS.map((link, idx) => (
              <li key={idx}>
                <Link href={link.href} className="hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-white font-bold mb-4">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  icon: Icon,
  label,
  href,
}: {
  icon: IconType;
  label: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 hover:text-white transition-colors group">
        <Icon size={18} className="text-white/80 group-hover:text-primary transition-colors" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

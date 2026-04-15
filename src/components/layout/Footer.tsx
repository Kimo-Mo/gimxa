'use client';

import Link from 'next/link';
import { Globe, Camera, Gamepad2, LucideProps } from 'lucide-react';

import { Logo } from './Logo';

const LEGAL_LINKS = [
  { href: '/legal', label: 'Terms and Conditions' },
  { href: '/legal', label: 'Privacy Policy' },
  { href: '/legal', label: 'Refund Policy' },
  { href: '/legal', label: 'Consent Preferences' },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-black text-white border-t border-background pt-10 pb-6 font-sans text-sm">
      <div className="main_container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8 lg:gap-8 mb-12">
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
              { href: '/gift-cards', label: 'Gift Cards' },
            ]}
          />

          <FooterColumn
            title="Help"
            links={[
              { href: '/activation-guides', label: 'Activation Guides' },
              { href: '/support', label: 'Create a Ticket' },
            ]}
          />

          <div>
            <h3 className="text-white font-bold mb-4">Follow Us</h3>
            <ul className="flex flex-col gap-3">
              <SocialLink icon={Globe} label="Facebook" />
              <SocialLink icon={Camera} label="Instagram" />
              <SocialLink icon={Gamepad2} label="Discord" />
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
}: {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
}) {
  return (
    <li>
      <Link href="#" className="flex items-center gap-2 hover:text-white transition-colors group">
        <Icon size={18} className="text-white/80 group-hover:text-primary transition-colors" />
        <span>{label}</span>
      </Link>
    </li>
  );
}

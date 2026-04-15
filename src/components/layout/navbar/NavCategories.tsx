import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { NAV_DATA, type NavItem } from './NAV_DATA';

export function NavCategories() {
  return (
    <div className="border-t border-border mt-2">
      <ul className="hidden lg:flex items-center overflow-x-hidden gap-4 lg:gap-6 font-bold *:py-2">
        {NAV_DATA.map((category, index) => (
          <NavItem key={index} title={category.title} columns={category.columns} />
        ))}

        <li className="hover:text-primary cursor-pointer transition-colors">Store</li>
        <li className="hover:text-primary cursor-pointer transition-colors">Upcoming</li>
        <li className="hover:text-primary cursor-pointer transition-colors">Topups</li>
      </ul>
      <div className="flex lg:hidden items-center overflow-x-auto gap-x-4 lg:gap-x-6 gap-y-2 font-bold py-2">
        {NAV_DATA.map((category, index) => (
          <Link
            key={index}
            href={'/' + category.href}
            className="hover:text-primary cursor-pointer transition-colors border border-border p-2 rounded-2xl whitespace-nowrap">
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavItem({ title, columns }: NavItem) {
  return (
    <li className="group static h-full flex items-center">
      <button className="flex items-center gap-1 h-full hover:text-primary transition-colors focus:outline-none">
        {title}{' '}
        <ChevronDown
          size={14}
          className="group-hover:rotate-180 transition-transform duration-300"
        />
      </button>

      <div className="hidden lg:block absolute left-0 top-full w-full bg-[#0a0a0a] border-t border-gray-800 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform origin-top translate-y-2 group-hover:translate-y-0">
        <div className="mx-auto py-8 container px-4 md:px-8 lg:px-16 pt-3 lg:pt-5">
          <div className="grid grid-cols-5 gap-y-10 gap-x-8">
            {columns.map((col, idx) => (
              <MenuColumn key={idx} header={col.header} items={col.items} viewAll={col.viewAll} />
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

function MenuColumn({
  header,
  items,
  viewAll,
}: {
  header: string;
  items: string[];
  viewAll?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-white font-bold text-xs uppercase mb-1 tracking-wider border-l-2 border-transparent hover:border-primary pl-0 hover:pl-2 transition-all cursor-default">
        {header}
      </h3>
      <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
        {items.map((item, index) => (
          <li key={index}>
            <Link
              href="#"
              className="hover:text-white hover:translate-x-1 transition-all duration-200 block">
              {item}
            </Link>
          </li>
        ))}

        {viewAll && (
          <li>
            <Link
              href="#"
              className="text-white font-semibold hover:text-primary transition-colors mt-2 flex items-center gap-1 group/link">
              View All{' '}
              <ArrowRight
                size={12}
                className="group-hover/link:translate-x-1 transition-transform"
              />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

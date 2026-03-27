import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={clsx('flex items-center gap-1', className)}>
      <ol className="flex items-center gap-1 text-xs text-oav-muted">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="w-3 h-3 text-oav-border" aria-hidden="true" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-oav-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-oav-accent rounded"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

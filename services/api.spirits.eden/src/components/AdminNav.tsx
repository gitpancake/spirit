'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { path: '/admin', label: 'Overview', exact: true },
    { path: '/admin/spirits', label: 'Spirits' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <nav style={{
      borderTop: '1px solid #e1e1e1',
      backgroundColor: '#fafafa',
      padding: '1rem 0'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 2rem',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          fontWeight: '600',
          marginRight: '1rem',
          textTransform: 'uppercase'
        }}>
          Registry Navigation:
        </span>
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'all 0.1s ease-in-out',
              border: '1px solid',
              ...(isActive(item.path, item.exact) 
                ? {
                    backgroundColor: '#1f2937',
                    color: 'white',
                    borderColor: '#1f2937'
                  }
                : {
                    backgroundColor: 'white',
                    color: '#374151',
                    borderColor: '#d1d5db'
                  }
              )
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path, item.exact)) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path, item.exact)) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: '#0066cc',
      textDecoration: 'underline',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = '#0052cc')}
    onMouseLeave={(e) => (e.currentTarget.style.color = '#0066cc')}
  >
    {children}
  </a>
);

export default Link;

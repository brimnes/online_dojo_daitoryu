'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { C, F } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useAccessibility } from '@/lib/accessibility';

const SCHEMA = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'u'],
};

const REHYPE = [rehypeRaw, [rehypeSanitize, SCHEMA]];
const REMARK = [[remarkGfm, { singleTilde: false }]];
const REMARK_BREAKS = [...REMARK, remarkBreaks];

export default function RichText({ content, breaks = false }) {
  const isMobile = useIsMobile();
  const { fontScale, highContrast } = useAccessibility();
  const strongColor = highContrast ? '#000000' : C.ink;
  const mutedColor  = highContrast ? '#1a1a1a' : C.muted;

  return (
    <ReactMarkdown
      remarkPlugins={breaks ? REMARK_BREAKS : REMARK}
      rehypePlugins={REHYPE}
      components={{
        p:      ({children}) => <p style={{marginBottom:'1em'}}>{children}</p>,
        h1:     ({children}) => <h1 style={{fontFamily:F.serif,fontSize:Math.round((isMobile?28:36)*fontScale),color:strongColor,margin:'1.4em 0 0.5em',fontWeight:400}}>{children}</h1>,
        h2:     ({children}) => <h2 style={{fontFamily:F.serif,fontSize:Math.round((isMobile?22:28)*fontScale),color:strongColor,margin:'1.2em 0 0.4em',fontWeight:400}}>{children}</h2>,
        h3:     ({children}) => <h3 style={{fontFamily:F.mono,fontSize:Math.round(13*fontScale),letterSpacing:'0.12em',color:mutedColor,textTransform:'uppercase',margin:'1em 0 0.3em'}}>{children}</h3>,
        strong: ({children}) => <strong style={{color:strongColor,fontWeight:600}}>{children}</strong>,
        em:     ({children}) => <em style={{fontStyle:'italic'}}>{children}</em>,
        u:      ({children}) => <u style={{textDecoration:'underline',textUnderlineOffset:'0.15em'}}>{children}</u>,
        del:    ({children}) => <del>{children}</del>,
        ul:     ({children}) => <ul style={{paddingLeft:24,marginBottom:'1em'}}>{children}</ul>,
        ol:     ({children}) => <ol style={{paddingLeft:24,marginBottom:'1em'}}>{children}</ol>,
        li:     ({children}) => <li style={{marginBottom:'0.3em'}}>{children}</li>,
        blockquote: ({children}) => (
          <blockquote style={{borderLeft:`3px solid ${C.accent}`,paddingLeft:16,margin:'1em 0',color:mutedColor,fontStyle:'italic'}}>
            {children}
          </blockquote>
        ),
        img: ({src, alt}) => (
          <span style={{display:'block',margin:'1.5em 0'}}>
            <img src={src} alt={alt||''} style={{maxWidth:'100%',height:'auto',display:'block'}}/>
            {alt && <span style={{display:'block',marginTop:6,fontFamily:F.mono,fontSize:Math.round(11*fontScale),color:mutedColor,letterSpacing:'0.08em'}}>{alt}</span>}
          </span>
        ),
        a: ({href, children}) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:'underline'}}>
            {children}
          </a>
        ),
        hr: () => <hr style={{border:'none',borderTop:`1px solid ${C.border}`,margin:'2em 0'}}/>,
      }}
    >
      {content || ''}
    </ReactMarkdown>
  );
}

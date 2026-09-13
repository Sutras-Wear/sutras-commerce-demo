/* Public rendering safeguards. Remote image hosts are deliberately not enabled. */
(() => {
  'use strict';
  const fallback = 'assets/images/cotton.webp';
  const text = value => {
    const s = String(value ?? '');
    return s.toWellFormed ? s.toWellFormed() : s.replace(/[\uD800-\uDFFF]/g, '\uFFFD');
  };
  const escape = value => text(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function imageURL(value) {
    // Only literal relative paths inside the bundled image directory. Reject
    // protocol-relative URLs, encoded traversal, query strings and SVG payloads.
    if (typeof value !== 'string' || !/^assets\/images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(value)) return fallback;
    return value;
  }
  function linkURL(value) {
    const s=text(value);
    if(/^#[A-Za-z][\w-]*$/.test(s))return s;
    try {
      const u=new URL(s);
      if(u.protocol!=='https:' || u.username || u.password || u.port)return '';
      if(u.hostname==='wa.me' && /^\/(?:260978865604|260973668415)?$/.test(u.pathname))return u.href;
      if(u.hostname==='www.instagram.com' && u.pathname.startsWith('/sutras.official/'))return u.href;
      if(u.hostname==='sutrasbys3.com' || (u.hostname==='sutras-wear.github.io' && u.pathname.startsWith('/sutras-commerce-demo/')))return u.href;
    }catch(_){}
    return '';
  }
  const tags=new Set('SECTION DIV SPAN BUTTON IMG STRONG SMALL P H2 H3 H4 A SVG USE LABEL SELECT OPTION ARTICLE EM BR UL LI'.split(' '));
  function setHTML(target,markup) {
    if(!target)return;
    const template=document.createElement('template');
    // Sole HTML parsing sink. Callers escape dynamic text; this second layer
    // strips active content, unsafe destinations and unexpected elements.
    template.innerHTML=text(markup);
    for(const node of [...template.content.querySelectorAll('*')]) {
      if(!tags.has(node.tagName.toUpperCase())){node.remove();continue;}
      for(const attr of [...node.attributes]) {
        const n=attr.name.toLowerCase();
        if(n.startsWith('on') || ['srcdoc','srcset','formaction','action','xlink:href','xmlns'].includes(n))node.removeAttribute(attr.name);
        else if(n==='src')node.setAttribute('src',imageURL(attr.value));
        else if(n==='href') {
          const safe=node.tagName.toLowerCase()==='use' ? (/^#i-[a-z-]+$/.test(attr.value)?attr.value:'') : linkURL(attr.value);
          if(safe)node.setAttribute(n,safe);else node.removeAttribute(n);
        } else if(n==='style') {
          const safe=attr.value.split(';').map(v=>v.trim()).filter(v=>/^(?:animation-delay:\s*\d+ms|background:\s*#[0-9a-f]{6})$/i.test(v)).join(';');
          if(safe)node.setAttribute('style',safe);else node.removeAttribute('style');
        }
      }
      if(node.tagName==='A' && node.getAttribute('target')==='_blank')node.setAttribute('rel','noopener noreferrer');
    }
    target.replaceChildren(template.content);
  }
  window.SutrasSecurity=Object.freeze({text,escape,imageURL,linkURL,setHTML});
})();

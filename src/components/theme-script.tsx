/**
 * Blocking theme initializer for SSR (runs before paint).
 * Rendered from the root layout <head> — not inside a Client Component tree.
 */
export function ThemeScript() {
  const themeInitializer = `(e,i,s,u,m,a,l,h)=>{let d=document.documentElement,w=["light","dark"];function p(n){(Array.isArray(e)?e:[e]).forEach(y=>{let k=y==="class",S=k&&a?m.map(f=>a[f]||f):m;k?(d.classList.remove(...S),d.classList.add(a&&a[n]?a[n]:n)):d.setAttribute(y,n)}),R(n)}function R(n){h&&w.includes(n)&&(d.style.colorScheme=n)}function c(){return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(u)p(u);else try{let n=localStorage.getItem(i)||s,y=l&&n==="system"?c():n;p(y)}catch(n){}}`;

  const config = JSON.stringify([
    "class",
    "theme",
    "system",
    null,
    ["light", "dark"],
    null,
    true,
    true,
  ]).slice(1, -1);

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${themeInitializer})(${config})`,
      }}
    />
  );
}

import { DEFAULT_THEME, THEME_STORAGE_KEY, themeIds } from "@/lib/themes";

/** Runs before paint so a saved/system theme does not flash the default canvas. */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var ids=${JSON.stringify(themeIds)};var p=localStorage.getItem(k);var t=ids.indexOf(p)>=0?p:(matchMedia('(prefers-color-scheme: dark)').matches?'clay-dark':'${DEFAULT_THEME}');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t.endsWith('dark')?'dark':'light';}catch(e){document.documentElement.dataset.theme='${DEFAULT_THEME}';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

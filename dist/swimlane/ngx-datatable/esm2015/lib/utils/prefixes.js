import { camelCase } from './camel-case';
const cache = {};
const testStyle = typeof document !== 'undefined' ? document.createElement('div').style : undefined;
const ɵ0 = function () {
  const styles = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement, '') : undefined;
  const match =
    typeof styles !== 'undefined'
      ? Array.prototype.slice
          .call(styles)
          .join('')
          .match(/-(moz|webkit|ms)-/)
      : null;
  const pre = match !== null ? match[1] : undefined;
  // tslint:disable-next-line: tsr-detect-non-literal-regexp
  const dom = typeof pre !== 'undefined' ? 'WebKit|Moz|MS|O'.match(new RegExp('(' + pre + ')', 'i'))[1] : undefined;
  return dom
    ? {
        dom,
        lowercase: pre,
        css: `-${pre}-`,
        js: pre[0].toUpperCase() + pre.substr(1)
      }
    : undefined;
};
// Get Prefix
// http://davidwalsh.name/vendor-prefix
const prefix = ɵ0();
export function getVendorPrefixedName(property) {
  const name = camelCase(property);
  if (!cache[name]) {
    if (prefix !== undefined && testStyle[prefix.css + property] !== undefined) {
      cache[name] = prefix.css + property;
    } else if (testStyle[property] !== undefined) {
      cache[name] = property;
    }
  }
  return cache[name];
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZml4ZXMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWRhdGF0YWJsZS9zcmMvIiwic291cmNlcyI6WyJsaWIvdXRpbHMvcHJlZml4ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUV6QyxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDakIsTUFBTSxTQUFTLEdBQUcsT0FBTyxRQUFRLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1dBSXBGO0lBQ2QsTUFBTSxNQUFNLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ2pILE1BQU0sS0FBSyxHQUNULE9BQU8sTUFBTSxLQUFLLFdBQVc7UUFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSzthQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDO2FBQ1osSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNSLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztRQUMvQixDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ1gsTUFBTSxHQUFHLEdBQUcsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDbEQsMERBQTBEO0lBQzFELE1BQU0sR0FBRyxHQUFHLE9BQU8sR0FBRyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUVsSCxPQUFPLEdBQUc7UUFDUixDQUFDLENBQUM7WUFDRSxHQUFHO1lBQ0gsU0FBUyxFQUFFLEdBQUc7WUFDZCxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUc7WUFDZixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1NBQ3pDO1FBQ0gsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNoQixDQUFDO0FBdkJELGFBQWE7QUFDYix1Q0FBdUM7QUFDdkMsTUFBTSxNQUFNLEdBQUcsSUFxQmIsRUFBRSxDQUFDO0FBRUwsTUFBTSxVQUFVLHFCQUFxQixDQUFDLFFBQWdCO0lBQ3BELE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVqQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ2hCLElBQUksTUFBTSxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDMUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDO1NBQ3JDO2FBQU0sSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQzVDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUM7U0FDeEI7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjYW1lbENhc2UgfSBmcm9tICcuL2NhbWVsLWNhc2UnO1xyXG5cclxuY29uc3QgY2FjaGUgPSB7fTtcclxuY29uc3QgdGVzdFN0eWxlID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLnN0eWxlIDogdW5kZWZpbmVkO1xyXG5cclxuLy8gR2V0IFByZWZpeFxyXG4vLyBodHRwOi8vZGF2aWR3YWxzaC5uYW1lL3ZlbmRvci1wcmVmaXhcclxuY29uc3QgcHJlZml4ID0gKGZ1bmN0aW9uICgpIHtcclxuICBjb25zdCBzdHlsZXMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJycpIDogdW5kZWZpbmVkO1xyXG4gIGNvbnN0IG1hdGNoID1cclxuICAgIHR5cGVvZiBzdHlsZXMgIT09ICd1bmRlZmluZWQnXHJcbiAgICAgID8gQXJyYXkucHJvdG90eXBlLnNsaWNlXHJcbiAgICAgICAgICAuY2FsbChzdHlsZXMpXHJcbiAgICAgICAgICAuam9pbignJylcclxuICAgICAgICAgIC5tYXRjaCgvLShtb3p8d2Via2l0fG1zKS0vKVxyXG4gICAgICA6IG51bGw7XHJcbiAgY29uc3QgcHJlID0gbWF0Y2ggIT09IG51bGwgPyBtYXRjaFsxXSA6IHVuZGVmaW5lZDtcclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHRzci1kZXRlY3Qtbm9uLWxpdGVyYWwtcmVnZXhwXHJcbiAgY29uc3QgZG9tID0gdHlwZW9mIHByZSAhPT0gJ3VuZGVmaW5lZCcgPyAnV2ViS2l0fE1venxNU3xPJy5tYXRjaChuZXcgUmVnRXhwKCcoJyArIHByZSArICcpJywgJ2knKSlbMV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gIHJldHVybiBkb21cclxuICAgID8ge1xyXG4gICAgICAgIGRvbSxcclxuICAgICAgICBsb3dlcmNhc2U6IHByZSxcclxuICAgICAgICBjc3M6IGAtJHtwcmV9LWAsXHJcbiAgICAgICAganM6IHByZVswXS50b1VwcGVyQ2FzZSgpICsgcHJlLnN1YnN0cigxKVxyXG4gICAgICB9XHJcbiAgICA6IHVuZGVmaW5lZDtcclxufSkoKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRWZW5kb3JQcmVmaXhlZE5hbWUocHJvcGVydHk6IHN0cmluZykge1xyXG4gIGNvbnN0IG5hbWUgPSBjYW1lbENhc2UocHJvcGVydHkpO1xyXG5cclxuICBpZiAoIWNhY2hlW25hbWVdKSB7XHJcbiAgICBpZiAocHJlZml4ICE9PSB1bmRlZmluZWQgJiYgdGVzdFN0eWxlW3ByZWZpeC5jc3MgKyBwcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjYWNoZVtuYW1lXSA9IHByZWZpeC5jc3MgKyBwcm9wZXJ0eTtcclxuICAgIH0gZWxzZSBpZiAodGVzdFN0eWxlW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNhY2hlW25hbWVdID0gcHJvcGVydHk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY2FjaGVbbmFtZV07XHJcbn1cclxuIl19
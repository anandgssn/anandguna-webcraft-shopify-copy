import type { Metadata, Viewport } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopify Design",
  description: "Make the new normal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const faviconScript = `(function() {
  var total = 13;
  var pick = Math.floor(Math.random() * total) + 1;
  var link32 = document.getElementById('favicon-32');
  for (var i = 1; i <= total; i++) {
    new Image().src = '/favicons/' + String(i).padStart(2, '0') + '/favicon-32x32.png';
  }
  var order = [];
  for (var i = 1; i <= total; i++) { if (i !== pick) order.push(i); }
  for (var i = order.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  order.push(pick);
  var step = 0;
  var baseDelay = 40;
  function next() {
    if (step >= order.length) return;
    var n = String(order[step]).padStart(2, '0');
    link32.href = '/favicons/' + n + '/favicon-32x32.png';
    step++;
    if (step < order.length) {
      var t = baseDelay + (step * step);
      setTimeout(next, t);
    } else {
      var p = '/favicons/' + n + '/';
      document.getElementById('favicon-16').href = p + 'favicon-16x16.png';
      document.getElementById('apple-touch-icon').href = p + 'apple-touch-icon.png';
    }
  }
  setTimeout(next, 300);
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/11/favicon-32x32.png" id="favicon-32" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/11/favicon-16x16.png" id="favicon-16" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicons/11/apple-touch-icon.png" id="apple-touch-icon" />
        <link rel="preload" href="/fonts/AntiqueLegacy-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/AntiqueLegacy-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/FragmentMono-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <script dangerouslySetInnerHTML={{ __html: faviconScript }} />
      </body>
    </html>
  );
}

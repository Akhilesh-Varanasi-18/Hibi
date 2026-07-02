import "./globals.css";
import Script from "next/script";
import UserContext from "./context/UserContext";
import Wrapper from "./components/Wrapper";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "HiBi",
  description: "People Management Simplified",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* ---- Matomo Analytics Script ---- */}
      <Script id="matomo-analytics" strategy="afterInteractive">
        {`
          var _paq = window._paq = window._paq || [];
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
            var u = "//analytics.devinco.dev/";
            _paq.push(['setTrackerUrl', u + 'matomo.php']);
            _paq.push(['setSiteId', '1']);
            var d = document, g = d.createElement('script'), 
                s = d.getElementsByTagName('script')[0];
            g.async = true; g.src = u + 'matomo.js'; 
            s.parentNode.insertBefore(g, s);
          })();
        `}
      </Script>

      <body className="antialiased">
        <Toaster />

        <UserContext>
          <Wrapper>
            {children}
          </Wrapper>
        </UserContext>
      </body>
    </html>
  );
}

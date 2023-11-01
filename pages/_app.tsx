import "katex/dist/katex.min.css";
import type { AppProps } from "next/app";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";
// Modify toastui-editor to scope button styles, fixing conflict with global tailwincss styles.
import "../styles/toastui-editor.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/virtual";

import "../styles/content.css";
import "../styles/globals.css";
import "../styles/print.css";

import MainProvider from "@/context/index";

function App({ Component, pageProps }: AppProps) {
  return (
    <MainProvider>
      <Component {...pageProps} />
    </MainProvider>
  );
}

export default App;

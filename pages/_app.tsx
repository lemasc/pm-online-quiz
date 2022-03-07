import "tailwindcss/tailwind.css";
import type { AppProps } from "next/app";
import "react-toastify/dist/ReactToastify.css";
import "@toast-ui/editor/dist/toastui-editor.css";
import "katex/dist/katex.min.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/virtual";

import "../styles/globals.css";
import "../styles/content.css";
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

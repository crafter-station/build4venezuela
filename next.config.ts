import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/whatsapp",
        destination:
          "https://chat.whatsapp.com/JH4oq2pmeX43EWXkvRhQHC?mode=gi_t",
        permanent: false,
      },
      {
        source: "/wpp",
        destination:
          "https://chat.whatsapp.com/JH4oq2pmeX43EWXkvRhQHC?mode=gi_t",
        permanent: false,
      },
      {
        source: "/luma",
        destination: "https://luma.com/hack0-zrbp",
        permanent: false,
      },
      {
        source: "/discord",
        destination: "https://discord.com/invite/NRDWrGnxTU",
        permanent: false,
      },
      {
        source: "/event",
        destination: "https://luma.com/hack0-zrbp",
        permanent: false,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);


import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, "index.html"),
                login: resolve(__dirname, "login.html"),
                main: resolve(__dirname, "map.html"),
                profile: resolve(__dirname, "profile.html"),
                settings: resolve(__dirname, "settings.html"),
                feed: resolve(__dirname, "feed.html"),
                rate: resolve(__dirname, "rate.html")
            }
        }
    }
});

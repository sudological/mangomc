import preprocess from "svelte-preprocess";
import adapter from "@sveltejs/adapter-static";
import { mdsvex } from 'mdsvex'

const dev = "production" === "development";

const config = {
    kit: {
        adapter: adapter({
            pages: "docs",
            assets: "docs",
            fallback: 'index.html'
        }),
        prerender: {
            default: true
        },
        paths: {
            // change below to your repo name
            base: dev ? "" : "",
        },
    },

    extensions: ['.svelte', '.md'],

    preprocess: [
        preprocess({
            postcss: true,
        }),
        mdsvex({
            extensions: ['.md'],
            layout: 'src/routes/__layout-md.svelte'
        })
    ],
};

export default config;

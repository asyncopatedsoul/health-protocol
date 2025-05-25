/// <reference types="vitest/config" />
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { config } from 'dotenv'
//#1
config()

export default defineConfig(({ mode }) => ({
    test: {
        // mode defines what ".env.{mode}" file to choose if exists
        // env: loadEnv(mode, process.cwd(), ''),
        env: {
            ...loadEnv('', process.cwd(), ''),
            IS_TEST: 'true'
        },
    },
}));
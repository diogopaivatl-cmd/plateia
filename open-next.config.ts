import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sem cache incremental por enquanto: as telas dependem do usuário logado.
export default defineCloudflareConfig({});

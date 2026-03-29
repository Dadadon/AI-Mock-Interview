import Vapi from "@vapi-ai/web";

if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
  console.error(
    "[vapi.sdk] NEXT_PUBLIC_VAPI_WEB_TOKEN is not set. " +
      "Add it to .env.local and restart the dev server."
  );
}

export const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ?? "");

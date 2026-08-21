export const clerkPublishableKey = process.env.THEXJS_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const liveblocksPublicKey = process.env.THEXJS_PUBLIC_LIVEBLOCKS_KEY;

export const clerkUiEnabled = () => Boolean(clerkPublishableKey);

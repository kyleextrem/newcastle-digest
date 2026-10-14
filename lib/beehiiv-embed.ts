import { SITE_URL } from '@/lib/site';

const BEEHIIV_EMBED_ID = 'e1030bd0-e867-42b4-b64e-c3b75defc0d9';
const BEEHIIV_DIRECT_SUBSCRIBE_URL = 'https://newsletter.newcastledigest.com/subscribe';

export function thankYouPath(location: string) {
  return `/thank-you?src=${encodeURIComponent(location)}`;
}

export function beehiivEmbedUrl(location: string) {
  const redirectTo = `${SITE_URL}${thankYouPath(location)}`;
  return `https://embeds.beehiiv.com/${BEEHIIV_EMBED_ID}?slim=true&redirect_to=${encodeURIComponent(redirectTo)}`;
}

export function beehiivDirectSubscribeUrl(location: string) {
  const redirectTo = `${SITE_URL}${thankYouPath(location)}`;
  return `${BEEHIIV_DIRECT_SUBSCRIBE_URL}?redirect_to=${encodeURIComponent(redirectTo)}`;
}

import type { ConfigFormat } from '~/types/config';

interface ShareState {
  shareUrl: Ref<string | null>,
  isSharing: Ref<boolean>,
  copied: Ref<boolean>,
  share: (left: string, right: string, format: ConfigFormat | 'auto') => Promise<void>,
  copyUrl: () => Promise<void>
}

export function useShare(): ShareState {
  const shareUrl = ref<string | null>(null);
  const isSharing = ref(false);
  const copied = ref(false);

  async function share(left: string, right: string, format: ConfigFormat | 'auto') {
    isSharing.value = true;
    try {
      const res = await $fetch<{ id: string, deleteToken: string }>('/api/share', {
        method: 'POST',
        body: {
          left_content: left,
          right_content: right,
          format
        }
      });

      const url = `${window.location.origin}/s/${res.id}`;
      shareUrl.value = url;

      // Store delete token in localStorage
      const tokens = JSON.parse(localStorage.getItem('configspot_tokens') || '{}');
      tokens[res.id] = res.deleteToken;
      localStorage.setItem('configspot_tokens', JSON.stringify(tokens));

      await copyUrl();
    } finally {
      isSharing.value = false;
    }
  }

  async function copyUrl() {
    if (!shareUrl.value) return;
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }

  return { shareUrl, isSharing, copied, share, copyUrl };
}

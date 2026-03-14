export interface KeyboardCallbacks {
  onCompare?: () => void,
  onToggleFormatFilter?: () => void,
  onToggleRiskyFilter?: () => void,
  onToggleSecretMask?: () => void,
  onSwitchTab?: (tab: import('~/types/diff').ResultsTab) => void
}

const showHelp = ref(false);

export function useKeyboardHelp() {
  return { showHelp };
}

export function useKeyboard(callbacks: KeyboardCallbacks = {}) {
  function isTyping(): boolean {
    const el = document.activeElement;
    if (!el) return false;

    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;

    // CodeMirror editors use contenteditable divs with cm-editor class
    if ((el as HTMLElement).closest?.('.cm-editor')) return true;

    if ((el as HTMLElement).isContentEditable) return true;

    return false;
  }

  function handleKeydown(e: KeyboardEvent) {
    // Ctrl+Enter works even when typing
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      callbacks.onCompare?.();
      return;
    }

    // Escape always closes help
    if (e.key === 'Escape') {
      if (showHelp.value) {
        showHelp.value = false;
        e.preventDefault();
      }
      return;
    }

    // All other shortcuts are blocked when user is typing
    if (isTyping()) return;

    switch (e.key) {
      case '?':
        e.preventDefault();
        showHelp.value = !showHelp.value;
        break;
      case 'f':
        e.preventDefault();
        callbacks.onToggleFormatFilter?.();
        break;
      case 'r':
        e.preventDefault();
        callbacks.onToggleRiskyFilter?.();
        break;
      case 's':
        e.preventDefault();
        callbacks.onToggleSecretMask?.();
        break;
      case '1':
        e.preventDefault();
        callbacks.onSwitchTab?.('semantic');
        break;
      case '2':
        e.preventDefault();
        callbacks.onSwitchTab?.('raw');
        break;
      case '3':
        e.preventDefault();
        callbacks.onSwitchTab?.('tree');
        break;
      case '4':
        e.preventDefault();
        callbacks.onSwitchTab?.('summary');
        break;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return { showHelp };
}

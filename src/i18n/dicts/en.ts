import type { uk } from './uk'

// English UI chrome. Must mirror every key in `uk`.
export const en: Record<keyof typeof uk, string> = {
  'lang.name': 'English',
  'lang.switch': 'Language',

  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',

  'common.loading': 'Loading…',
  'common.retry': 'Try again',
  'common.next': 'Next',
  'common.back': 'Back',
  'common.send': 'Send',
  'common.skip': 'Skip',

  'toast.network': 'No connection. Retrying…',
  'toast.saved': 'Saved',
  'toast.error': 'Something went wrong',

  'error.title': 'Oops, something broke',
  'error.body': 'We already know about it. Try reloading the page.',
  'error.reload': 'Reload',

  'entry.title': 'How did you reach us?',
  'entry.dinein': 'I dined here',
  'entry.delivery': 'Delivery',
  'entry.haslink': 'I already have a link',
  'entry.link.placeholder': 'Paste a link or code',
  'entry.link.submit': 'Continue',
  'entry.link.invalid': "That doesn't look like a valid link",

  'welcome.title': 'Tell us how your evening went',
  'welcome.subtitle': 'A minute and you are done. Just move and tap.',
  'welcome.cta': "Let's go",

  'feed.progress': 'Beat {current} of {total}',
  'feed.mood.hint': 'Drag or tap the face',
  'feed.tags.hint': 'What exactly? Pick 1–3',
  'feed.yes': 'Yes',
  'feed.no': 'No',
  'feed.done': 'Done',

  'recap.title': 'Here is your evening',
  'recap.weak.help': 'Help us understand why',
  'recap.allgood': 'All good, send it',

  'dig.yes': "Yes, that's it",
  'dig.notquite': 'Not quite',
  'dig.ownwords': "I'll tell you",
  'dig.text.placeholder': 'A few words from you…',
  'dig.record.start': 'Record voice',
  'dig.record.stop': 'Stop',
  'dig.record.again': 'Re-record',
  'dig.send': 'Send',

  'final.title': 'Thank you!',
  'final.subtitle': 'Your evening is saved.',
  'final.email.cta': 'Leave email for a discount',
  'final.email.placeholder': 'you@email.com',
  'final.email.note': 'Discount on your next order (soon)',
  'final.share': 'Share',
  'final.share.text': 'Here is how my evening went',
}

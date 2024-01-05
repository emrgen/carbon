import BrowserDetector from 'browser-dtector';

const detector = new BrowserDetector(window.navigator.userAgent);

export const browser = detector.parseUserAgent()

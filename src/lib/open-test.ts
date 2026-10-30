/**
 * Open the test screen with a full page load rather than a client-side
 * navigation: the test screen's Content Security Policy (which lets the Desmos
 * calculator run) only applies to documents loaded at /test/*.
 */
export function openTest(attemptId: string) {
  window.location.assign(`/test/${attemptId}`);
}

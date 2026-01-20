// Safari AudioContext compatibility
interface Window {
  webkitAudioContext?: typeof AudioContext;
}

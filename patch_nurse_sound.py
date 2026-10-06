import re

def patch_nurse_layout():
    with open('frontend/src/components/nurse/NurseLayout.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    sound_func = """
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'bell'; // fallback to sine if invalid
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};
"""

    if "playNotificationSound" not in content:
        content = content.replace("export default function NurseLayout() {", sound_func + "\nexport default function NurseLayout() {")
    
    if "toast.custom" in content and "playNotificationSound();" not in content:
        content = content.replace("toast.custom((t)", "playNotificationSound();\n        toast.custom((t)")
        
    with open('frontend/src/components/nurse/NurseLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

patch_nurse_layout()
print("Patched NurseLayout.jsx")

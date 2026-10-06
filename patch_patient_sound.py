import re

def patch_patient_layout():
    with open('frontend/src/components/patient/PatientLayout.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    sound_func = """
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
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
        content = content.replace("export default function PatientLayout() {", sound_func + "\nexport default function PatientLayout() {")
    
    if "setToast({ title" in content and "playNotificationSound();" not in content:
        content = content.replace('setToast({ title, message: msg, bgColor: "bg-blue-600" });', 'playNotificationSound();\n      setToast({ title, message: msg, bgColor: "bg-blue-600" });')
        
    with open('frontend/src/components/patient/PatientLayout.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

patch_patient_layout()
print("Patched PatientLayout.jsx")

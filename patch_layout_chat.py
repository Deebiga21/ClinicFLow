import sys

with open('frontend/src/components/patient/PatientLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_icon = "FileText, Bell, User, MessageCircle"
content = content.replace("FileText, Bell, User", import_icon)

link_chat = "{ to: '/patient/profile', icon: User, label: 'PROFILE' },\n        { to: '/patient/chat', icon: MessageCircle, label: 'NURSE CHAT' }"
content = content.replace("{ to: '/patient/profile', icon: User, label: 'PROFILE' }", link_chat)

route_map_chat = "'/patient/profile': { title: 'Profile', sub: 'Your details and preferences' },\n    '/patient/chat': { title: 'Nurse Chat', sub: 'Chat directly with clinical staff' },"
content = content.replace("'/patient/profile': { title: 'Profile', sub: 'Your details and preferences' },", route_map_chat)

with open('frontend/src/components/patient/PatientLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientLayout.jsx patched")

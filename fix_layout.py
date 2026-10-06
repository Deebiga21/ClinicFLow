import re
content = open('frontend/src/components/patient/PatientLayout.jsx', encoding='utf-8').read()
content = content.replace('const [toast, setToast] = useState(null);', 'const [toast, setToast] = useState(null);\n  const [localNotifications, setLocalNotifications] = useState([]);')
content = content.replace('setToast({ title, message: msg, bgColor: "bg-blue-600" });', 'setToast({ title, message: msg, bgColor: "bg-blue-600" });\n      setLocalNotifications(prev => [{message: f"{title} - {msg}", time: new Date().toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}), unread: true}, ...prev]);')
content = content.replace('<Outlet context={{ data, loading, setBookingOpen, fetchData }} />', '<Outlet context={{ data, loading, setBookingOpen, fetchData, localNotifications }} />')
open('frontend/src/components/patient/PatientLayout.jsx', 'w', encoding='utf-8').write(content)

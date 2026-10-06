import re
content = open('frontend/src/pages/patient/PatientNotifications.jsx', encoding='utf-8').read()
content = content.replace('const { data, loading } = useOutletContext();', 'const { data, loading, localNotifications } = useOutletContext();')
content = content.replace('const notifications = data?.notifications || [];', 'const notifications = [...(localNotifications || []), ...(data?.notifications || [])];')
open('frontend/src/pages/patient/PatientNotifications.jsx', 'w', encoding='utf-8').write(content)

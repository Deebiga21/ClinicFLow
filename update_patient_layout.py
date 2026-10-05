import re

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "r") as f:
    content = f.read()

new_nav = """
  const patientItems = [
    {
      title: 'DASHBOARD',
      links: [
        { to: '/patient', end: true, icon: Home, label: 'HOME' },
        { to: '/patient/appointments', icon: Calendar, label: 'MY APPOINTMENTS' },
        { to: '#', onClick: () => setBookingOpen(true), icon: Calendar, label: 'BOOK APPOINTMENT' },
        { to: '/patient/my-visit', icon: Clock, label: 'MY TOKEN' },
        { to: '/patient/journey', icon: Map, label: 'MY JOURNEY' }
      ]
    },
    {
      title: 'RECORDS',
      links: [
        { to: '/patient/prescriptions', icon: FileText, label: 'PRESCRIPTIONS' },
        { to: '/patient/medications', icon: Pill, label: 'MEDICATIONS' },
      ]
    },
    {
      title: 'ACCOUNT',
      links: [
        { to: '/patient/notifications', icon: Bell, label: 'NOTIFICATIONS' },
        { to: '/patient/profile', icon: User, label: 'PROFILE' }
      ]
    }
  ];
"""

content = re.sub(r'const patientItems = \[.*?\];.*?\];', new_nav, content, flags=re.DOTALL)
content = content.replace("export default function PatientLayout() {", "import BookingWizard from '../../pages/patient/BookingWizard';\n\nexport default function PatientLayout() {")
content = content.replace("const location = useLocation();", "const location = useLocation();\n  const [bookingOpen, setBookingOpen] = React.useState(false);")
content = content.replace("<Outlet context={{ data, loading }} />", "<Outlet context={{ data, loading }} />\n        <BookingWizard isOpen={bookingOpen} onClose={() => setBookingOpen(false)} patientId={data?.patient?.id} />")

with open(r"d:\ClinicFLow\frontend\src\components\patient\PatientLayout.jsx", "w") as f:
    f.write(content)
print("Updated PatientLayout.jsx")

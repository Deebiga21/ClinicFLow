import re

with open('frontend/src/pages/nurse/NurseDoctorWorkload.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
if "const [selectedDept, setSelectedDept] = useState('All Departments');" not in content:
    content = content.replace('const [loading, setLoading] = useState(true);', "const [loading, setLoading] = useState(true);\n  const [selectedDept, setSelectedDept] = useState('All Departments');")

# Fix setSummary
if "setSummary(summaryRes?.data || summaryRes);" not in content:
    content = content.replace("setSummary(summaryRes);", "setSummary(summaryRes?.data || summaryRes);")

# Update header with dropdown
old_header = """    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Workload Intelligence</h1>
        <p className="text-gray-500">Monitor current and predicted clinical workload.</p>
      </div>"""

new_header = """    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Workload Intelligence</h1>
          <p className="text-gray-500">Monitor current and predicted clinical workload.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Filter Department:</label>
          <select 
            className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="All Departments">All Departments</option>
            {summary && Object.keys(summary).filter(k => k !== 'All Departments').sort().map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>"""

if old_header in content:
    content = content.replace(old_header, new_header)

# Update MetricCards to use summary[selectedDept]
old_metrics = """      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Active Doctors" value={summary.activeDoctors ?? "DATA UNAVAILABLE"} icon={UserCheck} color="blue" />
          <MetricCard title="Active Consultations" value={summary.activeConsultations ?? "DATA UNAVAILABLE"} icon={Activity} color="emerald" />
          <MetricCard title="Upcoming Appointments" value={summary.upcomingAppointments ?? "DATA UNAVAILABLE"} icon={Calendar} color="purple" />
          <MetricCard title="Avg Consult Duration" value={summary.avgDuration ?? "DATA UNAVAILABLE"} icon={Clock} color="amber" />
          <MetricCard title="Current Workload" value={summary.currentWorkload ?? "DATA UNAVAILABLE"} icon={BarChart2} color="indigo" />
          <MetricCard title="Predicted Peak" value={summary.predictedPeak ?? "DATA UNAVAILABLE"} icon={TrendingUp} color="red" />
        </div>
      ) : ("""

new_metrics = """      {summary && summary[selectedDept] ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Active Doctors" value={summary[selectedDept].activeDoctors ?? "DATA UNAVAILABLE"} icon={UserCheck} color="blue" />
          <MetricCard title="Active Consultations" value={summary[selectedDept].activeConsultations ?? "DATA UNAVAILABLE"} icon={Activity} color="emerald" />
          <MetricCard title="Upcoming Appointments" value={summary[selectedDept].upcomingAppointments ?? "DATA UNAVAILABLE"} icon={Calendar} color="purple" />
          <MetricCard title="Avg Consult Duration" value={summary[selectedDept].avgDuration ?? "DATA UNAVAILABLE"} icon={Clock} color="amber" />
          <MetricCard title="Current Workload" value={summary[selectedDept].currentWorkload ?? "DATA UNAVAILABLE"} icon={BarChart2} color="indigo" />
          <MetricCard title="Predicted Peak" value={summary[selectedDept].predictedPeak ?? "DATA UNAVAILABLE"} icon={TrendingUp} color="red" />
        </div>
      ) : ("""

if old_metrics in content:
    content = content.replace(old_metrics, new_metrics)
else:
    print("Could not replace metrics block")

# Filter doctors array based on selectedDept before grouping
old_doctor_map = """        <div className="overflow-x-auto">
          {doctors.length > 0 ? (
            Object.entries(doctors.reduce((acc, doc) => {"""

new_doctor_map = """        <div className="overflow-x-auto">
          {doctors.length > 0 ? (
            Object.entries(doctors.filter(d => selectedDept === 'All Departments' || (d.department || 'General') === selectedDept).reduce((acc, doc) => {"""

if old_doctor_map in content:
    content = content.replace(old_doctor_map, new_doctor_map)
else:
    print("Could not replace doctors map block")

with open('frontend/src/pages/nurse/NurseDoctorWorkload.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated NurseDoctorWorkload.jsx")

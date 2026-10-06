import re

content = open('frontend/src/pages/nurse/NurseDoctorWorkload.jsx', encoding='utf-8').read()

old_table = """        <div className="overflow-x-auto">
          {doctors.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Doctor</th>
                  <th className="px-6 py-3 font-medium">Current Consultations</th>
                  <th className="px-6 py-3 font-medium">Upcoming Appts</th>
                  <th className="px-6 py-3 font-medium">Avg Duration</th>
                  <th className="px-6 py-3 font-medium">Current Workload</th>
                  <th className="px-6 py-3 font-medium">Predicted Workload</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map((doc, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.currentConsultations ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.upcomingAppointments ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.avgDuration ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.currentWorkload ?? "N/A"}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.predictedWorkload ?? "N/A"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getStatusColor(doc.status)}>{doc.status || "UNKNOWN"}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="NO DOCTORS FOUND" description="No doctor data available." />
            </div>
          )}
        </div>"""

new_table = """        <div className="overflow-x-auto">
          {doctors.length > 0 ? (
            Object.entries(doctors.reduce((acc, doc) => {
                const dep = doc.department || 'General';
                if (!acc[dep]) acc[dep] = [];
                acc[dep].push(doc);
                return acc;
            }, {})).map(([dep, docs]) => (
                <div key={dep} className="mb-6">
                  <div className="bg-gray-200/60 px-6 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {dep} DEPARTMENT
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-6 py-2 font-medium w-48">Doctor</th>
                        <th className="px-6 py-2 font-medium">Current Consultations</th>
                        <th className="px-6 py-2 font-medium">Upcoming Appts</th>
                        <th className="px-6 py-2 font-medium">Avg Duration</th>
                        <th className="px-6 py-2 font-medium">Current Workload</th>
                        <th className="px-6 py-2 font-medium">Predicted Workload</th>
                        <th className="px-6 py-2 font-medium w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {docs.map((doc, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 font-bold text-gray-900">{doc.name}</td>
                          <td className="px-6 py-3 text-gray-600">{doc.currentConsultations ?? "N/A"}</td>
                          <td className="px-6 py-3 text-gray-600">{doc.upcomingAppointments ?? "N/A"}</td>
                          <td className="px-6 py-3 text-gray-600">{doc.avgDuration ?? "N/A"}</td>
                          <td className="px-6 py-3 text-gray-600">{doc.currentWorkload ?? "N/A"}</td>
                          <td className="px-6 py-3 text-gray-600">{doc.predictedWorkload ?? "N/A"}</td>
                          <td className="px-6 py-3">
                            <StatusBadge status={getStatusColor(doc.status)}>{doc.status || "UNKNOWN"}</StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            ))
          ) : (
            <div className="p-6">
              <EmptyState title="NO DOCTORS FOUND" description="No doctor data available." />
            </div>
          )}
        </div>"""

if old_table in content:
    content = content.replace(old_table, new_table)
    open('frontend/src/pages/nurse/NurseDoctorWorkload.jsx', 'w', encoding='utf-8').write(content)
    print("SUCCESS")
else:
    print("NOT FOUND")

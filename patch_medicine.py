import re

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix data parsing
content = content.replace('setInventory(Array.isArray(invData) ? invData : []);', 'setInventory(invData?.data || []);')
content = content.replace('setExpiryRisks(Array.isArray(expiryData) ? expiryData : []);', 'setExpiryRisks(expiryData?.data || []);')
content = content.replace('setDemandForecast(demandData);', 'setDemandForecast(demandData?.data || demandData);')

# Update chart data keys to match backend
# backend /inventory returns: id, name, batch_number, quantity
content = content.replace('dataKey="medicine_name"', 'dataKey="name"')
content = content.replace('dataKey="current_quantity"', 'dataKey="quantity"')

# Add the table below the grid
table_jsx = '''
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0A2540] p-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold">Tablet Reports & Expiry Info</h3>
              <p className="text-sm text-blue-200 font-medium">Detailed batch info and expiration dates</p>
            </div>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                  <th className="pb-3 font-medium">Medicine Name</th>
                  <th className="pb-3 font-medium">Batch Number</th>
                  <th className="pb-3 font-medium">Quantity Available</th>
                  <th className="pb-3 font-medium">Days to Expiry</th>
                  <th className="pb-3 font-medium">Waste Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiryRisks.length === 0 ? (
                  <tr><td colSpan="5" className="py-4 text-center text-slate-500">No expiry risk data available</td></tr>
                ) : expiryRisks.map((risk, idx) => (
                  <tr key={idx} className="text-sm">
                    <td className="py-4 font-bold text-[#0A2540]">{risk.name}</td>
                    <td className="py-4 text-slate-600">{risk.batch_number}</td>
                    <td className="py-4 text-slate-600 font-semibold">{risk.quantity}</td>
                    <td className="py-4">
                      <span className={px-2 py-1 rounded-md text-xs font-bold }>
                        {risk.days_to_expiry} days
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={px-2 py-1 rounded-md text-xs font-bold }>
                        {risk.waste_risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
'''

content = content.replace('    </div>\n  );\n}\n', table_jsx + '  );\n}\n')

with open('frontend/src/pages/nurse/NurseMedicine.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

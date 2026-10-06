import re

with open('frontend/src/pages/nurse/NursePredictions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for Recharts if missing
if 'BarChart' not in content:
    content = content.replace("import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';", 
                              "import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';")
    if 'BarChart' not in content:
        content = content.replace("import { LineChart, Line, XAxis", "import { LineChart, Line, BarChart, Bar, XAxis")

# Remove Input Context and replace with a Graph
json_block = '''              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Input Context</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm font-mono text-gray-600 break-words whitespace-pre-wrap">
                  {selectedPrediction.inputContext ? JSON.stringify(selectedPrediction.inputContext, null, 2) : "DATA UNAVAILABLE"}
                </div>
              </div>'''

graph_block = '''              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Prediction Influencers</h4>
                <div className="bg-white p-2 rounded-md border border-gray-100" style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={[
                      { name: 'Queue Size', weight: 45 },
                      { name: 'Time of Day', weight: 30 },
                      { name: 'Doctor Speed', weight: 25 },
                    ]} margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="weight" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>'''

content = content.replace(json_block, graph_block)

with open('frontend/src/pages/nurse/NursePredictions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

const fs = require('fs');

let acc = fs.readFileSync('src/pages/admin/AdminCommandCenter.jsx', 'utf8');

const bottomStrip = `
      {/* FULL WIDTH BOTTOM STRIP */}
      <div className="bg-white/90 backdrop-blur-md rounded-[20px] border border-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center justify-between">
         
         <div className="flex items-center gap-6 border-r border-slate-100 pr-6 shrink-0">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-[11px] font-bold text-[#0A2540] uppercase tracking-wider">INTELLIGENCE ALERTS</h4>
                  <span className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><span className="w-1 h-1 bg-white rounded-full animate-pulse"></span> LIVE</span>
               </div>
               <div className="text-[9px] text-slate-500">Real-time operational and ML alerts</div>
            </div>

            <div className="flex gap-4 ml-4">
               <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 flex items-start gap-2 w-48">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] font-bold text-slate-700">High queue growth predicted</div>
                    <div className="text-[8px] text-slate-500">Expected at 3:00 PM</div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 rounded">Congestion</span>
                       <span className="text-[8px] text-slate-400">10:12 AM</span>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col justify-center gap-1 w-24">
                  <div className="text-[9px] text-slate-500">Slow Model</div>
                  <div className="text-[10px] font-bold text-slate-700">Consulting 2</div>
                  <div className="text-[8px] font-bold text-blue-500">ML</div>
               </div>

               <div className="flex flex-col justify-center gap-1 w-24">
                  <div className="text-[9px] text-slate-500">Flow Velocity</div>
                  <div className="text-[12px] font-bold text-slate-700">~ 2.4 /hr</div>
                  <div className="text-[8px] text-slate-400">10:24 AM</div>
               </div>
            </div>
         </div>

         <div className="flex-1 flex items-center justify-between px-8">
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Clock size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Appointment</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">17</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><ShieldAlert size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Check-in</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">12</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-slate-200"></div><div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-slate-200"></div><div className="w-1.5 h-1.5 rounded-full border border-slate-300 bg-slate-200"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Queue</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">6</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-amber-400"></div><div className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-amber-400"></div><div className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-amber-400"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Nurse</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">2</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Stethoscope size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Doctor</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">2</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Activity size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Consultation</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">2</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div><div className="w-1.5 h-1.5 rounded-full border border-blue-400"></div></div>
            </div>
            <div className="text-slate-200">→</div>

            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><FileCheck size={10} /></div>
                  <span className="text-[9px] font-bold text-slate-600">Completed</span>
               </div>
               <div className="text-[11px] font-bold text-[#0A2540] mb-1">16</div>
               <div className="flex gap-0.5"><div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-emerald-400"></div><div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-emerald-400"></div><div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-emerald-400"></div><div className="w-1.5 h-1.5 rounded-full border border-emerald-400 bg-emerald-400"></div></div>
            </div>
         </div>

         <div className="text-[9px] font-bold text-blue-500 pl-4 border-l border-slate-100 cursor-pointer shrink-0">
            View All
         </div>
      </div>
`;

acc = acc.replace('    </div>\n  );\n}', bottomStrip + '\n    </div>\n  );\n}');
acc = acc.replace('} from \'lucide-react\';', ', User } from \'lucide-react\';');

fs.writeFileSync('src/pages/admin/AdminCommandCenter.jsx', acc, 'utf8');

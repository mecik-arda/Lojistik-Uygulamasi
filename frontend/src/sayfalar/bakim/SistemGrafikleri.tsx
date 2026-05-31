import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface SaglikVerisi {
  zaman: string;
  cpu: number;
  ram: number;
}

export default function SistemGrafikleri({ kullaniciId }: { kullaniciId: string }) {
  const [veriler, verilerAyarla] = useState<SaglikVerisi[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/api/ws/saglik/${kullaniciId}`);
    
    ws.onmessage = (olay) => {
      const veri = JSON.parse(olay.data);
      if (veri.tip === 'saglik_guncellemesi') {
        const simdi = new Date();
        const zamanMetni = `${simdi.getHours()}:${simdi.getMinutes()}:${simdi.getSeconds()}`;
        
        verilerAyarla((onceki) => {
          const yeniVeri = [...onceki, { zaman: zamanMetni, cpu: veri.cpu, ram: veri.ram }];
          if (yeniVeri.length > 20) yeniVeri.shift(); // Son 20 saniyeyi tut
          return yeniVeri;
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [kullaniciId]);

  return (
    <div className="cam-kart p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--metin-birincil)' }}>
        <Activity className="w-5 h-5 text-purple-500" />
        Canlı Kaynak Tüketimi (WebSocket)
      </h3>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={veriler} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="renkCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="renkRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="zaman" stroke="var(--metin-soluk)" fontSize={12} />
            <YAxis stroke="var(--metin-soluk)" fontSize={12} domain={[0, 100]} />
            <CartesianGrid strokeDasharray="3 3" stroke="var(--kenarlik)" vertical={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--arka-plan-cam)', borderColor: 'var(--kenarlik)', color: 'var(--metin-birincil)' }}
              itemStyle={{ color: 'var(--metin-birincil)' }}
            />
            <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#renkCpu)" name="CPU %" isAnimationActive={false} />
            <Area type="monotone" dataKey="ram" stroke="#10b981" fillOpacity={1} fill="url(#renkRam)" name="RAM %" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

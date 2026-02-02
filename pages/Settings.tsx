
import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h1 className="text-3xl font-bold mb-2">Settings / Goobaha</h1>
        <p className="text-gray-400">Control your experience in Abdijaliil / Xakamee khibradaada Abdijaliil</p>
      </header>

      {/* Account Section */}
      <section className="bg-slate-800/40 rounded-3xl overflow-hidden border border-slate-700">
        <div className="p-6 flex items-center gap-4 border-b border-slate-700">
          <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-2xl font-bold">
            A
          </div>
          <div>
            <h2 className="font-bold text-lg">Abdijaliil User</h2>
            <p className="text-gray-400 text-sm">user@abdijaliil.com</p>
          </div>
          <button className="ml-auto text-amber-500 text-sm font-semibold hover:underline">Edit / Wax ka beddel</button>
        </div>
        <div className="p-2">
          <SettingsItem title="Current Subscription / Isdiiwaangalada hadda" value="Premium" />
          <SettingsItem title="Language / Luuqada" value="Somali & English" />
        </div>
      </section>

      {/* Playback Section */}
      <section>
        <h3 className="text-gray-500 text-sm font-bold px-4 mb-3">Playback & Download / Daawashada & Soo dejinta</h3>
        <div className="bg-slate-800/40 rounded-3xl p-2 border border-slate-700">
          <ToggleItem title="High Quality Video / Fiidiyowga tayada sare" description="Use more data for better quality / Isticmaal xog badan si aad u hesho tayada fiican" defaultChecked={true} />
          <ToggleItem title="WiFi Only Download / Soo dejinta WiFi kaliya" description="Save data usage / Keydin isticmaalka xogta" defaultChecked={true} />
          <ToggleItem title="Auto Play / Si toos ah u daawasho" description="Play similar videos after queue ends / Daawasho fiidiyowyada u eg marka liiska dhamaado" defaultChecked={false} />
        </div>
      </section>

      {/* About Section */}
      <section>
        <h3 className="text-gray-500 text-sm font-bold px-4 mb-3">About / Ku saabsan</h3>
        <div className="bg-slate-800/40 rounded-3xl p-2 border border-slate-700">
          <SettingsItem title="Terms of Use / Shuruudaha isticmaalka" />
          <SettingsItem title="Privacy Policy / Siyaasadda sirta" />
          <SettingsItem title="Contact Us / Nala soo xidhiidh" />
        </div>
      </section>

      {/* Version Footer */}
      <footer className="pt-10 flex flex-col items-center opacity-40">
        <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center font-bold text-slate-400 text-xl mb-4">A</div>
        <p className="text-xs">Abdijaliil - Somali & English Content</p>
        <p className="text-[10px] mt-1 font-mono">Version: 1.0.0 (build 966.0.72)</p>
      </footer>
    </div>
  );
};

const SettingsItem: React.FC<{ title: string; value?: string }> = ({ title, value }) => (
  <div className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors cursor-pointer group">
    <span className="text-sm font-medium">{title}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs text-amber-500/80">{value}</span>}
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600 group-hover:text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
);

const ToggleItem: React.FC<{ title: string; description: string; defaultChecked: boolean }> = ({ title, description, defaultChecked }) => {
  const [enabled, setEnabled] = React.useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
      <button 
        onClick={() => setEnabled(!enabled)}
        className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-amber-500' : 'bg-slate-600'}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enabled ? 'right-6' : 'right-1'}`} />
      </button>
    </div>
  );
};

export default Settings;

import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Plus, RefreshCw, ShieldCheck, Store, X, AlertCircle } from 'lucide-react';
import { CompanyLocation } from '../types';
import { bootstrapOrganization, createCompanyLocation, createOrganizationInvitation, getEnterpriseContext, updateCompanyLocation } from '../utils/enterpriseService';
import { getPlanForLocationCount } from '../data/enterprisePricing';

interface Props { isOpen:boolean; onClose:()=>void; onLocationCountChange?:(count:number)=>void; }

export const EnterpriseLocationManagerModal: React.FC<Props> = ({ isOpen, onClose, onLocationCountChange }) => {
  const { currentLanguage, t } = useLanguage();

  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [companyName,setCompanyName]=useState('');
  const [firstLocation,setFirstLocation]=useState('');
  const [newLocation,setNewLocation]=useState('');
  const [inviteEmail,setInviteEmail]=useState('');
  const [inviteType,setInviteType]=useState<'admin'|'employee'>('employee');
  const [inviteUrl,setInviteUrl]=useState<string|null>(null);
  const [timezone,setTimezone]=useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York');
  const [organization,setOrganization]=useState<any|null>(null);
  const [locations,setLocations]=useState<CompanyLocation[]>([]);
  const [billing,setBilling]=useState<any|null>(null);

  const activeCount=useMemo(()=>Math.max(1,locations.filter(l=>l.active).length),[locations]);
  const recommended=useMemo(()=>getPlanForLocationCount(activeCount),[activeCount]);

  const refresh=async()=>{
    setLoading(true); setError(null);
    try { const ctx=await getEnterpriseContext(); setOrganization(ctx.organization); setLocations(ctx.locations||[]); setBilling(ctx.billing); onLocationCountChange?.(ctx.billing?.activeLocationCount||Math.max(1,(ctx.locations||[]).length)); }
    catch(e:any){setError(e?.message||'Unable to load company locations.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{if(isOpen) void refresh();},[isOpen]);

  const bootstrap=async()=>{
    if(!companyName.trim()||!firstLocation.trim()) return setError('Company name and first location are required.');
    setLoading(true);setError(null);
    try{await bootstrapOrganization(companyName.trim(),firstLocation.trim(),timezone);await refresh();}
    catch(e:any){setError(e?.message||'Company setup failed.');setLoading(false);}
  };
  const add=async()=>{
    if(!newLocation.trim()) return;
    setLoading(true);setError(null);
    try{await createCompanyLocation({name:newLocation.trim(),timezone});setNewLocation('');await refresh();}
    catch(e:any){setError(e?.message||'Location could not be created.');setLoading(false);}
  };
  const invite=async()=>{
    if(!inviteEmail.trim()) return setError('Invitation email is required.');
    setLoading(true);setError(null);setInviteUrl(null);
    try{const result=await createOrganizationInvitation({email:inviteEmail.trim(),userType:inviteType,roleCode:inviteType==='admin'?'manager':'role-employee',authorizedLocationIds:inviteType==='admin'?['*']:[]});setInviteUrl(result.inviteUrl);setInviteEmail('');}
    catch(e:any){setError(e?.message||'Invitation could not be created.');}
    finally{setLoading(false);}
  };
  const toggle=async(loc:CompanyLocation)=>{
    setLoading(true);setError(null);
    try{await updateCompanyLocation(loc.id,{active:!loc.active});await refresh();}
    catch(e:any){setError(e?.message||'Location could not be updated.');setLoading(false);}
  };

  if(!isOpen)return null;
  return <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
      <div className="bg-slate-950 text-white p-6 relative shrink-0">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
        <div className="text-xs font-black uppercase tracking-widest text-sky-300 flex gap-2 items-center"><Building2 className="w-4 h-4"/>Company & location control</div>
        <h2 className="text-2xl font-black mt-2">One company sign-in. Every authorized store.</h2>
        <p className="text-sm text-slate-300 mt-2">Corporate admins manage all locations in one tenant. Plan limits are checked on the server before a new active store can be created.</p>
      </div>
      <div className="p-6 overflow-y-auto space-y-5">
        {error&&<div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5"/>{error}</div>}
        {loading&&<div className="text-sm text-slate-500 flex gap-2 items-center"><RefreshCw className="w-4 h-4 animate-spin"/>Refreshing enterprise account…</div>}
        {!organization ? <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
          <div><div className="font-black text-lg">Initialize your company workspace</div><div className="text-sm text-slate-600">This creates the organization, first store, owner membership, and Free billing entitlement.</div></div>
          <div className="grid md:grid-cols-2 gap-3"><input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Company name" className="border rounded-xl px-3 py-2.5"/><input value={firstLocation} onChange={e=>setFirstLocation(e.target.value)} placeholder="First store name" className="border rounded-xl px-3 py-2.5"/></div>
          <input value={timezone} onChange={e=>setTimezone(e.target.value)} placeholder="Timezone" className="border rounded-xl px-3 py-2.5 w-full"/>
          <button disabled={loading} onClick={bootstrap} className="px-4 py-2.5 bg-slate-950 text-white rounded-xl font-black">Create company workspace</button>
        </div> : <>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border rounded-2xl"><Building2 className="w-5 h-5 text-indigo-600"/><div className="font-black mt-2">{organization.name}</div><div className="text-xs text-slate-500">Company tenant</div></div>
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl"><Store className="w-5 h-5 text-sky-600"/><div className="font-black mt-2">{billing?.activeLocationCount||activeCount} active store(s)</div><div className="text-xs text-slate-500">Server billing meter</div></div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl"><ShieldCheck className="w-5 h-5 text-emerald-600"/><div className="font-black mt-2">{billing?.tierId||recommended.id}</div><div className="text-xs text-slate-500">{billing?.status||'free'} entitlement</div></div>
          </div>
          <div className="rounded-2xl border p-5">
            <div className="font-black">Add a store</div><div className="text-sm text-slate-600 mt-1">If the next store exceeds the current plan, the server blocks creation and returns the required tier.</div>
            <div className="flex flex-col md:flex-row gap-2 mt-4"><input value={newLocation} onChange={e=>setNewLocation(e.target.value)} placeholder="New store name" className="border rounded-xl px-3 py-2.5 flex-1"/><input value={timezone} onChange={e=>setTimezone(e.target.value)} className="border rounded-xl px-3 py-2.5 md:w-56"/><button onClick={add} disabled={loading||!newLocation.trim()} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2"><Plus className="w-4 h-4"/>Add store</button></div>
          </div>
          <div className="rounded-2xl border p-5">
            <div className="font-black">Invite a manager or employee</div><div className="text-sm text-slate-600 mt-1">Invitations are single-use, expire after 7 days, and bind the signed-in email to this company tenant.</div>
            <div className="flex flex-col md:flex-row gap-2 mt-4"><input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="name@company.com" className="border rounded-xl px-3 py-2.5 flex-1"/><select value={inviteType} onChange={e=>setInviteType(e.target.value as 'admin'|'employee')} className="border rounded-xl px-3 py-2.5"><option value="employee">Employee</option><option value="admin">Manager/Admin</option></select><button onClick={invite} disabled={loading||!inviteEmail.trim()} className="px-4 py-2.5 bg-slate-950 text-white rounded-xl font-black">Create invite</button></div>
            {inviteUrl&&<div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm break-all"><div className="font-black text-emerald-800 mb-1">Invitation created — copy and send securely</div>{inviteUrl}</div>}
          </div>
          <div className="space-y-2"><div className="font-black">Locations</div>{locations.length===0?<div className="text-sm text-slate-500">No locations returned for your membership.</div>:locations.map(loc=><div key={loc.id} className="flex items-center gap-3 border rounded-2xl p-4"><MapPin className="w-5 h-5 text-slate-400"/><div className="flex-1"><div className="font-bold">{loc.name}</div><div className="text-xs text-slate-500">{loc.code||loc.id} · {loc.timezone}</div></div><span className={`text-xs font-black px-2 py-1 rounded-full ${loc.active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{loc.active?'ACTIVE':'INACTIVE'}</span><button onClick={()=>toggle(loc)} className="text-xs font-bold border rounded-lg px-3 py-2">{loc.active?'Deactivate':'Activate'}</button></div>)}</div>
        </>}
      </div>
    </div>
  </div>;
};
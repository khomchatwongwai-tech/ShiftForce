import type { Employee, Shift, AttendancePunch, ShiftTradeRequest, Announcement, TimeOffRequest, ShiftSwapRequest, SickDayReport, AvailabilityRequest, ShiftSlotRequest, AuditLogEntry } from '../types';
import { getSupabase } from './client';
type Unsubscribe = () => void;
const reqOrg=(v?:string)=>{if(!v?.trim()) throw new Error('organizationId is required'); return v.trim();};
const payload=<T>(r:any)=>(r?.payload ?? r) as T;
async function list<T>(table:string,org:string,order='updated_at'):Promise<T[]>{
  let q=getSupabase().from(table).select('*').eq('organization_id',reqOrg(org));
  if(order) q=q.order(order,{ascending:false});
  const {data,error}=await q; if(error) throw error; return (data??[]).map(payload<T>);
}
function sub<T>(table:string,org:string,cb:(x:T[])=>void,order='updated_at'):Unsubscribe{
  const sb=getSupabase(); let dead=false;
  const refresh=async()=>{try{const x=await list<T>(table,org,order); if(!dead) cb(x);}catch(e){console.error('[Supabase]',table,e)}};
  void refresh();
  const ch=sb.channel(`wq:${table}:${org}`).on('postgres_changes',{event:'*',schema:'public',table,filter:`organization_id=eq.${org}`},()=>void refresh()).subscribe();
  return ()=>{dead=true; void sb.removeChannel(ch);};
}
async function up(table:string,item:any,extra:any={}){
  const row={id:String(item.id),organization_id:reqOrg(item.organizationId),payload:item,updated_at:new Date().toISOString(),...extra};
  const {error}=await getSupabase().from(table).upsert(row,{onConflict:'id'}); if(error) throw error;
}
export const firestoreService={
  subscribeEmployees:(o:string,c:(x:Employee[])=>void)=>sub<Employee>('employees',o,c),
  saveEmployee:(e:Employee)=>up('employees',e,{firebase_uid:(e as any).firebaseUid??null,location_id:(e as any).locationId??null,email:(e as any).email??null,display_name:(e as any).name??(e as any).displayName??null,active:(e as any).active!==false}),
  deleteEmployee:async(id:string)=>{const {error}=await getSupabase().from('employees').delete().eq('id',id); if(error) throw error;},
  seedEmployeesIfEmpty:async(items:Employee[])=>{if(import.meta.env.DEV&&import.meta.env.VITE_ENABLE_DEMO_AUTH==='true') for(const e of items) await up('employees',e);},
  subscribeShifts:(o:string,c:(x:Shift[])=>void)=>sub<Shift>('shifts',o,c,'starts_at'),
  saveShift:(s:Shift)=>up('shifts',s,{employee_id:(s as any).employeeId??null,location_id:(s as any).locationId??null,starts_at:(s as any).startTime??(s as any).startsAt??null,ends_at:(s as any).endTime??(s as any).endsAt??null,status:(s as any).status??'scheduled'}),
  deleteShift:async(id:string)=>{const {error}=await getSupabase().from('shifts').delete().eq('id',id); if(error) throw error;},
  subscribePunches:(o:string,c:(x:AttendancePunch[])=>void)=>sub<AttendancePunch>('punches',o,c,'punched_at'),
  recordPunch:(p:AttendancePunch)=>up('punches',p,{employee_id:(p as any).employeeId??null,location_id:(p as any).locationId??null,punched_at:(p as any).timestamp??new Date().toISOString(),punch_type:(p as any).type??'clock_in'}),
  subscribeTrades:(o:string,c:(x:ShiftTradeRequest[])=>void)=>sub<ShiftTradeRequest>('shift_trades',o,c),
  saveTrade:(x:ShiftTradeRequest)=>up('shift_trades',x,{employee_id:(x as any).employeeId??(x as any).requesterId??null,status:(x as any).status??'pending'}),
  getUserProfile:async(uid:string)=>{const {data,error}=await getSupabase().from('users').select('*').eq('firebase_uid',uid).maybeSingle(); if(error) throw error; return data?{...(data.payload??{}),...data,userId:data.firebase_uid,organizationId:data.organization_id}:null;},
  saveUserProfile:async(p:any)=>{const {error}=await getSupabase().from('users').upsert({firebase_uid:p.userId,organization_id:p.organizationId,email:p.email,display_name:p.displayName,role:p.role,employee_id:p.employeeId??null,payload:p,updated_at:new Date().toISOString()},{onConflict:'firebase_uid'}); if(error) throw error;},
  subscribeUserProfile:(uid:string,cb:(p:any)=>void)=>{const sb=getSupabase();let dead=false;const r=async()=>{const {data}=await sb.from('users').select('*').eq('firebase_uid',uid).maybeSingle();if(!dead&&data)cb({...(data.payload??{}),...data,userId:data.firebase_uid,organizationId:data.organization_id});};void r();const ch=sb.channel(`wq:user:${uid}`).on('postgres_changes',{event:'*',schema:'public',table:'users',filter:`firebase_uid=eq.${uid}`},()=>void r()).subscribe();return()=>{dead=true;void sb.removeChannel(ch)};},
  subscribeTimeOffRequests:(o:string,c:(x:TimeOffRequest[])=>void)=>sub<TimeOffRequest>('time_off_requests',o,c),
  saveTimeOffRequest:(x:TimeOffRequest)=>up('time_off_requests',x,{employee_id:(x as any).employeeId??null,status:(x as any).status??'pending'}),
  subscribeShiftSwapRequests:(o:string,c:(x:ShiftSwapRequest[])=>void)=>sub<ShiftSwapRequest>('shift_swap_requests',o,c),
  saveShiftSwapRequest:(x:ShiftSwapRequest)=>up('shift_swap_requests',x,{employee_id:(x as any).employeeId??null,status:(x as any).status??'pending'}),
  subscribeSickReports:(o:string,c:(x:SickDayReport[])=>void)=>sub<SickDayReport>('sick_reports',o,c),
  saveSickReport:(x:SickDayReport)=>up('sick_reports',x,{employee_id:(x as any).employeeId??null,status:(x as any).status??'pending'}),
  subscribeAvailabilityRequests:(o:string,c:(x:AvailabilityRequest[])=>void)=>sub<AvailabilityRequest>('availability_requests',o,c),
  saveAvailabilityRequest:(x:AvailabilityRequest)=>up('availability_requests',x,{employee_id:(x as any).employeeId??null,status:(x as any).status??'pending'}),
  subscribeShiftSlotRequests:(o:string,c:(x:ShiftSlotRequest[])=>void)=>sub<ShiftSlotRequest>('shift_slot_requests',o,c),
  saveShiftSlotRequest:(x:ShiftSlotRequest)=>up('shift_slot_requests',x,{employee_id:(x as any).employeeId??null,status:(x as any).status??'pending'}),
  subscribeAuditLogs:(o:string,c:(x:AuditLogEntry[])=>void)=>sub<AuditLogEntry>('audit_logs',o,c,'created_at'),
  subscribeAnnouncements:(o:string,c:(x:Announcement[])=>void)=>sub<Announcement>('announcements',o,c,'created_at'),
  saveAnnouncement:(x:Announcement)=>up('announcements',x,{created_by:(x as any).createdBy??null}),
};
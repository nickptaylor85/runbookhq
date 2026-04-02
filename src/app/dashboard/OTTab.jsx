'use client';
import React, { useState, useEffect, useCallback } from 'react';

const PURDUE_ZONES = [
  { id:'L4',  label:'Level 4',   name:'Enterprise / IT Network',    color:'#4f8fff', bg:'#4f8fff08', icon:'🏢', desc:'ERP, corporate IT, business systems. Standard IT security rules apply.' },
  { id:'L35', label:'Level 3.5', name:'Industrial DMZ',             color:'#f0a030', bg:'#f0a03008', icon:'🔀', desc:'Demilitarised zone between IT and OT. Jump servers, data diodes, historians.' },
  { id:'L3',  label:'Level 3',   name:'Manufacturing Operations',   color:'#8b6fff', bg:'#8b6fff08', icon:'📊', desc:'MES, batch management, production scheduling. Cross-zone traffic monitored.' },
  { id:'L2',  label:'Level 2',   name:'Supervisory Control',        color:'#f97316', bg:'#f9731608', icon:'🖥', desc:'SCADA servers, HMI workstations, engineering stations, historians.' },
  { id:'L1',  label:'Level 1',   name:'Controllers',                color:'#22d49a', bg:'#22d49a08', icon:'⚙', desc:'PLCs, RTUs, DCS controllers. NEVER isolate without plant engineer sign-off.' },
  { id:'L0',  label:'Level 0',   name:'Field Devices',              color:'#6b7a94', bg:'#6b7a9408', icon:'📡', desc:'Sensors, actuators, flow meters, transmitters. Physical process layer.' },
];

const IEC_FRS = [
  { id:'FR1', name:'Identification & Authentication', code:'IAC', mitre:['T0812','T0859','T0807','T0866'] },
  { id:'FR2', name:'Use Control',                     code:'UC',  mitre:['T0806','T0836','T0855'] },
  { id:'FR3', name:'System Integrity',                code:'SI',  mitre:['T0831','T0832','T0843','T0862','T0839'] },
  { id:'FR4', name:'Data Confidentiality',            code:'DC',  mitre:['T0830','T0840','T0882'] },
  { id:'FR5', name:'Restricted Data Flow',            code:'RDF', mitre:['T0884','T0885','T0886'] },
  { id:'FR6', name:'Timely Response to Events',       code:'TRE', mitre:['T0815','T0826','T0814'] },
  { id:'FR7', name:'Resource Availability',           code:'RA',  mitre:['T0816','T0813','T0817'] },
];

const DEMO_ASSETS = [
  { id:'plc-001', name:'PLC-TURBINE-01', type:'PLC', vendor:'Siemens', model:'S7-1500', zone:'L1', ip:'192.168.100.10', status:'online', firmware:'V2.9.2', lastSeen:'2m ago', protocols:['Modbus TCP','S7Comm'], cveCount:2, riskScore:52, source:'Claroty', tags:['claroty','ot','l1'] },
  { id:'plc-002', name:'PLC-PUMP-01', type:'PLC', vendor:'Allen Bradley', model:'ControlLogix 1756', zone:'L1', ip:'192.168.100.11', status:'online', firmware:'V33.011', lastSeen:'1m ago', protocols:['EtherNet/IP','CIP'], cveCount:0, riskScore:20, source:'Claroty', tags:['claroty','ot','l1'] },
  { id:'plc-003', name:'PLC-VALVE-BANK-A', type:'PLC', vendor:'Siemens', model:'S7-300', zone:'L1', ip:'192.168.100.12', status:'degraded', firmware:'V3.3.13', lastSeen:'8m ago', protocols:['Modbus RTU','Profibus'], cveCount:4, riskScore:75, source:'Nozomi', tags:['nozomi','ot','l1'] },
  { id:'rtu-001', name:'RTU-SUBSTATION-04', type:'RTU', vendor:'ABB', model:'RTU500', zone:'L1', ip:'192.168.100.20', status:'online', firmware:'12.7.1', lastSeen:'30s ago', protocols:['DNP3','IEC 60870-5-104'], cveCount:1, riskScore:35, source:'Dragos', tags:['dragos','ot','l1'] },
  { id:'rtu-002', name:'RTU-REMOTE-07', type:'RTU', vendor:'GE', model:'D25', zone:'L1', ip:'192.168.100.21', status:'online', firmware:'7.42', lastSeen:'5m ago', protocols:['DNP3'], cveCount:0, riskScore:20, source:'Dragos', tags:['dragos','ot','l1'] },
  { id:'hmi-001', name:'HMI-CONTROL-ROOM-01', type:'HMI', vendor:'Wonderware', model:'InTouch 2020', zone:'L2', ip:'192.168.101.10', status:'online', firmware:'20.1.100', lastSeen:'1m ago', protocols:['OPC-UA','Modbus TCP'], cveCount:1, riskScore:28, source:'Claroty', tags:['claroty','ot','l2'] },
  { id:'hmi-002', name:'HMI-ENGINEER-STATION', type:'HMI', vendor:'Rockwell', model:'FactoryTalk View', zone:'L2', ip:'192.168.101.11', status:'online', firmware:'13.00', lastSeen:'4m ago', protocols:['EtherNet/IP','OPC-DA'], cveCount:3, riskScore:48, source:'Claroty', tags:['claroty','ot','l2'] },
  { id:'scada-001', name:'SCADA-PRIMARY', type:'SCADA', vendor:'Ignition', model:'8.1 SCADA Server', zone:'L2', ip:'192.168.101.5', status:'online', firmware:'8.1.24', lastSeen:'30s ago', protocols:['OPC-UA','Modbus TCP','DNP3'], cveCount:0, riskScore:15, source:'Nozomi', tags:['nozomi','ot','l2'] },
  { id:'hist-001', name:'HISTORIAN-01', type:'Historian', vendor:'OSIsoft', model:'PI Server 2023', zone:'L2', ip:'192.168.101.6', status:'online', firmware:'2023 R1', lastSeen:'1m ago', protocols:['OPC-DA','PI API'], cveCount:1, riskScore:25, source:'Nozomi', tags:['nozomi','ot','l2'] },
  { id:'mes-001', name:'MES-PRODUCTION', type:'MES Server', vendor:'Siemens', model:'SIMATIC IT', zone:'L3', ip:'10.50.1.10', status:'online', firmware:'8.0 SP2', lastSeen:'2m ago', protocols:['OPC-UA','REST API'], cveCount:0, riskScore:12, source:'Armis', tags:['armis','ot','l3'] },
  { id:'dmz-001', name:'JUMP-SERVER-OT', type:'Jump Server', vendor:'Citrix', model:'Virtual Apps', zone:'L35', ip:'10.100.1.5', status:'online', firmware:'2308', lastSeen:'1m ago', protocols:['RDP','SSH'], cveCount:1, riskScore:30, source:'Armis', tags:['armis','ot','l35'] },
  { id:'dmz-002', name:'DATA-DIODE-01', type:'Data Diode', vendor:'Waterfall', model:'Unidirectional GW', zone:'L35', ip:'10.100.1.10', status:'online', firmware:'4.2.1', lastSeen:'30s ago', protocols:['Custom'], cveCount:0, riskScore:5, source:'Armis', tags:['armis','ot','l35'] },
  { id:'erp-001', name:'ERP-SAP-PROD', type:'ERP Server', vendor:'SAP', model:'S4/HANA', zone:'L4', ip:'10.200.1.100', status:'online', firmware:'HANA 2.0', lastSeen:'2m ago', protocols:['REST API','RFC'], cveCount:0, riskScore:8, source:'Armis', tags:['armis','ot','l4'] },
  { id:'sen-001', name:'FLOW-METER-BANK-A', type:'Flow Meter', vendor:'Endress+Hauser', model:'Promag', zone:'L0', ip:'192.168.200.10', status:'online', firmware:'01.05', lastSeen:'10s ago', protocols:['Modbus RTU','HART'], cveCount:0, riskScore:20, source:'Claroty', tags:['claroty','ot','l0'] },
  { id:'sen-002', name:'PRESSURE-TX-12', type:'Pressure Transmitter', vendor:'Yokogawa', model:'EJA110E', zone:'L0', ip:'192.168.200.11', status:'compromised', firmware:'V1.04', lastSeen:'1m ago', protocols:['HART','4-20mA'], cveCount:0, riskScore:60, source:'Claroty', tags:['claroty','ot','l0'] },
  { id:'sen-003', name:'TEMP-SENSOR-ARRAY', type:'Temperature Sensor', vendor:'ABB', model:'TSP341', zone:'L0', ip:'192.168.200.20', status:'online', firmware:'A.02', lastSeen:'30s ago', protocols:['HART'], cveCount:0, riskScore:20, source:'Nozomi', tags:['nozomi','ot','l0'] },
];

const DEMO_ALERTS = [
  { id:'ot-a1', title:'Unauthorised Modbus write to PLC-TURBINE-01', severity:'Critical', source:'Claroty', device:'PLC-TURBINE-01', zone:'L1', ip:'192.168.100.10', protocol:'Modbus TCP', time:'09:42', verdict:'Pending', confidence:0, description:'Unexpected Modbus write command to holding registers on turbine PLC from engineering workstation IP not in approved list. Function code 06 to output coil.', mitre:'T0836', recommendation:'Notify plant engineer immediately. Do not isolate. Verify via Claroty audit log. Check HMI-ENGINEER-STATION login history.', safeToAutoAct:false },
  { id:'ot-a2', title:'Remote HMI access from non-whitelisted IP', severity:'High', source:'Nozomi', device:'HMI-CONTROL-ROOM-01', zone:'L2', ip:'185.220.101.42', protocol:'RDP', time:'09:51', verdict:'Pending', confidence:0, description:'RDP session established to SCADA HMI from external IP not in approved remote access list. Session active 4 minutes. Jump server policy violation.', mitre:'T0822', recommendation:'Alert plant supervisor and OT security team. Do not terminate session without plant engineer approval. Enable enhanced logging on jump server.', safeToAutoAct:false },
  { id:'ot-a3', title:'Anomalous DNP3 traffic: Engineering station to RTU-04', severity:'High', source:'Dragos', device:'RTU-SUBSTATION-04', zone:'L1', ip:'192.168.100.20', protocol:'DNP3', time:'10:08', verdict:'Pending', confidence:0, description:'DNP3 unsolicited response flood from RTU-SUBSTATION-04 to engineering workstation 847 packets in 10 minutes vs baseline of 12. Possible DNP3 spoofing or configuration change.', mitre:'T0815', recommendation:'Cross-reference with scheduled maintenance window. If no maintenance active: notify substation engineer, enable DNP3 audit logging. Do NOT interrupt RTU communications without substation engineer present.', safeToAutoAct:false },
  { id:'ot-a4', title:'New unmanaged device on OT network segment', severity:'Medium', source:'Armis', device:'Unknown-192.168.100.99', zone:'L1', ip:'192.168.100.99', protocol:'Unknown', time:'10:24', verdict:'Pending', confidence:0, description:'Armis detected previously unseen MAC address on L1 network segment. Device type: industrial switch. Not in asset inventory. Possible rogue device or misconfigured equipment.', mitre:'T0865', recommendation:'Identify device via plant walkdown before any network action. Create work order for asset inventory update. Monitor traffic passively until identified.', safeToAutoAct:false },
  { id:'ot-a5', title:'ICS protocol anomaly: excessive SCADA polling rate', severity:'Medium', source:'Claroty', device:'SCADA-PRIMARY', zone:'L2', ip:'192.168.101.5', protocol:'OPC-UA', time:'10:39', verdict:'SUS', confidence:62, description:'SCADA server polling PLCs at 10x normal rate (500ms vs 5s). Could indicate SCADA misconfiguration, script error, or unauthorised automated query. CPU impact on PLC-VALVE-BANK-A elevated to 78%.', mitre:'T0856', recommendation:'Check SCADA project for recent changes. High CPU on PLC-VALVE-BANK-A is a concern. Notify process engineer if sustained above 80%. Reduce poll rate via SCADA config if confirmed misconfiguration.', safeToAutoAct:false },
  { id:'ot-a6', title:'Firmware version mismatch detected: PLC-VALVE-BANK-A', severity:'Low', source:'Nozomi', device:'PLC-VALVE-BANK-A', zone:'L1', ip:'192.168.100.12', protocol:'Profibus', time:'11:15', verdict:'SUS', confidence:44, description:'Nozomi detected PLC-VALVE-BANK-A running firmware V3.3.13 with 4 CVEs including CVE-2023-38876 (CVSS 7.5, remote code execution via crafted Modbus packet). Firmware update required.', mitre:'T0862', recommendation:'Schedule firmware update during next planned maintenance window. Do not interrupt current operations. Apply compensating control: block external Modbus access to this PLC at L3.5 DMZ.', safeToAutoAct:false },
];

const DEMO_CROSS_ZONE = [
  { from:'L4', to:'L35', label:'Data sync', count:847, anomalous:false },
  { from:'L35', to:'L3', label:'MES update', count:23, anomalous:false },
  { from:'L3', to:'L2', label:'Production order push', count:156, anomalous:false },
  { from:'L2', to:'L1', label:'Control commands', count:2840, anomalous:false },
  { from:'L1', to:'L0', label:'Field comms', count:14200, anomalous:false },
  { from:'L2', to:'L0', label:'Direct poll - ANOMALOUS', count:847, anomalous:true },
  { from:'L4', to:'L2', label:'IT to SCADA bypass - ANOMALOUS', count:12, anomalous:true },
];

const DEVICE_ICONS = { PLC:'⚙', RTU:'📡', HMI:'🖥', SCADA:'📊', Historian:'🗄', 'MES Server':'🏭', 'Jump Server':'🔀', 'Data Diode':'🛡', 'ERP Server':'🏢', 'Flow Meter':'💧', 'Pressure Transmitter':'🔴', 'Temperature Sensor':'🌡', Unknown:'🔧' };
const STATUS_COLOR = { online:'#22d49a', degraded:'#f0a030', compromised:'#f0405e', offline:'#6b7a94', unknown:'#4a5568' };
const SEV_COLOR = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };

function isInMaintenance(zones, windows) {
  const now = Date.now();
  return windows.some(function(w) { return w.start <= now && w.end >= now && (w.zones.length === 0 || w.zones.some(function(z) { return zones.includes(z); })); });
}

function computeIEC62443(assets, alerts) {
  return PURDUE_ZONES.map(function(zone) {
    const zAssets = assets.filter(function(a) { return a.zone === zone.id; });
    const zAlerts = alerts.filter(function(a) { return a.zone === zone.id; });
    const totalCVEs = zAssets.reduce(function(s, a) { return s + (a.cveCount || 0); }, 0);
    const frs = IEC_FRS.map(function(fr) {
      const frAlerts = zAlerts.filter(function(a) { return fr.mitre.includes(a.mitre || ''); });
      let sl = 4;
      if (frAlerts.some(function(a) { return a.severity === 'Critical'; })) sl = Math.min(sl, 1);
      else if (frAlerts.some(function(a) { return a.severity === 'High'; })) sl = Math.min(sl, 2);
      else if (frAlerts.length > 0) sl = Math.min(sl, 3);
      if (totalCVEs > 5 && (fr.id === 'FR3' || fr.id === 'FR7')) sl = Math.min(sl, 2);
      const targetSL = (zone.id === 'L1' || zone.id === 'L0') ? 3 : 2;
      return { fr: fr.id, name: fr.name, code: fr.code, currentSL: sl, targetSL: targetSL, alertCount: frAlerts.length };
    });
    return { zone: zone.id, zoneName: zone.name, zoneColor: zone.color, frs: frs, totalCVEs: totalCVEs, alertCount: zAlerts.length };
  });
}

function protocolHeatmap(assets) {
  const map = {};
  PURDUE_ZONES.forEach(function(zone) {
    assets.filter(function(a) { return a.zone === zone.id; }).forEach(function(asset) {
      (asset.protocols || []).forEach(function(proto) {
        if (!map[proto]) map[proto] = { protocol: proto, zones: {} };
        map[proto].zones[zone.id] = (map[proto].zones[zone.id] || 0) + 1;
      });
    });
  });
  return Object.values(map).sort(function(a, b) {
    const tA = Object.values(a.zones).reduce(function(s, v) { return s + v; }, 0);
    const tB = Object.values(b.zones).reduce(function(s, v) { return s + v; }, 0);
    return tB - tA;
  });
}

export default function OTTab({ tenantId, connectedTools = {}, demoMode, theme }) {
  const [activeView, setActiveView] = useState('map');
  const [assets, setAssets] = useState(DEMO_ASSETS);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [maintenanceWindows, setMaintenanceWindows] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [triageCache, setTriageCache] = useState({});
  const [triaging, setTriaging] = useState(null);
  const [cvePanel, setCvePanel] = useState(null);
  const [showMWForm, setShowMWForm] = useState(false);
  const [mwForm, setMwForm] = useState({ name:'', startDate:'', endDate:'', zones:[], notes:'' });
  const [actionFeedback, setActionFeedback] = useState({});
  const [assetFilter, setAssetFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  const isOtConnected = ['claroty','nozomi','dragos','armis'].some(function(t) { return connectedTools[t]; });

  const fetchLiveAssets = useCallback(async function() {
    if (demoMode || !isOtConnected) return;
    setLoadingAssets(true);
    try {
      const r = await fetch('/api/ot/assets', { headers: { 'x-tenant-id': tenantId } });
      const d = await r.json();
      if (d.ok && d.assets && d.assets.length > 0) setAssets(d.assets);
    } catch(e) { /* keep demo data */ }
    setLoadingAssets(false);
  }, [demoMode, isOtConnected, tenantId]);

  const fetchLiveAlerts = useCallback(async function() {
    if (demoMode || !isOtConnected) return;
    setLoadingAlerts(true);
    try {
      const r = await fetch('/api/ot/alerts', { headers: { 'x-tenant-id': tenantId } });
      const d = await r.json();
      if (d.ok && d.alerts && d.alerts.length > 0) setAlerts(d.alerts);
    } catch(e) { /* keep demo data */ }
    setLoadingAlerts(false);
  }, [demoMode, isOtConnected, tenantId]);

  const fetchMaintenanceWindows = useCallback(async function() {
    if (demoMode) return;
    try {
      const r = await fetch('/api/ot/maintenance', { headers: { 'x-tenant-id': tenantId } });
      const d = await r.json();
      if (d.ok) setMaintenanceWindows(d.windows || []);
    } catch(e) { /* ignore */ }
  }, [demoMode, tenantId]);

  useEffect(function() {
    fetchLiveAssets();
    fetchLiveAlerts();
    fetchMaintenanceWindows();
  }, [fetchLiveAssets, fetchLiveAlerts, fetchMaintenanceWindows]);

  const lookupCVE = async function(asset) {
    setCvePanel({ asset: asset, cves: [], loading: true });
    try {
      const params = new URLSearchParams({ vendor: asset.vendor || '', model: asset.model || '', firmware: asset.firmware || '' });
      const r = await fetch('/api/ot/cve-lookup?' + params.toString(), { headers: { 'x-tenant-id': tenantId } });
      const d = await r.json();
      setCvePanel({ asset: asset, cves: d.cves || [], loading: false });
    } catch(e) {
      setCvePanel({ asset: asset, cves: [], loading: false });
    }
  };

  const triageAlert = async function(alert) {
    if (triageCache[alert.id] && triageCache[alert.id].result) return;
    setTriaging(alert.id);
    setTriageCache(function(prev) { return { ...prev, [alert.id]: { loading: true, result: null } }; });
    try {
      const r = await fetch('/api/triage-ot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ alertId: alert.id, title: alert.title, severity: alert.severity, source: alert.source, device: alert.device, zone: alert.zone, protocol: alert.protocol, description: alert.description, mitre: alert.mitre }),
      });
      const d = await r.json();
      setTriageCache(function(prev) { return { ...prev, [alert.id]: { loading: false, result: d.ok ? d.result : null } }; });
    } catch(e) {
      setTriageCache(function(prev) { return { ...prev, [alert.id]: { loading: false, result: null } }; });
    }
    setTriaging(null);
  };

  const runAction = async function(alert, actionType) {
    const key = alert.id + '_' + actionType;
    setActionFeedback(function(prev) { return { ...prev, [key]: 'running' }; });
    try {
      await fetch('/api/response-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ type: actionType === 'notify_engineer' ? 'notify' : actionType === 'create_ticket' ? 'create_ticket' : 'watchlist', target: actionType === 'notify_engineer' ? 'ot_engineer' : undefined, alertId: alert.id, title: '[OT] ' + alert.title, severity: alert.severity, device: alert.device, zone: alert.zone }),
      });
      setActionFeedback(function(prev) { return { ...prev, [key]: 'done' }; });
    } catch(e) {
      setActionFeedback(function(prev) { return { ...prev, [key]: 'error' }; });
    }
  };

  const submitMW = async function() {
    if (!mwForm.name || !mwForm.startDate || !mwForm.endDate) return;
    const start = new Date(mwForm.startDate + 'T00:00').getTime();
    const end = new Date(mwForm.endDate + 'T23:59').getTime();
    try {
      const r = await fetch('/api/ot/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ name: mwForm.name, start: start, end: end, zones: mwForm.zones, notes: mwForm.notes }),
      });
      const d = await r.json();
      if (d.ok) {
        setMaintenanceWindows(function(prev) { return [...prev, d.window]; });
        setShowMWForm(false);
        setMwForm({ name:'', startDate:'', endDate:'', zones:[], notes:'' });
      }
    } catch(e) { /* ignore */ }
  };

  const deleteMW = async function(id) {
    await fetch('/api/ot/maintenance?id=' + id, { method: 'DELETE', headers: { 'x-tenant-id': tenantId } });
    setMaintenanceWindows(function(prev) { return prev.filter(function(w) { return w.id !== id; }); });
  };

  const zoneAssets = function(zId) { return assets.filter(function(a) { return a.zone === zId; }); };
  const zoneAlerts = function(zId) { return alerts.filter(function(a) { return a.zone === zId; }); };
  const criticalAlerts = alerts.filter(function(a) { return a.severity === 'Critical'; }).length;
  const anomalies = DEMO_CROSS_ZONE.filter(function(c) { return c.anomalous; }).length;
  const filteredAssets = assets.filter(function(a) {
    const f = assetFilter.toLowerCase();
    const matchesSearch = !f || a.name.toLowerCase().includes(f) || (a.ip || '').includes(f) || (a.vendor || '').toLowerCase().includes(f);
    const matchesZone = zoneFilter === 'all' || a.zone === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const iec62443Data = computeIEC62443(assets, alerts);
  const protoHeatmap = protocolHeatmap(assets);
  const now = Date.now();
  const activeMW = maintenanceWindows.filter(function(w) { return w.start <= now && w.end >= now; });
  const upcomingMW = maintenanceWindows.filter(function(w) { return w.start > now; });

  const VIEWS = [
    { id:'map',       label:'🗺 Purdue Map' },
    { id:'assets',    label:'⚙ Assets' },
    { id:'alerts',    label:'🚨 OT Alerts' + (alerts.length ? ' (' + alerts.length + ')' : '') },
    { id:'iec62443',  label:'📋 IEC 62443' },
    { id:'protocols', label:'📡 Protocols' },
  ];

  const inp = { width:'100%', padding:'7px 10px', background:'var(--wt-card2)', border:'1px solid var(--wt-border)', borderRadius:7, color:'var(--wt-text)', fontSize:'0.82rem', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' };
  function btn(color, outline) { return { padding:'5px 12px', borderRadius:7, border:'1px solid ' + color + '50', background: outline ? 'transparent' : color + '15', color: color, fontSize:'0.76rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }; }
  function aBtn(alert, type, label, color) {
    const key = alert.id + '_' + type;
    const st = actionFeedback[key];
    return React.createElement('button', { key: type, onClick: function() { runAction(alert, type); }, disabled: st === 'running' || st === 'done', style: { ...btn(color || '#4f8fff'), opacity: (st === 'running' || st === 'done') ? 0.6 : 1 } }, st === 'done' ? '✓ Done' : st === 'running' ? '...' : label);
  }

  return React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:14 } },

    /* Header */
    React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
        React.createElement('span', { style:{ fontSize:'1.1rem' } }, '🏭'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'0.9rem', fontWeight:800, letterSpacing:-0.3 } }, 'OT / ICS Security'),
          React.createElement('div', { style:{ fontSize:'0.72rem', color:'var(--wt-muted)' } },
            isOtConnected && !demoMode
              ? 'Live data — ' + ['claroty','nozomi','dragos','armis'].filter(function(t) { return connectedTools[t]; }).join(', ')
              : 'Operational Technology — separate triage rules apply'
          )
        ),
        demoMode && React.createElement('span', { style:{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:4, background:'#f0a03012', color:'#f0a030', border:'1px solid #f0a03030', fontWeight:700 } }, 'DEMO DATA'),
        activeMW.length > 0 && React.createElement('span', { style:{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:4, background:'#8b6fff12', color:'#8b6fff', border:'1px solid #8b6fff30', fontWeight:700 } }, '🔧 ' + activeMW.length + ' MAINTENANCE WINDOW' + (activeMW.length > 1 ? 'S' : '') + ' ACTIVE'),
        (loadingAssets || loadingAlerts) && React.createElement('span', { style:{ fontSize:'0.7rem', color:'#4f8fff' } }, '⟳ Syncing...')
      ),
      React.createElement('div', { style:{ display:'flex', gap:6 } },
        VIEWS.map(function(v) {
          return React.createElement('button', { key:v.id, onClick: function() { setActiveView(v.id); }, style:{ padding:'5px 12px', borderRadius:7, border:'1px solid ' + (activeView===v.id ? '#4f8fff40' : 'var(--wt-border)'), background: activeView===v.id ? '#4f8fff12' : 'transparent', color: activeView===v.id ? '#4f8fff' : 'var(--wt-muted)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' } }, v.label);
        })
      )
    ),

    /* Stat tiles */
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 } },
      [
        { label:'OT Assets', val:assets.length, color:'#4f8fff' },
        { label:'Active OT Alerts', val:alerts.length, color:'#f0405e' },
        { label:'Critical', val:criticalAlerts, color:'#f0405e' },
        { label:'Cross-zone Anomalies', val:anomalies, color:'#f0a030' },
        { label:'Zones Monitored', val:6, color:'#22d49a' },
      ].map(function(s) {
        return React.createElement('div', { key:s.label, style:{ padding:'12px 14px', background:'var(--wt-card)', border:'1px solid ' + s.color + '20', borderRadius:10 } },
          React.createElement('div', { style:{ fontSize:'1.6rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, lineHeight:1 } }, s.val),
          React.createElement('div', { style:{ fontSize:'0.72rem', fontWeight:700, color:'var(--wt-text)', marginTop:4 } }, s.label)
        );
      })
    ),

    /* Safety banner */
    React.createElement('div', { style:{ padding:'8px 14px', background:'#f0a03008', border:'1px solid #f0a03025', borderRadius:8, display:'flex', alignItems:'center', gap:8 } },
      React.createElement('span', null, '⚠'),
      React.createElement('span', { style:{ fontSize:'0.78rem', color:'#f0a030', fontWeight:600 } }, 'OT Safety Mode active'),
      React.createElement('span', { style:{ fontSize:'0.78rem', color:'var(--wt-muted)' } }, '— APEX will never auto-isolate OT devices. All response actions require plant engineer confirmation.')
    ),

    /* ═══════════════════════════════ PURDUE MAP ═══════════════════════════ */
    activeView === 'map' && React.createElement('div', { style:{ display:'grid', gridTemplateColumns: selectedZone ? '1fr 380px' : '1fr', gap:14 } },

      /* Zone bands */
      React.createElement('div', { style:{ background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:3 } },
        React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:'var(--wt-muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 } }, 'Purdue Reference Model'),
        DEMO_CROSS_ZONE.filter(function(c) { return c.anomalous; }).length > 0 && React.createElement('div', { style:{ padding:'6px 10px', background:'#f0405e08', border:'1px solid #f0405e25', borderRadius:7, marginBottom:8, fontSize:'0.76rem', color:'#f0405e' } },
          '⚡ ' + DEMO_CROSS_ZONE.filter(function(c) { return c.anomalous; }).length + ' anomalous cross-zone traffic patterns detected',
          DEMO_CROSS_ZONE.filter(function(c) { return c.anomalous; }).map(function(a) {
            return React.createElement('div', { key:a.label, style:{ marginTop:3, color:'var(--wt-muted)', fontFamily:'JetBrains Mono,monospace', fontSize:'0.72rem' } }, a.from + ' → ' + a.label + ' (' + a.count + ' pkts/hr)');
          })
        ),
        PURDUE_ZONES.map(function(zone) {
          const za = zoneAssets(zone.id);
          const al = zoneAlerts(zone.id);
          const hasAnomaly = DEMO_CROSS_ZONE.some(function(c) { return (c.from === zone.id || c.to === zone.id) && c.anomalous; });
          const isSelected = selectedZone === zone.id;
          const mwActive = isInMaintenance([zone.id], maintenanceWindows);
          return React.createElement('div', { key:zone.id, onClick: function() { setSelectedZone(isSelected ? null : zone.id); },
            style:{ padding:'10px 14px', background: isSelected ? zone.bg : hasAnomaly ? '#f0405e04' : 'transparent', border:'1px solid ' + (isSelected ? zone.color+'40' : hasAnomaly ? '#f0405e30' : zone.color+'20'), borderRadius:9, cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:12 } },
            React.createElement('div', { style:{ width:56, flexShrink:0 } },
              React.createElement('div', { style:{ fontSize:'0.6rem', fontWeight:800, color:zone.color, textTransform:'uppercase', letterSpacing:'1px' } }, zone.label),
              React.createElement('div', { style:{ fontSize:'0.72rem', fontWeight:700, color:'var(--wt-text)', marginTop:1 } }, zone.id)
            ),
            React.createElement('div', { style:{ width:20, height:20, borderRadius:5, background:zone.color+'20', border:'1px solid ' + zone.color+'40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0 } }, zone.icon),
            React.createElement('div', { style:{ flex:1, minWidth:0 } },
              React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:'var(--wt-text)' } }, zone.name),
              React.createElement('div', { style:{ fontSize:'0.72rem', color:'var(--wt-muted)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, zone.desc)
            ),
            React.createElement('div', { style:{ display:'flex', gap:4, alignItems:'center', flexShrink:0 } },
              za.slice(0,8).map(function(a) { return React.createElement('div', { key:a.id, title:a.name + ' — ' + a.status, style:{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[a.status] || '#6b7a94', flexShrink:0 } }); }),
              za.length > 8 && React.createElement('span', { style:{ fontSize:'0.68rem', color:'var(--wt-dim)' } }, '+' + (za.length-8))
            ),
            React.createElement('div', { style:{ display:'flex', gap:6, flexShrink:0, alignItems:'center' } },
              React.createElement('span', { style:{ fontSize:'0.78rem', color:'var(--wt-muted)', fontFamily:'JetBrains Mono,monospace' } }, za.length + ' dev'),
              al.length > 0 && React.createElement('span', { style:{ fontSize:'0.68rem', fontWeight:800, padding:'1px 5px', borderRadius:3, background: al.some(function(a) { return a.severity === 'Critical'; }) ? '#f0405e' : '#f0a030', color:'#fff' } }, al.length),
              hasAnomaly && React.createElement('span', { style:{ fontSize:'0.7rem', color:'#f0405e' } }, '⚡'),
              mwActive && React.createElement('span', { style:{ fontSize:'0.68rem', color:'#8b6fff' } }, '🔧')
            ),
            React.createElement('span', { style:{ fontSize:'0.8rem', color:'var(--wt-dim)', flexShrink:0 } }, isSelected ? '▲' : '▼')
          );
        })
      ),

      /* Zone detail panel */
      selectedZone && (function() {
        const zone = PURDUE_ZONES.find(function(z) { return z.id === selectedZone; });
        const za = zoneAssets(selectedZone);
        const al = zoneAlerts(selectedZone);
        return React.createElement('div', { style:{ background:'var(--wt-card)', border:'1px solid ' + zone.color+'30', borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12, maxHeight:600, overflowY:'auto' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            React.createElement('span', { style:{ fontSize:'1.2rem' } }, zone.icon),
            React.createElement('div', null,
              React.createElement('div', { style:{ fontSize:'0.86rem', fontWeight:800, color:zone.color } }, zone.name),
              React.createElement('div', { style:{ fontSize:'0.72rem', color:'var(--wt-muted)' } }, zone.label + ' — ' + za.length + ' assets')
            ),
            React.createElement('button', { onClick: function() { setSelectedZone(null); }, style:{ marginLeft:'auto', padding:'3px 8px', borderRadius:5, border:'1px solid var(--wt-border)', background:'transparent', color:'var(--wt-muted)', fontSize:'0.78rem', cursor:'pointer', fontFamily:'Inter,sans-serif' } }, '✕')
          ),
          al.length > 0 && React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'0.72rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 } }, 'Active Alerts (' + al.length + ')'),
            al.map(function(alert) {
              return React.createElement('div', { key:alert.id, onClick: function() { setSelectedAlert(alert); setActiveView('alerts'); }, style:{ padding:'8px 10px', background:'#f0405e06', border:'1px solid #f0405e20', borderRadius:7, marginBottom:5, cursor:'pointer' } },
                React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:600 } }, alert.title),
                React.createElement('div', { style:{ display:'flex', gap:6, marginTop:3 } },
                  React.createElement('span', { style:{ fontSize:'0.68rem', fontWeight:700, padding:'0 4px', borderRadius:2, background:SEV_COLOR[alert.severity] || '#f0a030', color:'#fff' } }, alert.severity),
                  React.createElement('span', { style:{ fontSize:'0.68rem', color:'var(--wt-dim)', fontFamily:'JetBrains Mono,monospace' } }, alert.protocol)
                )
              );
            })
          ),
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'0.72rem', fontWeight:700, color:'var(--wt-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 } }, 'Assets'),
            za.map(function(asset) {
              return React.createElement('div', { key:asset.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderBottom:'1px solid var(--wt-border)' } },
                React.createElement('span', { style:{ fontSize:'0.8rem', flexShrink:0 } }, DEVICE_ICONS[asset.type] || '🔧'),
                React.createElement('div', { style:{ flex:1, minWidth:0 } },
                  React.createElement('div', { style:{ fontSize:'0.76rem', fontWeight:600, fontFamily:'JetBrains Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, asset.name),
                  React.createElement('div', { style:{ fontSize:'0.68rem', color:'var(--wt-dim)' } }, asset.vendor + ' ' + asset.model)
                ),
                React.createElement('div', { style:{ width:8, height:8, borderRadius:'50%', background:STATUS_COLOR[asset.status], flexShrink:0 } }),
                (asset.cveCount || 0) > 0 && React.createElement('button', { onClick: function() { lookupCVE(asset); }, style:{ fontSize:'0.68rem', fontWeight:700, padding:'1px 5px', borderRadius:3, background:'#8b6fff15', color:'#8b6fff', border:'1px solid #8b6fff25', cursor:'pointer', fontFamily:'Inter,sans-serif' } }, asset.cveCount + ' CVE')
              );
            })
          )
        );
      })()
    ),

    /* ═══════════════════════════════ ASSETS VIEW ══════════════════════════ */
    activeView === 'assets' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:10 } },
      React.createElement('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
        React.createElement('input', { value:assetFilter, onChange: function(e) { setAssetFilter(e.target.value); }, placeholder:'Search by name, IP, vendor...', style:{ ...inp, width:240 } }),
        React.createElement('select', { value:zoneFilter, onChange: function(e) { setZoneFilter(e.target.value); }, style:{ ...inp, width:160 } },
          React.createElement('option', { value:'all' }, 'All Zones'),
          PURDUE_ZONES.map(function(z) { return React.createElement('option', { key:z.id, value:z.id }, z.label + ' — ' + z.id); })
        ),
        React.createElement('button', { onClick: function() { setLoadingAssets(true); fetchLiveAssets(); }, style:{ ...btn('#4f8fff'), padding:'7px 14px' } }, '⟳ Refresh'),
        React.createElement('span', { style:{ marginLeft:'auto', fontSize:'0.78rem', color:'var(--wt-muted)', alignSelf:'center' } }, filteredAssets.length + ' of ' + assets.length + ' assets')
      ),
      React.createElement('div', { style:{ background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:12, overflow:'hidden' } },
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr 1fr', gap:0, fontSize:'0.7rem', fontWeight:700, color:'var(--wt-dim)', textTransform:'uppercase', padding:'7px 16px', borderBottom:'1px solid var(--wt-border)', background:'var(--wt-card2)', letterSpacing:'0.5px' } },
          React.createElement('span', null, 'Device'),
          React.createElement('span', null, 'Zone'),
          React.createElement('span', null, 'Vendor / Model'),
          React.createElement('span', null, 'Protocols'),
          React.createElement('span', null, 'Risk'),
          React.createElement('span', null, 'Status / CVE')
        ),
        filteredAssets.map(function(asset, i) {
          const zone = PURDUE_ZONES.find(function(z) { return z.id === asset.zone; });
          const riskColor = asset.riskScore >= 70 ? '#f0405e' : asset.riskScore >= 40 ? '#f0a030' : '#22d49a';
          return React.createElement('div', { key:asset.id, style:{ display:'grid', gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1fr 1fr', gap:0, padding:'8px 16px', borderBottom:'1px solid var(--wt-border)', background: i%2===0 ? 'transparent' : 'var(--wt-card2)', alignItems:'center' } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
              React.createElement('span', { style:{ fontSize:'0.82rem', flexShrink:0 } }, DEVICE_ICONS[asset.type] || '🔧'),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'0.76rem', fontWeight:600, fontFamily:'JetBrains Mono,monospace' } }, asset.name),
                React.createElement('div', { style:{ fontSize:'0.66rem', color:'var(--wt-dim)' } }, asset.ip)
              )
            ),
            React.createElement('div', null,
              React.createElement('span', { style:{ fontSize:'0.72rem', fontWeight:700, color:zone ? zone.color : '#6b7a94', padding:'1px 6px', borderRadius:3, background:(zone ? zone.color : '#6b7a94')+'15' } }, asset.zone),
              React.createElement('div', { style:{ fontSize:'0.66rem', color:'var(--wt-dim)', marginTop:2 } }, asset.source)
            ),
            React.createElement('div', null,
              React.createElement('div', { style:{ fontSize:'0.74rem' } }, asset.vendor),
              React.createElement('div', { style:{ fontSize:'0.68rem', color:'var(--wt-dim)' } }, asset.model + ' · fw ' + (asset.firmware || 'n/a'))
            ),
            React.createElement('div', { style:{ display:'flex', gap:3, flexWrap:'wrap' } },
              (asset.protocols || []).slice(0,2).map(function(p) { return React.createElement('span', { key:p, style:{ fontSize:'0.62rem', padding:'0 4px', borderRadius:3, background:'#4f8fff10', color:'#4f8fff', border:'1px solid #4f8fff20' } }, p); })
            ),
            React.createElement('div', null,
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:4 } },
                React.createElement('div', { style:{ width:48, height:4, borderRadius:2, background:'var(--wt-border)', overflow:'hidden' } },
                  React.createElement('div', { style:{ width:(asset.riskScore || 0) + '%', height:'100%', background:riskColor, borderRadius:2 } })
                ),
                React.createElement('span', { style:{ fontSize:'0.7rem', fontWeight:700, color:riskColor } }, asset.riskScore)
              )
            ),
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
              React.createElement('div', { style:{ width:7, height:7, borderRadius:'50%', background:STATUS_COLOR[asset.status] || '#6b7a94' } }),
              React.createElement('span', { style:{ fontSize:'0.72rem', color:STATUS_COLOR[asset.status], fontWeight:600 } }, asset.status),
              (asset.cveCount || 0) > 0 && React.createElement('button', { onClick: function() { lookupCVE(asset); }, style:{ fontSize:'0.68rem', fontWeight:700, padding:'1px 5px', borderRadius:3, background:'#8b6fff12', color:'#8b6fff', border:'1px solid #8b6fff25', cursor:'pointer', fontFamily:'Inter,sans-serif' } }, asset.cveCount + ' CVE')
            )
          );
        })
      )
    ),

    /* ════════════════════════════ OT ALERTS VIEW ══════════════════════════ */
    activeView === 'alerts' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },

      /* Maintenance window bar */
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' } },
        React.createElement('span', { style:{ fontSize:'0.82rem', fontWeight:700, color:'var(--wt-text)' } }, 'Maintenance Windows'),
        activeMW.map(function(w) { return React.createElement('span', { key:w.id, style:{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:4, background:'#8b6fff15', color:'#8b6fff', border:'1px solid #8b6fff30' } }, '🔧 ' + w.name + ' (active)'); }),
        upcomingMW.map(function(w) { return React.createElement('span', { key:w.id, style:{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:4, background:'#4f8fff10', color:'#4f8fff', border:'1px solid #4f8fff25' } }, '📅 ' + w.name + ' — ' + new Date(w.start).toLocaleDateString()); }),
        React.createElement('button', { onClick: function() { setShowMWForm(function(f) { return !f; }); }, style:{ ...btn('#8b6fff'), marginLeft:'auto' } }, '+ Schedule Maintenance Window')
      ),

      /* MW form */
      showMWForm && React.createElement('div', { style:{ padding:16, background:'var(--wt-card)', border:'1px solid #8b6fff30', borderRadius:10 } },
        React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, marginBottom:10 } }, 'New Maintenance Window'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 } },
          React.createElement('div', null,
            React.createElement('label', { style:{ fontSize:'0.7rem', color:'var(--wt-muted)', display:'block', marginBottom:3 } }, 'Name'),
            React.createElement('input', { value:mwForm.name, onChange: function(e) { setMwForm(function(f) { return {...f, name:e.target.value}; }); }, placeholder:'e.g. PLC firmware update', style:inp })
          ),
          React.createElement('div', null,
            React.createElement('label', { style:{ fontSize:'0.7rem', color:'var(--wt-muted)', display:'block', marginBottom:3 } }, 'Start date'),
            React.createElement('input', { type:'date', value:mwForm.startDate, onChange: function(e) { setMwForm(function(f) { return {...f, startDate:e.target.value}; }); }, style:inp })
          ),
          React.createElement('div', null,
            React.createElement('label', { style:{ fontSize:'0.7rem', color:'var(--wt-muted)', display:'block', marginBottom:3 } }, 'End date'),
            React.createElement('input', { type:'date', value:mwForm.endDate, onChange: function(e) { setMwForm(function(f) { return {...f, endDate:e.target.value}; }); }, style:inp })
          )
        ),
        React.createElement('div', { style:{ marginBottom:10 } },
          React.createElement('label', { style:{ fontSize:'0.7rem', color:'var(--wt-muted)', display:'block', marginBottom:4 } }, 'Zones covered (leave blank for all)'),
          React.createElement('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            PURDUE_ZONES.map(function(z) {
              const selected = mwForm.zones.includes(z.id);
              return React.createElement('button', { key:z.id, onClick: function() { setMwForm(function(f) { return { ...f, zones: selected ? f.zones.filter(function(x) { return x !== z.id; }) : [...f.zones, z.id] }; }); }, style:{ ...btn(z.color), background: selected ? z.color+'25' : 'transparent', fontWeight: selected ? 700 : 400 } }, z.id);
            })
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:8 } },
          React.createElement('button', { onClick: submitMW, style:{ ...btn('#22d49a'), padding:'7px 16px' } }, 'Create Window'),
          React.createElement('button', { onClick: function() { setShowMWForm(false); }, style:{ ...btn('#6b7a94', true), padding:'7px 16px' } }, 'Cancel')
        )
      ),

      /* MW list */
      maintenanceWindows.length > 0 && React.createElement('div', { style:{ padding:'8px 12px', background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:8 } },
        maintenanceWindows.map(function(w) {
          const isActive = w.start <= now && w.end >= now;
          const isPast = w.end < now;
          return React.createElement('div', { key:w.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid var(--wt-border)', fontSize:'0.76rem' } },
            React.createElement('span', { style:{ color: isActive ? '#8b6fff' : isPast ? '#4a5568' : '#4f8fff' } }, isActive ? '🔧' : isPast ? '✓' : '📅'),
            React.createElement('span', { style:{ fontWeight:600 } }, w.name),
            React.createElement('span', { style:{ color:'var(--wt-muted)' } }, new Date(w.start).toLocaleDateString() + ' → ' + new Date(w.end).toLocaleDateString()),
            w.zones.length > 0 && React.createElement('span', { style:{ color:'var(--wt-dim)' } }, 'Zones: ' + w.zones.join(', ')),
            React.createElement('button', { onClick: function() { deleteMW(w.id); }, style:{ marginLeft:'auto', fontSize:'0.7rem', padding:'1px 6px', borderRadius:4, border:'1px solid #f0405e30', background:'transparent', color:'#f0405e', cursor:'pointer', fontFamily:'Inter,sans-serif' } }, '✕')
          );
        })
      ),

      /* Alert feed */
      alerts.map(function(alert) {
        const triage = triageCache[alert.id];
        const isExpanded = selectedAlert && selectedAlert.id === alert.id;
        const zone = PURDUE_ZONES.find(function(z) { return z.id === alert.zone; });
        const sevColor = SEV_COLOR[alert.severity] || '#f0a030';
        const inMW = isInMaintenance([alert.zone], maintenanceWindows);
        return React.createElement('div', { key:alert.id, style:{ background:'var(--wt-card)', border:'1px solid ' + (isExpanded ? sevColor+'30' : 'var(--wt-border)'), borderLeft:'3px solid ' + (inMW ? '#8b6fff' : sevColor), borderRadius:10, overflow:'hidden', opacity: inMW ? 0.6 : 1 } },
          React.createElement('div', { onClick: function() { setSelectedAlert(isExpanded ? null : alert); if (!isExpanded && !(triage && triage.result)) triageAlert(alert); }, style:{ padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:10 } },
            React.createElement('div', { style:{ flex:1, minWidth:0 } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 } },
                React.createElement('span', { style:{ fontSize:'0.72rem', fontWeight:800, color:sevColor, textTransform:'uppercase' } }, alert.severity),
                React.createElement('span', { style:{ fontSize:'0.76rem', fontWeight:600, color:'var(--wt-text)' } }, alert.title),
                inMW && React.createElement('span', { style:{ fontSize:'0.68rem', color:'#8b6fff', background:'#8b6fff12', padding:'0 4px', borderRadius:3 } }, 'maintenance window active')
              ),
              React.createElement('div', { style:{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' } },
                React.createElement('span', { style:{ fontSize:'0.7rem', color:'var(--wt-dim)', fontFamily:'JetBrains Mono,monospace' } }, alert.device),
                zone && React.createElement('span', { style:{ fontSize:'0.68rem', padding:'0 4px', borderRadius:3, background:zone.color+'15', color:zone.color, border:'1px solid ' + zone.color+'30' } }, zone.name),
                React.createElement('span', { style:{ fontSize:'0.68rem', color:'var(--wt-dim)' } }, alert.protocol),
                React.createElement('span', { style:{ fontSize:'0.7rem', color:'var(--wt-dim)' } }, alert.source + ' · ' + alert.time),
                alert.mitre && React.createElement('span', { style:{ fontSize:'0.68rem', fontFamily:'JetBrains Mono,monospace', color:'var(--wt-dim)' } }, alert.mitre)
              )
            ),
            triaging === alert.id && React.createElement('span', { style:{ fontSize:'0.7rem', color:'#4f8fff', flexShrink:0 } }, '⟳ APEX OT...'),
            React.createElement('span', { style:{ fontSize:'0.68rem', fontWeight:700, padding:'1px 6px', borderRadius:3, background:'#f0a03012', color:'#f0a030', border:'1px solid #f0a03025', flexShrink:0 } }, '⚠ No auto-action')
          ),
          isExpanded && React.createElement('div', { style:{ borderTop:'1px solid var(--wt-border)', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 } },
            React.createElement('p', { style:{ fontSize:'0.8rem', color:'var(--wt-secondary)', lineHeight:1.6 } }, alert.description),
            React.createElement('div', { style:{ padding:'8px 12px', background:'#f0a03008', border:'1px solid #f0a03025', borderRadius:7 } },
              React.createElement('div', { style:{ fontSize:'0.7rem', fontWeight:700, color:'#f0a030', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 } }, 'OT-Safe Recommendation'),
              React.createElement('p', { style:{ fontSize:'0.78rem', color:'var(--wt-secondary)', lineHeight:1.6 } }, alert.recommendation)
            ),
            triage && triage.result && React.createElement('div', { style:{ padding:'10px 12px', background:'#4f8fff06', border:'1px solid #4f8fff20', borderRadius:8 } },
              React.createElement('div', { style:{ fontSize:'0.7rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 } }, '✦ APEX OT Analysis'),
              React.createElement('p', { style:{ fontSize:'0.8rem', color:'var(--wt-secondary)', lineHeight:1.6, marginBottom:8 } }, triage.result.analystNarrative),
              (triage.result.evidenceChain || []).map(function(e, i) {
                return React.createElement('div', { key:i, style:{ display:'flex', gap:6, fontSize:'0.76rem', color:'var(--wt-secondary)', marginBottom:2 } },
                  React.createElement('span', { style:{ color:'#4f8fff', flexShrink:0 } }, (i+1) + '.'),
                  e
                );
              }),
              triage.result.otSafeActions && triage.result.otSafeActions.length > 0 && React.createElement('div', { style:{ marginTop:8 } },
                React.createElement('div', { style:{ fontSize:'0.7rem', fontWeight:700, color:'#22d49a', marginBottom:4 } }, 'OT-Safe Actions'),
                triage.result.otSafeActions.map(function(a, i) {
                  return React.createElement('div', { key:i, style:{ display:'flex', gap:6, fontSize:'0.76rem', color:'#22d49a', marginBottom:2 } },
                    React.createElement('span', null, '→'), a
                  );
                })
              )
            ),
            React.createElement('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' } },
              React.createElement('button', { onClick: function() { triageAlert(alert); }, disabled: !!(triage && triage.loading), style:{ ...btn('#4f8fff'), padding:'6px 14px' } },
                triage && triage.loading ? '⟳ Analyzing...' : triage && triage.result ? '⟳ Re-analyse' : '✦ APEX OT Triage'
              ),
              aBtn(alert, 'notify_engineer', '📞 Notify plant engineer', '#22d49a'),
              aBtn(alert, 'create_ticket', '🎫 Create work order', '#8b6fff'),
              aBtn(alert, 'watchlist', '👁 Add to watchlist', '#f0a030'),
              React.createElement('span', { style:{ fontSize:'0.72rem', color:'var(--wt-muted)' } }, 'Analyst confirmation required for any network action')
            )
          )
        );
      })
    ),

    /* ══════════════════════════ IEC 62443 VIEW ════════════════════════════ */
    activeView === 'iec62443' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
      React.createElement('div', { style:{ padding:'10px 14px', background:'#4f8fff08', border:'1px solid #4f8fff20', borderRadius:8 } },
        React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:'#4f8fff', marginBottom:4 } }, 'IEC 62443-3-3 Security Level Assessment'),
        React.createElement('p', { style:{ fontSize:'0.76rem', color:'var(--wt-muted)', lineHeight:1.6 } }, 'Security levels (SL1 to SL4) assessed per zone based on active alerts, CVE exposure, and control coverage. SL1 = basic protection, SL4 = nation-state level. Mapped to FR1 to FR7 foundational requirements.')
      ),
      iec62443Data.map(function(row) {
        const { zone, zoneName, zoneColor, frs, totalCVEs, alertCount } = row;
        return React.createElement('div', { key:zone, style:{ background:'var(--wt-card)', border:'1px solid ' + zoneColor+'20', borderRadius:12, overflow:'hidden' } },
          React.createElement('div', { style:{ padding:'10px 16px', background:zoneColor+'08', borderBottom:'1px solid ' + zoneColor+'20', display:'flex', alignItems:'center', gap:10 } },
            React.createElement('span', { style:{ fontSize:'0.88rem', fontWeight:800, color:zoneColor } }, zone),
            React.createElement('span', { style:{ fontSize:'0.82rem', fontWeight:600, color:'var(--wt-text)' } }, zoneName),
            React.createElement('div', { style:{ marginLeft:'auto', display:'flex', gap:10 } },
              alertCount > 0 && React.createElement('span', { style:{ fontSize:'0.72rem', color:'#f0405e', background:'#f0405e12', padding:'1px 6px', borderRadius:3 } }, alertCount + ' active alerts'),
              totalCVEs > 0 && React.createElement('span', { style:{ fontSize:'0.72rem', color:'#8b6fff', background:'#8b6fff12', padding:'1px 6px', borderRadius:3 } }, totalCVEs + ' CVEs')
            )
          ),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0 } },
            frs.map(function(fr) {
              const gap = fr.currentSL < fr.targetSL;
              const slColor = fr.currentSL >= 3 ? '#22d49a' : fr.currentSL === 2 ? '#f0a030' : '#f0405e';
              return React.createElement('div', { key:fr.fr, style:{ padding:'10px 8px', borderRight:'1px solid var(--wt-border)', textAlign:'center' } },
                React.createElement('div', { style:{ fontSize:'0.72rem', fontWeight:800, color:zoneColor, marginBottom:3 } }, fr.fr),
                React.createElement('div', { style:{ fontSize:'0.62rem', color:'var(--wt-muted)', marginBottom:6 } }, fr.code),
                React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:2, alignItems:'center', marginBottom:4 } },
                  [4,3,2,1].map(function(sl) {
                    return React.createElement('div', { key:sl, style:{ width:32, height:6, borderRadius:2, background: sl <= fr.currentSL ? slColor : 'var(--wt-border)', border: sl === fr.targetSL ? '1px solid ' + zoneColor : 'none' } });
                  })
                ),
                React.createElement('div', { style:{ fontSize:'0.68rem', fontWeight:700, color:slColor } }, 'SL' + fr.currentSL),
                gap && React.createElement('div', { style:{ fontSize:'0.6rem', color:'#f0a030', marginTop:2 } }, 'Target SL' + fr.targetSL),
                fr.alertCount > 0 && React.createElement('div', { style:{ fontSize:'0.6rem', color:'#f0405e', marginTop:2 } }, fr.alertCount + ' alert' + (fr.alertCount>1?'s':''))
              );
            })
          )
        );
      }),
      React.createElement('div', { style:{ padding:'10px 14px', background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:8, fontSize:'0.72rem', color:'var(--wt-muted)' } },
        React.createElement('strong', { style:{ color:'var(--wt-text)' } }, 'Scoring methodology: '),
        'Critical alert deducts to SL1, High to SL2, Medium/Low to SL3. CVE count above 5 deducts FR3/FR7 to SL2. Target SL3 for L0/L1 (critical process), SL2 for L2 to L4.'
      )
    ),

    /* ══════════════════════════ PROTOCOL HEATMAP ══════════════════════════ */
    activeView === 'protocols' && React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:12 } },
      React.createElement('div', { style:{ padding:'10px 14px', background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:8 } },
        React.createElement('div', { style:{ fontSize:'0.82rem', fontWeight:700, color:'var(--wt-text)', marginBottom:4 } }, 'Protocol Distribution by Purdue Zone'),
        React.createElement('p', { style:{ fontSize:'0.76rem', color:'var(--wt-muted)', lineHeight:1.6 } }, 'Industrial protocol presence across each zone. Unexpected protocol in a zone (e.g. Modbus TCP in L4) indicates a potential security misconfiguration or zone boundary violation.')
      ),
      React.createElement('div', { style:{ background:'var(--wt-card)', border:'1px solid var(--wt-border)', borderRadius:12, overflow:'hidden' } },
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'160px repeat(6, 1fr)', borderBottom:'1px solid var(--wt-border)', background:'var(--wt-card2)' } },
          React.createElement('div', { style:{ padding:'8px 12px', fontSize:'0.72rem', fontWeight:700, color:'var(--wt-dim)', textTransform:'uppercase' } }, 'Protocol'),
          PURDUE_ZONES.map(function(z) {
            return React.createElement('div', { key:z.id, style:{ padding:'8px 8px', fontSize:'0.72rem', fontWeight:700, color:z.color, textTransform:'uppercase', textAlign:'center', borderLeft:'1px solid var(--wt-border)' } }, z.id);
          })
        ),
        protoHeatmap.map(function(row, i) {
          const maxCount = Math.max.apply(null, PURDUE_ZONES.map(function(z) { return row.zones[z.id] || 0; }));
          const otProtos = ['Modbus','DNP3','S7Comm','Profibus','EtherNet/IP','CIP','IEC 60870','OPC-DA','HART','4-20mA'];
          const isOTProto = otProtos.some(function(p) { return row.protocol.includes(p); });
          return React.createElement('div', { key:row.protocol, style:{ display:'grid', gridTemplateColumns:'160px repeat(6, 1fr)', borderBottom:'1px solid var(--wt-border)', background: i%2===0 ? 'transparent' : 'var(--wt-card2)', alignItems:'center' } },
            React.createElement('div', { style:{ padding:'8px 12px' } },
              React.createElement('div', { style:{ fontSize:'0.78rem', fontWeight:600, color:'var(--wt-text)' } }, row.protocol),
              isOTProto && React.createElement('div', { style:{ fontSize:'0.62rem', color:'#f0a030' } }, 'OT protocol')
            ),
            PURDUE_ZONES.map(function(z) {
              const count = row.zones[z.id] || 0;
              const isUnexpected = isOTProto && (z.id === 'L3' || z.id === 'L4') && count > 0;
              const intensity = maxCount > 0 ? count / maxCount : 0;
              const cellColor = isUnexpected ? '#f0405e' : '#4f8fff';
              return React.createElement('div', { key:z.id, style:{ padding:'8px', textAlign:'center', borderLeft:'1px solid var(--wt-border)' } },
                count > 0
                  ? React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 } },
                      React.createElement('div', { style:{ width:'80%', height:20, borderRadius:3, background:cellColor + Math.round(intensity*70+15).toString(16).padStart(2,'0'), display:'flex', alignItems:'center', justifyContent:'center' } },
                        React.createElement('span', { style:{ fontSize:'0.72rem', fontWeight:700, color:isUnexpected ? '#f0405e' : '#4f8fff' } }, count)
                      ),
                      isUnexpected && React.createElement('span', { style:{ fontSize:'0.6rem', color:'#f0405e' } }, '⚡ anomaly')
                    )
                  : React.createElement('span', { style:{ fontSize:'0.7rem', color:'var(--wt-border)' } }, '—')
              );
            })
          );
        })
      ),
      React.createElement('div', { style:{ display:'flex', gap:16, fontSize:'0.72rem', color:'var(--wt-muted)' } },
        React.createElement('span', null, React.createElement('span', { style:{ color:'#4f8fff' } }, '■'), ' Expected protocol presence'),
        React.createElement('span', null, React.createElement('span', { style:{ color:'#f0405e' } }, '■'), ' Unexpected OT protocol in IT zone — investigate'),
        React.createElement('span', null, React.createElement('span', { style:{ color:'var(--wt-border)' } }, '—'), ' Protocol not present in zone')
      )
    ),

    /* ══════════════════════════ CVE PANEL ════════════════════════════════ */
    cvePanel && React.createElement('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }, onClick: function() { setCvePanel(null); } },
      React.createElement('div', { onClick: function(e) { e.stopPropagation(); }, style:{ background:'var(--wt-bg)', border:'1px solid var(--wt-border)', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' } },
        React.createElement('div', { style:{ padding:'14px 18px', borderBottom:'1px solid var(--wt-border)', display:'flex', alignItems:'center', gap:8 } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'0.88rem', fontWeight:700 } }, 'CVE Exposure — ' + (cvePanel.asset ? cvePanel.asset.name : '')),
            React.createElement('div', { style:{ fontSize:'0.72rem', color:'var(--wt-muted)' } }, (cvePanel.asset ? cvePanel.asset.vendor + ' ' + cvePanel.asset.model + ' · Firmware ' + (cvePanel.asset.firmware || 'unknown') : ''))
          ),
          React.createElement('button', { onClick: function() { setCvePanel(null); }, style:{ marginLeft:'auto', background:'none', border:'1px solid var(--wt-border)', borderRadius:7, color:'var(--wt-muted)', cursor:'pointer', fontSize:'1rem', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' } }, '✕')
        ),
        React.createElement('div', { style:{ overflowY:'auto', padding:16 } },
          cvePanel.loading && React.createElement('div', { style:{ textAlign:'center', color:'var(--wt-muted)', padding:32 } }, '⟳ Looking up CVEs...'),
          !cvePanel.loading && cvePanel.cves.length === 0 && React.createElement('div', { style:{ textAlign:'center', color:'var(--wt-muted)', padding:32 } },
            React.createElement('div', { style:{ fontSize:'1.5rem', marginBottom:8 } }, '✓'),
            'No known CVEs found for this device model and firmware version.'
          ),
          cvePanel.cves.map(function(cve) {
            const cvssColor = cve.cvss >= 9 ? '#f0405e' : cve.cvss >= 7 ? '#f97316' : cve.cvss >= 4 ? '#f0a030' : '#22d49a';
            return React.createElement('div', { key:cve.id, style:{ padding:'10px 12px', background:'var(--wt-card)', border:'1px solid ' + cvssColor+'25', borderLeft:'3px solid ' + cvssColor, borderRadius:8, marginBottom:8 } },
              React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:4 } },
                React.createElement('span', { style:{ fontSize:'0.8rem', fontWeight:700, fontFamily:'JetBrains Mono,monospace', color:cvssColor } }, cve.id),
                React.createElement('span', { style:{ fontSize:'0.72rem', fontWeight:800, padding:'1px 6px', borderRadius:3, background:cvssColor+'20', color:cvssColor } }, 'CVSS ' + cve.cvss),
                cve.fixed && React.createElement('span', { style:{ fontSize:'0.68rem', color:'#22d49a', background:'#22d49a12', padding:'1px 5px', borderRadius:3 } }, 'Fixed in ' + cve.fixed)
              ),
              React.createElement('p', { style:{ fontSize:'0.76rem', color:'var(--wt-secondary)', lineHeight:1.5 } }, cve.desc)
            );
          })
        )
      )
    )
  );
}

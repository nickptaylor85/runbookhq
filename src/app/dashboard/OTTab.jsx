'use client';
import React, { useState, useEffect, useRef } from 'react';

// ── Purdue Model Zone Config ───────────────────────────────────────────────────
const PURDUE_ZONES = [
  { id:'L4',  label:'Level 4',   name:'Enterprise / IT Network',    color:'#4f8fff', bg:'#4f8fff08', icon:'🏢', desc:'ERP, corporate IT, business systems. Standard IT security rules apply.' },
  { id:'L35', label:'Level 3.5', name:'Industrial DMZ',             color:'#f0a030', bg:'#f0a03008', icon:'🔀', desc:'Demilitarised zone between IT and OT. Jump servers, data diodes, historians.' },
  { id:'L3',  label:'Level 3',   name:'Manufacturing Operations',   color:'#8b6fff', bg:'#8b6fff08', icon:'📊', desc:'MES, batch management, production scheduling. Cross-zone traffic monitored.' },
  { id:'L2',  label:'Level 2',   name:'Supervisory Control',        color:'#f97316', bg:'#f9731608', icon:'🖥', desc:'SCADA servers, HMI workstations, engineering stations, historians.' },
  { id:'L1',  label:'Level 1',   name:'Controllers',                color:'#22d49a', bg:'#22d49a08', icon:'⚙', desc:'PLCs, RTUs, DCS controllers. NEVER isolate without plant engineer sign-off.' },
  { id:'L0',  label:'Level 0',   name:'Field Devices',              color:'#6b7a94', bg:'#6b7a9408', icon:'📡', desc:'Sensors, actuators, flow meters, transmitters. Physical process layer.' },
];

// ── Demo Data ──────────────────────────────────────────────────────────────────
const DEMO_OT_ASSETS = [
  // L1 Controllers
  { id:'plc-001', name:'PLC-TURBINE-01', type:'PLC', vendor:'Siemens', model:'S7-1500', zone:'L1', ip:'192.168.100.10', status:'online', firmware:'V2.9.2', lastSeen:'2m ago', protocols:['Modbus TCP','S7Comm'], cveCount:2 },
  { id:'plc-002', name:'PLC-PUMP-01', type:'PLC', vendor:'Allen Bradley', model:'ControlLogix 1756', zone:'L1', ip:'192.168.100.11', status:'online', firmware:'V33.011', lastSeen:'1m ago', protocols:['EtherNet/IP','CIP'], cveCount:0 },
  { id:'plc-003', name:'PLC-VALVE-BANK-A', type:'PLC', vendor:'Siemens', model:'S7-300', zone:'L1', ip:'192.168.100.12', status:'degraded', firmware:'V3.3.13', lastSeen:'8m ago', protocols:['Modbus RTU','Profibus'], cveCount:4 },
  { id:'rtu-001', name:'RTU-SUBSTATION-04', type:'RTU', vendor:'ABB', model:'RTU500', zone:'L1', ip:'192.168.100.20', status:'online', firmware:'12.7.1', lastSeen:'30s ago', protocols:['DNP3','IEC 60870-5-104'], cveCount:1 },
  { id:'rtu-002', name:'RTU-REMOTE-07', type:'RTU', vendor:'GE', model:'D25', zone:'L1', ip:'192.168.100.21', status:'online', firmware:'7.42', lastSeen:'5m ago', protocols:['DNP3'], cveCount:0 },
  // L2 Supervisory
  { id:'hmi-001', name:'HMI-CONTROL-ROOM-01', type:'HMI', vendor:'Wonderware', model:'InTouch 2020', zone:'L2', ip:'192.168.101.10', status:'online', firmware:'20.1.100', lastSeen:'1m ago', protocols:['OPC-UA','Modbus TCP'], cveCount:1 },
  { id:'hmi-002', name:'HMI-ENGINEER-STATION', type:'HMI', vendor:'Rockwell', model:'FactoryTalk View', zone:'L2', ip:'192.168.101.11', status:'online', firmware:'13.00', lastSeen:'4m ago', protocols:['EtherNet/IP','OPC-DA'], cveCount:3 },
  { id:'scada-001', name:'SCADA-PRIMARY', type:'SCADA', vendor:'Ignition', model:'8.1 SCADA Server', zone:'L2', ip:'192.168.101.5', status:'online', firmware:'8.1.24', lastSeen:'30s ago', protocols:['OPC-UA','Modbus TCP','DNP3'], cveCount:0 },
  { id:'hist-001', name:'HISTORIAN-01', type:'Historian', vendor:'OSIsoft', model:'PI Server 2023', zone:'L2', ip:'192.168.101.6', status:'online', firmware:'2023 R1', lastSeen:'1m ago', protocols:['OPC-DA','PI API'], cveCount:1 },
  // L3 MES
  { id:'mes-001', name:'MES-PRODUCTION', type:'MES Server', vendor:'Siemens', model:'SIMATIC IT', zone:'L3', ip:'10.50.1.10', status:'online', firmware:'8.0 SP2', lastSeen:'2m ago', protocols:['OPC-UA','REST API'], cveCount:0 },
  { id:'mes-002', name:'MES-QUALITY', type:'MES Server', vendor:'Rockwell', model:'FactoryTalk', zone:'L3', ip:'10.50.1.11', status:'online', firmware:'13.0', lastSeen:'3m ago', protocols:['EtherNet/IP'], cveCount:2 },
  // L3.5 DMZ
  { id:'dmz-001', name:'JUMP-SERVER-OT', type:'Jump Server', vendor:'Citrix', model:'Virtual Apps', zone:'L35', ip:'10.100.1.5', status:'online', firmware:'2308', lastSeen:'1m ago', protocols:['RDP','SSH'], cveCount:1 },
  { id:'dmz-002', name:'DATA-DIODE-01', type:'Data Diode', vendor:'Waterfall', model:'Unidirectional GW', zone:'L35', ip:'10.100.1.10', status:'online', firmware:'4.2.1', lastSeen:'30s ago', protocols:['Custom'], cveCount:0 },
  // L4 IT
  { id:'erp-001', name:'ERP-SAP-PROD', type:'ERP Server', vendor:'SAP', model:'S4/HANA', zone:'L4', ip:'10.200.1.100', status:'online', firmware:'HANA 2.0', lastSeen:'2m ago', protocols:['REST API','RFC'], cveCount:0 },
  // L0 Field
  { id:'sen-001', name:'FLOW-METER-BANK-A', type:'Flow Meter', vendor:'Endress+Hauser', model:'Promag', zone:'L0', ip:'192.168.200.10', status:'online', firmware:'01.05', lastSeen:'10s ago', protocols:['Modbus RTU','HART'], cveCount:0 },
  { id:'sen-002', name:'PRESSURE-TX-12', type:'Pressure Transmitter', vendor:'Yokogawa', model:'EJA110E', zone:'L0', ip:'192.168.200.11', status:'compromised', firmware:'V1.04', lastSeen:'1m ago', protocols:['HART','4-20mA'], cveCount:0 },
  { id:'sen-003', name:'TEMP-SENSOR-ARRAY', type:'Temperature Sensor', vendor:'ABB', model:'TSP341', zone:'L0', ip:'192.168.200.20', status:'online', firmware:'A.02', lastSeen:'30s ago', protocols:['HART'], cveCount:0 },
];

const DEMO_OT_ALERTS = [
  { id:'ot-a1', title:'Unauthorised Modbus write to PLC-TURBINE-01', severity:'Critical', source:'Claroty', device:'PLC-TURBINE-01', zone:'L1', ip:'192.168.100.10', protocol:'Modbus TCP', time:'09:42', verdict:'Pending', confidence:0, description:'Unexpected Modbus write command to holding registers on turbine PLC from engineering workstation IP not in approved list. Function code 06 — single register write to output coil.', mitre:'T0836', recommendation:'Notify plant engineer immediately — do not isolate. Verify via Claroty audit log. Check HMI-ENGINEER-STATION login history.', safeToAutoAct:false },
  { id:'ot-a2', title:'Remote HMI access from non-whitelisted IP', severity:'High', source:'Nozomi Networks', device:'HMI-CONTROL-ROOM-01', zone:'L2', ip:'185.220.101.42', protocol:'RDP', time:'09:51', verdict:'Pending', confidence:0, description:'RDP session established to SCADA HMI from external IP not in approved remote access list. Session active 4 minutes. Jump server policy violation.', mitre:'T0822', recommendation:'Alert plant supervisor and OT security team. Do not terminate session without plant engineer approval — verify if legitimate vendor access. Enable enhanced logging on jump server.', safeToAutoAct:false },
  { id:'ot-a3', title:'Anomalous DNP3 traffic: Engineering station to RTU-04', severity:'High', source:'Dragos', device:'RTU-SUBSTATION-04', zone:'L1', ip:'192.168.100.20', protocol:'DNP3', time:'10:08', verdict:'Pending', confidence:0, description:'DNP3 unsolicited response flood from RTU-SUBSTATION-04 to engineering workstation — 847 packets in 10 minutes vs baseline of 12. Possible DNP3 spoofing or configuration change.', mitre:'T0815', recommendation:'Cross-reference with scheduled maintenance window. If no maintenance active: notify substation engineer, enable DNP3 audit logging. Do NOT interrupt RTU communications without substation engineer present.', safeToAutoAct:false },
  { id:'ot-a4', title:'New unmanaged device on OT network segment', severity:'Medium', source:'Armis', device:'Unknown-192.168.100.99', zone:'L1', ip:'192.168.100.99', protocol:'Unknown', time:'10:24', verdict:'Pending', confidence:0, description:'Armis detected previously unseen MAC address on L1 network segment. Device type: industrial switch. Not in asset inventory. Possible rogue device or misconfigured equipment.', mitre:'T0865', recommendation:'Identify device via plant walkdown before any network action. Create work order for asset inventory update. Monitor traffic passively until identified.', safeToAutoAct:false },
  { id:'ot-a5', title:'ICS protocol anomaly: excessive SCADA polling rate', severity:'Medium', source:'Claroty', device:'SCADA-PRIMARY', zone:'L2', ip:'192.168.101.5', protocol:'OPC-UA', time:'10:39', verdict:'SUS', confidence:62, description:'SCADA server polling PLCs at 10x normal rate (500ms vs 5s). Could indicate SCADA misconfiguration, script error, or unauthorised automated query. CPU impact on PLC-VALVE-BANK-A elevated to 78%.', mitre:'T0856', recommendation:'Check SCADA project for recent changes. High CPU on PLC-VALVE-BANK-A is a concern — notify process engineer if sustained above 80%. Reduce poll rate via SCADA config if confirmed misconfiguration.', safeToAutoAct:false },
  { id:'ot-a6', title:'Firmware version mismatch detected: PLC-VALVE-BANK-A', severity:'Low', source:'Nozomi Networks', device:'PLC-VALVE-BANK-A', zone:'L1', ip:'192.168.100.12', protocol:'Profibus', time:'11:15', verdict:'SUS', confidence:44, description:'Nozomi detected PLC-VALVE-BANK-A running firmware V3.3.13 — 4 CVEs identified including CVE-2023-38876 (CVSS 7.5, remote code execution via crafted Modbus packet). Firmware update required.', mitre:'T0862', recommendation:'Schedule firmware update during next planned maintenance window. Do not interrupt current operations. Apply compensating control: block external Modbus access to this PLC at L3.5 DMZ.', safeToAutoAct:false },
];

const DEMO_CROSS_ZONE = [
  { from:'L4', to:'L35', label:'Data sync', count:847, anomalous:false },
  { from:'L35', to:'L3', label:'MES update', count:23, anomalous:false },
  { from:'L3', to:'L2', label:'Production order push', count:156, anomalous:false },
  { from:'L2', to:'L1', label:'Control commands', count:2840, anomalous:false },
  { from:'L1', to:'L0', label:'Field comms', count:14200, anomalous:false },
  { from:'L2', to:'L0', label:'Direct poll — ANOMALOUS', count:847, anomalous:true },
  { from:'L4', to:'L2', label:'IT→SCADA bypass — ANOMALOUS', count:12, anomalous:true },
];

const DEVICE_ICONS = { PLC:'⚙', RTU:'📡', HMI:'🖥', SCADA:'📊', Historian:'🗄', 'MES Server':'🏭', 'Jump Server':'🔀', 'Data Diode':'🛡', 'ERP Server':'🏢', 'Flow Meter':'💧', 'Pressure Transmitter':'🔴', 'Temperature Sensor':'🌡' };
const STATUS_COLOR = { online:'#22d49a', degraded:'#f0a030', compromised:'#f0405e', offline:'#6b7a94' };

export default function OTTab({ tenantId, connectedTools = {}, demoMode, theme }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [otAssets] = useState(DEMO_OT_ASSETS);
  const [otAlerts] = useState(DEMO_OT_ALERTS);
  const [activeView, setActiveView] = useState('map'); // 'map' | 'assets' | 'alerts'
  const [triageCache, setTriageCache] = useState({});
  const [triaging, setTriaging] = useState(null);

  const zoneAssets = (zoneId) => otAssets.filter(a => a.zone === zoneId);
  const zoneAlerts = (zoneId) => otAlerts.filter(a => a.zone === zoneId);
  const totalDevices = otAssets.length;
  const criticalAlerts = otAlerts.filter(a => a.severity === 'Critical').length;
  const anomalies = DEMO_CROSS_ZONE.filter(c => c.anomalous).length;

  // OT-safe triage — calls /api/triage-ot, never auto-acts
  const triageAlert = async (alert) => {
    if (triageCache[alert.id]?.result) return;
    setTriaging(alert.id);
    setTriageCache(prev => ({ ...prev, [alert.id]: { loading: true, result: null } }));
    try {
      const r = await fetch('/api/triage-ot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ alertId: alert.id, title: alert.title, severity: alert.severity, source: alert.source, device: alert.device, zone: alert.zone, protocol: alert.protocol, description: alert.description, mitre: alert.mitre }),
      });
      const d = await r.json();
      setTriageCache(prev => ({ ...prev, [alert.id]: { loading: false, result: d.ok ? d.result : null } }));
    } catch { setTriageCache(prev => ({ ...prev, [alert.id]: { loading: false, result: null } })); }
    setTriaging(null);
  };

  const isOtConnected = ['claroty','nozomi','dragos','armis'].some(t => connectedTools[t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header strip ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem' }}>🏭</span>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: -0.3 }}>OT / ICS Security</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--wt-muted)' }}>Operational Technology — separate triage rules apply</div>
          </div>
          {demoMode && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: '#f0a03012', color: '#f0a030', border: '1px solid #f0a03030', fontWeight: 700 }}>DEMO DATA</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['map','assets','alerts'].map(v => (
            <button key={v} onClick={() => setActiveView(v)} style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${activeView === v ? '#4f8fff40' : 'var(--wt-border)'}`, background: activeView === v ? '#4f8fff12' : 'transparent', color: activeView === v ? '#4f8fff' : 'var(--wt-muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', textTransform: 'capitalize' }}>{v === 'map' ? '🗺 Purdue Map' : v === 'assets' ? '⚙ Assets' : '🚨 OT Alerts'}</button>
          ))}
        </div>
      </div>

      {/* ── Stat tiles ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }} className="wt-five-col">
        {[
          { label: 'OT Assets', val: totalDevices, color: '#4f8fff', icon: '⚙' },
          { label: 'Active OT Alerts', val: otAlerts.length, color: '#f0405e', icon: '🚨' },
          { label: 'Critical', val: criticalAlerts, color: '#f0405e', icon: '🔴' },
          { label: 'Cross-zone Anomalies', val: anomalies, color: '#f0a030', icon: '⚠' },
          { label: 'Zones Monitored', val: 6, color: '#22d49a', icon: '🗺' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', background: 'var(--wt-card)', border: `1px solid ${s.color}20`, borderRadius: 10 }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--wt-text)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── OT Safety Banner ─────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 14px', background: '#f0a03008', border: '1px solid #f0a03025', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⚠</span>
        <span style={{ fontSize: '0.78rem', color: '#f0a030', fontWeight: 600 }}>OT Safety Mode active</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--wt-muted)' }}>— APEX will never auto-isolate OT devices or auto-close OT alerts. All response actions require plant engineer confirmation.</span>
      </div>

      {/* ── PURDUE MAP VIEW ──────────────────────────────────────────────────── */}
      {activeView === 'map' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedZone ? '1fr 380px' : '1fr', gap: 14 }} className="wt-two-col">
          {/* Purdue zone bands */}
          <div style={{ background: 'var(--wt-card)', border: '1px solid var(--wt-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--wt-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Purdue Reference Model</div>
            {/* Cross-zone anomaly legend */}
            {DEMO_CROSS_ZONE.filter(c => c.anomalous).length > 0 && (
              <div style={{ padding: '6px 10px', background: '#f0405e08', border: '1px solid #f0405e25', borderRadius: 7, marginBottom: 8, fontSize: '0.76rem', color: '#f0405e' }}>
                ⚡ {DEMO_CROSS_ZONE.filter(c => c.anomalous).length} anomalous cross-zone traffic patterns detected
                {DEMO_CROSS_ZONE.filter(c => c.anomalous).map(a => (
                  <div key={a.label} style={{ marginTop: 3, color: 'var(--wt-muted)', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.72rem' }}>
                    {a.from} → {a.label} ({a.count} pkts/hr)
                  </div>
                ))}
              </div>
            )}
            {PURDUE_ZONES.map((zone, idx) => {
              const assets = zoneAssets(zone.id);
              const alerts = zoneAlerts(zone.id);
              const hasAnomaly = DEMO_CROSS_ZONE.some(c => (c.from === zone.id || c.to === zone.id) && c.anomalous);
              const isSelected = selectedZone === zone.id;
              const compromised = assets.filter(a => a.status === 'compromised').length;
              const degraded = assets.filter(a => a.status === 'degraded').length;
              return (
                <div key={zone.id} onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  style={{ padding: '10px 14px', background: isSelected ? zone.bg : hasAnomaly ? '#f0405e04' : 'transparent', border: `1px solid ${isSelected ? zone.color + '40' : hasAnomaly ? '#f0405e30' : zone.color + '20'}`, borderRadius: 9, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, flexShrink: 0 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: zone.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{zone.label}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--wt-text)', marginTop: 1, whiteSpace: 'nowrap' }}>{zone.id}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: zone.color + '20', border: `1px solid ${zone.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', flexShrink: 0 }}>{zone.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--wt-text)' }}>{zone.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--wt-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.desc}</div>
                  </div>
                  {/* Status dots row */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {assets.slice(0, 8).map(a => (
                      <div key={a.id} title={`${a.name} — ${a.status}`} style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[a.status] || '#6b7a94', flexShrink: 0 }} />
                    ))}
                    {assets.length > 8 && <span style={{ fontSize: '0.68rem', color: 'var(--wt-dim)' }}>+{assets.length - 8}</span>}
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--wt-muted)', fontFamily: 'JetBrains Mono,monospace' }}>{assets.length} dev</span>
                    {alerts.length > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: alerts.some(a => a.severity === 'Critical') ? '#f0405e' : '#f0a030', color: '#fff' }}>{alerts.length}</span>}
                    {hasAnomaly && <span style={{ fontSize: '0.7rem', color: '#f0405e' }}>⚡</span>}
                    {compromised > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: '#f0405e12', color: '#f0405e', border: '1px solid #f0405e30' }}>⚠ {compromised}</span>}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--wt-dim)', flexShrink: 0 }}>{isSelected ? '▲' : '▼'}</span>
                </div>
              );
            })}
          </div>

          {/* Zone detail panel */}
          {selectedZone && (() => {
            const zone = PURDUE_ZONES.find(z => z.id === selectedZone);
            const assets = zoneAssets(selectedZone);
            const alerts = zoneAlerts(selectedZone);
            return (
              <div style={{ background: 'var(--wt-card)', border: `1px solid ${zone.color}30`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{zone.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: zone.color }}>{zone.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--wt-muted)' }}>{zone.label}</div>
                  </div>
                  <button onClick={() => setSelectedZone(null)} style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--wt-border)', background: 'transparent', color: 'var(--wt-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>✕</button>
                </div>
                {alerts.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f0405e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Active Alerts ({alerts.length})</div>
                    {alerts.map(alert => (
                      <div key={alert.id} onClick={() => { setSelectedAlert(alert); setActiveView('alerts'); }} style={{ padding: '8px 10px', background: '#f0405e06', border: '1px solid #f0405e20', borderRadius: 7, marginBottom: 5, cursor: 'pointer' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--wt-text)' }}>{alert.title}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0 4px', borderRadius: 2, background: alert.severity === 'Critical' ? '#f0405e' : alert.severity === 'High' ? '#f97316' : '#f0a030', color: '#fff' }}>{alert.severity}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--wt-dim)', fontFamily: 'JetBrains Mono,monospace' }}>{alert.protocol}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--wt-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Assets ({assets.length})</div>
                  {assets.map(asset => (
                    <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderBottom: '1px solid var(--wt-border)' }}>
                      <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{DEVICE_ICONS[asset.type] || '🔧'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, fontFamily: 'JetBrains Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--wt-dim)' }}>{asset.vendor} {asset.model}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[asset.status], flexShrink: 0 }} />
                      {asset.cveCount > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0 4px', borderRadius: 3, background: '#8b6fff15', color: '#8b6fff', border: '1px solid #8b6fff25' }}>{asset.cveCount} CVE</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── ASSET INVENTORY VIEW ─────────────────────────────────────────────── */}
      {activeView === 'assets' && (
        <div style={{ background: 'var(--wt-card)', border: '1px solid var(--wt-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--wt-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--wt-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>OT Asset Inventory</span>
            <span style={{ fontSize: '0.78rem', color: '#4f8fff', fontFamily: 'JetBrains Mono,monospace', marginLeft: 'auto' }}>{totalDevices} devices</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--wt-dim)', textTransform: 'uppercase', padding: '6px 16px', borderBottom: '1px solid var(--wt-border)', background: 'var(--wt-card2)' }}>
            <span>Device</span><span>Type / Zone</span><span>Vendor / Model</span><span>Protocols</span><span>Status</span>
          </div>
          {otAssets.map((asset, i) => (
            <div key={asset.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, padding: '8px 16px', borderBottom: '1px solid var(--wt-border)', background: i % 2 === 0 ? 'transparent' : 'var(--wt-card2)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.82rem' }}>{DEVICE_ICONS[asset.type] || '🔧'}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, fontFamily: 'JetBrains Mono,monospace' }}>{asset.name}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--wt-text)' }}>{asset.type}</div>
                <div style={{ fontSize: '0.68rem', color: PURDUE_ZONES.find(z => z.id === asset.zone)?.color || 'var(--wt-muted)' }}>{PURDUE_ZONES.find(z => z.id === asset.zone)?.name || asset.zone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--wt-text)' }}>{asset.vendor}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--wt-dim)' }}>{asset.model}</div>
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {asset.protocols.slice(0, 2).map(p => (
                  <span key={p} style={{ fontSize: '0.62rem', padding: '0 4px', borderRadius: 3, background: '#4f8fff10', color: '#4f8fff', border: '1px solid #4f8fff20' }}>{p}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[asset.status] }} />
                <span style={{ fontSize: '0.74rem', color: STATUS_COLOR[asset.status], fontWeight: 600 }}>{asset.status}</span>
                {asset.cveCount > 0 && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0 4px', borderRadius: 3, background: '#8b6fff12', color: '#8b6fff' }}>{asset.cveCount} CVE</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── OT ALERT FEED ────────────────────────────────────────────────────── */}
      {activeView === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {otAlerts.map(alert => {
            const triage = triageCache[alert.id];
            const isExpanded = selectedAlert?.id === alert.id;
            const zone = PURDUE_ZONES.find(z => z.id === alert.zone);
            const sevColor = alert.severity === 'Critical' ? '#f0405e' : alert.severity === 'High' ? '#f97316' : alert.severity === 'Medium' ? '#f0a030' : '#4f8fff';
            return (
              <div key={alert.id} style={{ background: 'var(--wt-card)', border: `1px solid ${isExpanded ? sevColor + '30' : 'var(--wt-border)'}`, borderLeft: `3px solid ${sevColor}`, borderRadius: 10, overflow: 'hidden' }}>
                <div onClick={() => { setSelectedAlert(isExpanded ? null : alert); if (!isExpanded && !triage?.result) triageAlert(alert); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: sevColor, textTransform: 'uppercase' }}>{alert.severity}</span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--wt-text)' }}>{alert.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--wt-dim)', fontFamily: 'JetBrains Mono,monospace' }}>{alert.device}</span>
                      <span style={{ fontSize: '0.68rem', padding: '0 4px', borderRadius: 3, background: zone?.color + '15' || '#4f8fff15', color: zone?.color || '#4f8fff', border: `1px solid ${zone?.color + '30' || '#4f8fff30'}` }}>{zone?.name || alert.zone}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--wt-dim)' }}>{alert.protocol}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--wt-dim)' }}>{alert.source} · {alert.time}</span>
                    </div>
                  </div>
                  {triaging === alert.id && <span style={{ fontSize: '0.7rem', color: '#4f8fff', animation: 'pulse 1s ease infinite', flexShrink: 0 }}>⟳ APEX OT…</span>}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f0a03012', color: '#f0a030', border: '1px solid #f0a03025' }}>⚠ No auto-action</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--wt-border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--wt-secondary)', lineHeight: 1.6 }}>{alert.description}</p>
                    <div style={{ padding: '8px 12px', background: '#f0a03008', border: '1px solid #f0a03025', borderRadius: 7 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f0a030', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>OT-Safe Recommendation</div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--wt-secondary)', lineHeight: 1.6 }}>{alert.recommendation}</p>
                    </div>
                    {triage?.result && (
                      <div style={{ padding: '10px 12px', background: '#4f8fff06', border: '1px solid #4f8fff20', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f8fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>✦ APEX OT Analysis</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--wt-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{triage.result.analystNarrative}</p>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wt-muted)', marginBottom: 4 }}>Evidence Chain</div>
                        {(triage.result.evidenceChain || []).map((e, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.76rem', color: 'var(--wt-secondary)', marginBottom: 2 }}>
                            <span style={{ color: '#4f8fff', flexShrink: 0 }}>{i + 1}.</span>{e}
                          </div>
                        ))}
                        {triage.result.otSafeActions?.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22d49a', marginBottom: 4 }}>OT-Safe Actions</div>
                            {triage.result.otSafeActions.map((a, i) => (
                              <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.76rem', color: '#22d49a', marginBottom: 2 }}>
                                <span>→</span>{a}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => triageAlert(alert)} disabled={!!triage?.loading} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #4f8fff40', background: '#4f8fff12', color: '#4f8fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                        {triage?.loading ? '⟳ Analyzing...' : triage?.result ? '⟳ Re-analyse' : '✦ APEX OT Triage'}
                      </button>
                      <span style={{ fontSize: '0.72rem', color: 'var(--wt-muted)' }}>Analyst confirmation required for any action</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

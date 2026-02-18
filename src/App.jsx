import { useState } from "react";

const CATS = {
  power:{label:"Power",color:"#d35400",ico:"\u26A1"},
  network:{label:"Network",color:"#2471a3",ico:"\uD83C\uDF10"},
  compute:{label:"Compute",color:"#1e8449",ico:"\uD83D\uDDA5"},
  storage:{label:"Storage",color:"#8e44ad",ico:"\uD83D\uDCBE"},
  accessory:{label:"Accessory",color:"#7d3c98",ico:"\uD83D\uDD27"},
  diy:{label:"3D Printed",color:"#e67e22",ico:"\uD83D\uDEE0"},
};

const VLANS = [
  {id:10,name:"Trusted",subnet:"10.0.10.0/24",color:"#2ecc71",desc:"Personal devices, laptops, phones"},
  {id:20,name:"Servers / Lab",subnet:"10.0.20.0/24",color:"#3498db",desc:"Proxmox, TrueNAS, Pi cluster"},
  {id:30,name:"IoT / Untrusted",subnet:"10.0.30.0/24",color:"#e74c3c",desc:"Smart home, cameras, guests"},
];

const FW = [
  {from:"Trusted (10)",to:"Servers (20)",act:"ALLOW",c:"#2ecc71"},
  {from:"Trusted (10)",to:"IoT (30)",act:"ALLOW",c:"#2ecc71"},
  {from:"Trusted (10)",to:"Internet",act:"ALLOW",c:"#2ecc71"},
  {from:"Servers (20)",to:"IoT (30)",act:"ALLOW",c:"#2ecc71"},
  {from:"Servers (20)",to:"Internet",act:"ALLOW",c:"#2ecc71"},
  {from:"Servers (20)",to:"Trusted (10)",act:"DROP",c:"#e74c3c"},
  {from:"IoT (30)",to:"Internet",act:"ALLOW",c:"#2ecc71"},
  {from:"IoT (30)",to:"Everything else",act:"DROP",c:"#e74c3c"},
];

function mkItems(is10g) {
  const sw = is10g
    ? {u:"1U",uN:1,name:"MikroTik CSS318-16G-2S+IN",cat:"network",brand:"MikroTik",price:180,w:13,
       desc:"16x 1G Ethernet + 2x 10G SFP+. SwOS managed. Native 10-inch rack ears.",
       notes:"16 ports at 1G with dual 10G SFP+ uplinks. SwOS provides VLAN, MAC filtering, mirroring. 10G SFP+ ports connect to MS-01 nodes and RB5009 at wire speed.",
       diff:"16x 1G ports (vs 8x 2.5G). More ports but slower per-port. SwOS instead of RouterOS."}
    : {u:"1U",uN:1,name:"MikroTik CRS310-8G+2S+IN",cat:"network",brand:"MikroTik",price:160,w:34,
       desc:"8x 2.5G Ethernet + 2x SFP+ (multi-rate). Full RouterOS v7 -- VLANs, ACLs, L3 routing.",
       notes:"Every RJ45 runs 2.5G natively. Full RouterOS v7 enables VLAN trunking, ACLs, hardware-offloaded switching. SFP+ cages for future 10G. Fits with RMK-2/10 bracket.",
       extras:[{name:"RMK-2/10 Bracket",price:12}]};

  const pxNode = is10g
    ? (idx) => ({u:"1U",uN:1,name:`Proxmox Node ${idx} (MS-01)`,cat:"compute",brand:"Minisforum",price:750,w:45,
       desc:`i9-13900H (14C/20T), 64GB DDR5, 2x 10G SFP+ + 2x 2.5G, 3x NVMe, PCIe x16.`,
       notes:`Premium compute. Dual SFP+ at 10G wire speed. 14 cores for heavy virtualisation. PCIe x16 for GPU passthrough. 25-45W idle.${idx===2?" Two-node cluster: 28 cores, 128GB RAM total.":""}`,
       diff:"Massively more powerful. Dual 10G SFP+. PCIe x16. NVMe. ~$620 more per node.",
       extras:[{name:"64GB DDR5-5200",price:150},{name:"2TB NVMe",price:160},{name:"1U DeskPi Shelf",price:12}]})
    : (idx) => ({u:"1U",uN:1,name:`Proxmox Node ${idx} (OptiPlex 9020M)`,cat:"compute",brand:"Dell",price:130,w:10,
       desc:`i5-4590T (4C/4T, 3.0GHz turbo), 16GB DDR3L, M.2 SATA boot + 2.5" bay, 1G + USB 2.5G adapter. Refurbished.`,
       notes:`Bargain at ~$100-130 AUD refurbished. Haswell with VT-x and VT-d for Proxmox passthrough. The i5-4590T is a 35W T-series -- whisper quiet, ~10W idle.\n\nLimitations: max 16GB DDR3L (not 32GB DDR4), M.2 slot is SATA only (no NVMe), 4 cores. For lightweight VMs and containers, 4C/4T is adequate. Upgrade path: swap to OptiPlex 7060/7080 Micro (64GB DDR4, NVMe) into the same shelf.${idx===2?" Two-node cluster: 8 cores, 32GB RAM.":""}`,
       extras:[{name:"16GB DDR3L-1600 (2x8GB)",price:25},{name:"256GB M.2 SATA SSD",price:30},{name:"USB 3.0 2.5G Ethernet",price:25},{name:"1U DeskPi Shelf",price:12}]});

  const nas = {u:"1U",uN:1,name:"TrueNAS Node (MS-01)",cat:"storage",brand:"Minisforum",price:750,w:35,
    desc:"i9-13900H, 32GB DDR5, NVMe boot. PCIe x16 holds LSI HBA. SFF-8087 breakout routes down to drive cage.",
    notes:"MS-01 required regardless of build tier -- needs the PCIe slot for the HBA. LSI 9211-8i (IT mode, low-profile bracket) passes raw disks to ZFS with zero abstraction.\n\nSFF-8087 breakout fans out to 4x SATA data connectors routed down to the drive cage. 32GB for ZFS ARC cache. Dual 2.5G RJ45 serves NFS/SMB to both Proxmox nodes.",
    extras:[
      {name:"32GB DDR5-5200",price:80},
      {name:"256GB NVMe Boot",price:40},
      {name:"LSI 9211-8i HBA (IT mode, LP)",price:55},
      {name:"SFF-8087 to 4x SATA Breakout",price:15},
      {name:"1U DeskPi Shelf",price:12},
    ]};

  // Order: LCD top -> PDU -> Patch -> Switch -> Router -> PX1 -> PX2 -> TrueNAS -> Pi -> Drive Cage (bottom, heaviest)
  return [
    {u:"2U",uN:2,name:'7.84" Touch LCD Monitor',cat:"accessory",brand:"DeskPi",price:65,w:5,
     desc:"1280x400 capacitive touch screen. USB-C + HDMI. Rack-mounted dashboard.",
     notes:"Top of rack for easy viewing. HDMI to a Pi or TrueNAS node. Run Grafana showing VLAN health, ZFS pool status, drive temps, container stats. Touch for interaction. Visible through acrylic side panels."},
    {u:"0.5U",uN:0.5,name:"DC PDU Lite 7-CH",cat:"power",brand:"DeskPi",price:35,w:2,
     desc:"0.5U DC power distribution. 7 individually-switched outlets.",
     notes:"Central power for all DC devices. Individual switches for power-cycling. Also feeds the Pico PSU that provides SATA power to the drive cage at the bottom."},
    {u:"0.5U",uN:0.5,name:"12-Port CAT6 Patch Panel",cat:"network",brand:"GeeekPi",price:18,w:0,
     desc:"0.5U keystone patch panel. 12x CAT6 ports. Punch down rear, patch from front.",
     notes:"Every device terminates at the back. Short patch cables on front to the switch. Swap devices without touching rear wiring."},
    sw,
    {u:"1U",uN:1,name:"MikroTik RB5009UG+S+IN",cat:"network",brand:"MikroTik",price:220,w:15,
     desc:"Router/Firewall. 7x 1G + 1x 2.5G + 1x 10G SFP+. RouterOS v7.",
     notes:"The brain. Inter-VLAN routing, stateful firewall, DHCP (3 subnets), DNS, NAT, VPN. WAN on ether1 to NBN NTD. 2.5G uplink to switch. VLAN trunk on ether5 to UniFi AP. Identical in both builds.",
     extras:[{name:"RMK-2x10/19 Bracket",price:15}]},
    pxNode(1),
    pxNode(2),
    nas,
    {u:"1U",uN:1,name:"4x Raspberry Pi 5 Cluster",cat:"compute",brand:"Pi + DeskPi",price:380,w:32,
     desc:"Four Pi 5 (8GB) horizontal in 1U tray. Each with PCIe NVMe adapter.",
     notes:"Four Pi 5 boards side-by-side horizontally in 1U DeskPi tray (~85x56mm each, ~340mm total width). Split duties: Pi-hole DNS, WireGuard/Tailscale VPN, UniFi Controller, Home Assistant.\n\n~5-8W each. Independent of Proxmox so DNS/VPN/HA survives cluster reboots. Could also run K3s. Sits just above the drive cage for easy cable routing to the LCD above.",
     extras:[{name:"DeskPi 1U Rack Mount (4x Pi)",price:45},{name:"4x NVMe HAT + 256GB",price:180},{name:"4x Pi 5 PSU",price:60}]},
    {u:"3U",uN:3,name:"4-Bay 3.5\" Drive Cage (3D Printed)",cat:"diy",brand:"Custom / 3D Printed",price:15,w:25,
     desc:"2x2 grid of 3.5\" drive caddies. 3D-printed frame on rack rails. Rear 80mm fan. SATA power from Pico PSU.",
     notes:"Bottom of rack -- heaviest component, keeps centre of gravity low for portability.\n\nTwo 3.5\" drives side by side = 203.2mm. Internal 10-inch rack = ~212mm. ~4mm clearance per side for caddy walls. 2x2 grid in 3U.\n\n3D-printed frame: rail-mount ears (standard 10-inch hole spacing), individual drive sleds with tool-free latch, rear 80mm Noctua fan mount, cable routing channels.\n\nSFF-8087 breakout from LSI HBA two slots above splits to 4x SATA data. Pico DC-ATX PSU takes 12V from PDU and outputs 12V/5V/3.3V via molex-to-SATA splitter.\n\nPrint in PETG or ASA -- PLA will warp near warm drives. M3 brass heat-set inserts for all mounting points.",
     extras:[
       {name:"Pico DC-ATX PSU (12V in, SATA out)",price:30},
       {name:"Molex to 4x SATA Power Splitter",price:8},
       {name:"80mm Noctua NF-A8 Fan",price:25},
       {name:"PETG/ASA Filament (~200g)",price:8},
       {name:"M3 Brass Inserts + Screws",price:10},
       {name:"4x 4TB WD Red Plus (example)",price:600},
     ]},
    // External
    {u:"EXT",uN:0,name:"UniFi U6 Pro AP",cat:"network",brand:"Ubiquiti",price:230,w:15,
     desc:"WiFi 6 AP. Ceiling mount. VLAN trunk from RB5009. 3 SSIDs for 3 VLANs.",
     notes:"Ceiling-mounted, not in rack. Single Ethernet from RB5009 ether5 carries tagged VLANs 10/20/30. Broadcasts HomeWiFi (Trusted), ServerMgmt (Servers), IoT-Devices (IoT). Managed by UniFi Controller on a Pi.", external:true},
  ];
}

const cost = items => items.reduce((s,i) => s + i.price + (i.extras ? i.extras.reduce((a,e) => a+e.price,0) : 0), 0);
const watts = items => items.filter(i => !i.external).reduce((s,i) => s+i.w, 0);
const uTot = items => items.filter(i => !i.external).reduce((s,i) => s+i.uN, 0);

export default function App() {
  const [is10g, setIs10g] = useState(false);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("rack");
  const items = mkItems(is10g);
  const rack = items.filter(i => !i.external);
  const ext = items.filter(i => i.external);
  const it = sel !== null && sel < items.length ? items[sel] : null;
  const ct = it ? CATS[it.cat] : null;
  const toggle = () => { setIs10g(!is10g); setSel(null); };
  const totalU = uTot(items);

  return (
    <div style={{fontFamily:"'JetBrains Mono','SF Mono',monospace",background:"#08080a",color:"#ddd",minHeight:"100vh",padding:"14px 18px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{maxWidth:1100,margin:"0 auto 10px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap"}}>
          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:21,fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>10" PORTABLE HOMELAB</h1>
          <div style={{display:"flex",borderRadius:4,overflow:"hidden",border:"1px solid #333"}}>
            {[false,true].map(v=>(
              <button key={String(v)} onClick={toggle} style={{fontFamily:"inherit",fontSize:10,fontWeight:is10g===v?700:400,color:is10g===v?"#fff":"#666",background:is10g===v?(v?"#e67e22":"#2471a3"):"transparent",border:"none",padding:"4px 14px",cursor:"pointer",transition:"all .15s"}}>
                {v?"10G":"2.5G"}
              </button>
            ))}
          </div>
          <span style={{fontSize:9,color:"#444"}}>DeskPi RackMate T2 | {totalU}U / 12U</span>
        </div>
        <div style={{height:2,background:is10g?"linear-gradient(90deg,#e67e22,#2980b9,#27ae60,#8e44ad)":"linear-gradient(90deg,#2471a3,#1e8449,#8e44ad,#d35400)",borderRadius:1,opacity:.6,marginBottom:7}}/>
        <div style={{display:"flex",gap:14,fontSize:10,color:"#666",flexWrap:"wrap"}}>
          <span>RACK <b style={{color:totalU<=12?"#2ecc71":"#e74c3c"}}>{totalU}U / 12U</b>{totalU===12&&<span style={{color:"#2ecc71",fontSize:9}}> (full)</span>}</span>
          <span>POWER <b style={{color:"#d35400"}}>~{watts(items)}W</b></span>
          <span>COST <b style={{color:"#1e8449"}}>~${cost(items).toLocaleString()} AUD</b></span>
          <span>VLANs <b style={{color:"#2471a3"}}>3 + WAN</b></span>
          <span>STORAGE <b style={{color:"#8e44ad"}}>4x 3.5" HBA {"\u2192"} ZFS</b></span>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto 8px",display:"flex",gap:2}}>
        {[{id:"rack",l:"Rack Layout"},{id:"vlans",l:"VLANs & Firewall"},{id:"storage",l:"Storage Path"},{id:"compare",l:"2.5G vs 10G"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{fontFamily:"inherit",fontSize:10,fontWeight:tab===t.id?600:400,color:tab===t.id?"#fff":"#555",background:tab===t.id?"#18181c":"transparent",border:`1px solid ${tab===t.id?"#2a2a30":"transparent"}`,borderRadius:4,padding:"5px 10px",cursor:"pointer"}}>{t.l}</button>
        ))}
      </div>

      <div style={{maxWidth:1100,margin:"0 auto"}}>

      {/* RACK TAB */}
      {tab==="rack"&&(
        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:12}}>
          <div>
            <div style={{background:"#101012",border:"1px solid #1c1c20",borderRadius:8,padding:9}}>
              <div style={{fontSize:8,color:"#444",textAlign:"center",marginBottom:4,textTransform:"uppercase",letterSpacing:2}}>DeskPi RackMate T2 -- 12U -- Click any slot</div>
              <div style={{background:"#0a0a0c",border:"2px solid #141416",borderRadius:4,padding:"4px 4px",display:"flex",flexDirection:"column",gap:2}}>
                {rack.map((item,idx)=>{
                  const gi=items.indexOf(item),isSel=sel===gi,c=CATS[item.cat],h=Math.max(item.uN*38,22);
                  return(
                    <div key={idx} onClick={()=>setSel(isSel?null:gi)} style={{height:h,background:isSel?`${c.color}15`:"linear-gradient(180deg,#151517,#121214)",border:`1px solid ${isSel?c.color+"55":"#1c1c20"}`,borderRadius:3,display:"flex",alignItems:"center",padding:"0 6px",cursor:"pointer",transition:"all .12s",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:c.color,opacity:isSel?1:.25}}/>
                      <span style={{fontSize:7.5,color:"#444",width:24,flexShrink:0,paddingLeft:3}}>{item.u}</span>
                      <span style={{fontSize:item.uN>=2?9.5:8.5,fontWeight:isSel?600:400,color:isSel?"#fff":"#888",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</span>
                      {item.w>0&&<span style={{fontSize:7,color:"#555"}}>{item.w}W</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:8,color:"#444",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3,textAlign:"center"}}>External (ceiling-mounted)</div>
                {ext.map(item=>{const gi=items.indexOf(item),isSel=sel===gi,c=CATS[item.cat];
                  return(
                    <div key={gi} onClick={()=>setSel(isSel?null:gi)} style={{height:26,background:isSel?`${c.color}15`:"#121214",border:`1px dashed ${isSel?c.color:"#252528"}`,borderRadius:3,display:"flex",alignItems:"center",padding:"0 6px",cursor:"pointer",marginBottom:2}}>
                      <span style={{fontSize:8.5,color:isSel?"#ccc":"#777",flex:1}}>{item.name}</span>
                      <span style={{fontSize:7,color:"#555"}}>{item.w}W</span>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
                {Object.entries(CATS).map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:3,fontSize:7.5,color:"#555"}}><div style={{width:5,height:5,borderRadius:2,background:v.color}}/>{v.label}</div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {it?(
              <div key={String(sel)+String(is10g)} style={{background:"#101012",border:`1px solid ${ct.color}22`,borderRadius:8,padding:16,animation:"fi .2s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
                  <div style={{width:30,height:30,borderRadius:6,background:`${ct.color}12`,border:`1px solid ${ct.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{ct.ico}</div>
                  <div>
                    <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:700,color:"#fff"}}>{it.name}</h2>
                    <div style={{fontSize:9,color:"#666",marginTop:1}}>
                      {it.brand} | {it.u} | {it.w}W | <span style={{color:ct.color}}>{ct.label}</span>
                      {it.external&&<span style={{color:"#d35400"}}> | External</span>}
                    </div>
                  </div>
                </div>
                <p style={{fontSize:10.5,lineHeight:1.65,color:"#bbb",marginBottom:10}}>{it.desc}</p>
                <div style={{background:"#0a0a0c",border:"1px solid #181818",borderRadius:6,padding:11,marginBottom:10}}>
                  <div style={{fontSize:8,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Why this choice</div>
                  <p style={{fontSize:10,lineHeight:1.7,color:"#888",whiteSpace:"pre-line"}}>{it.notes}</p>
                </div>
                {it.diff&&(
                  <div style={{background:"#1a1508",border:"1px solid #d3540030",borderRadius:6,padding:11,marginBottom:10}}>
                    <div style={{fontSize:8,color:"#d35400",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Build difference</div>
                    <p style={{fontSize:10,lineHeight:1.7,color:"#b8860b"}}>{it.diff}</p>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#999"}}><span>Base unit</span><span style={{fontWeight:600}}>~${it.price} AUD</span></div>
                  {it.extras&&it.extras.map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#666",paddingLeft:10}}><span>+ {e.name}</span><span>~${e.price}</span></div>
                  ))}
                  <div style={{borderTop:"1px solid #1c1c20",paddingTop:3,marginTop:2,display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,color:"#fff"}}>
                    <span>Subtotal</span>
                    <span>~${(it.price+(it.extras?it.extras.reduce((s,e)=>s+e.price,0):0)).toLocaleString()} AUD</span>
                  </div>
                </div>
              </div>
            ):(
              <div style={{background:"#101012",border:"1px solid #1c1c20",borderRadius:8,padding:24,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:8,minHeight:240}}>
                <div style={{fontSize:22,opacity:.15}}>{"\u2190"}</div>
                <p style={{fontSize:10.5,color:"#444",maxWidth:200,lineHeight:1.6}}>Click any slot for specs, reasoning, and pricing.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VLANS TAB */}
      {tab==="vlans"&&(
        <div style={{animation:"fi .2s ease"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {VLANS.map(v=>(
              <div key={v.id} style={{background:"#101012",border:`1px solid ${v.color}30`,borderRadius:8,padding:13}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}><div style={{width:8,height:8,borderRadius:3,background:v.color}}/><span style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:600,color:"#fff"}}>VLAN {v.id}</span></div>
                <div style={{fontSize:11,color:"#ccc",marginBottom:2}}>{v.name}</div>
                <div style={{fontSize:9.5,color:"#777",marginBottom:4}}>{v.desc}</div>
                <div style={{fontSize:9,color:v.color,fontWeight:600}}>{v.subnet}</div>
                <div style={{fontSize:8,color:"#555",marginTop:2}}>GW: {v.subnet.replace(".0/24",".1")} | DHCP: .100-.200</div>
              </div>
            ))}
          </div>
          <div style={{background:"#101012",border:"1px solid #1c1c20",borderRadius:8,padding:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:600,color:"#fff",marginBottom:8}}>Firewall Policy (RB5009)</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:10}}>
              {FW.map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:"#0a0a0c",borderRadius:4,border:"1px solid #181818"}}>
                  <span style={{color:"#999",flex:1}}>{r.from} {"\u2192"} {r.to}</span>
                  <span style={{color:r.c,fontWeight:700,fontSize:9}}>{r.act}</span>
                </div>
              ))}
            </div>
            <p style={{fontSize:8.5,color:"#555",marginTop:8,lineHeight:1.6}}>Stateful firewall on RB5009. IoT responds to established/related but cannot initiate.</p>
          </div>
        </div>
      )}

      {/* STORAGE PATH TAB */}
      {tab==="storage"&&(
        <div style={{animation:"fi .2s ease"}}>
          <div style={{background:"#101012",border:"1px solid #8e44ad33",borderRadius:8,padding:18,marginBottom:14}}>
            <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:600,color:"#fff",marginBottom:12}}>Storage Data Path</h3>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {label:"3.5\" SATA Drives (x4) -- Bottom of rack",sub:"WD Red Plus / IronWolf in 3D-printed caddies (3U)",color:"#8e44ad"},
                {label:"\u2193  SATA III (6 Gbps per drive)",sub:"Individual data cables from SFF-8087 breakout",color:"#555"},
                {label:"SFF-8087 to 4x SATA Breakout",sub:"Single Mini-SAS cable splits to 4 SATA. Short run (2 slots up).",color:"#e67e22"},
                {label:"\u2193  SFF-8087 (4x 6Gbps = 24Gbps aggregate)",sub:"Mini-SAS connector on HBA",color:"#555"},
                {label:"LSI 9211-8i HBA (IT Mode)",sub:"PCIe 2.0 x8 in MS-01 x16 slot. LP bracket. Raw disk passthrough.",color:"#2471a3"},
                {label:"\u2193  PCIe 2.0 x8 (4 GB/s)",sub:"Internal bus to MS-01 CPU",color:"#555"},
                {label:"TrueNAS Scale (MS-01)",sub:"ZFS pool, snapshots, scrubs, shares. ARC in RAM. Optional L2ARC on NVMe.",color:"#1e8449"},
                {label:"\u2193  NFS / SMB / iSCSI over 2.5G",sub:"To Proxmox nodes for shared VM storage",color:"#555"},
                {label:`Proxmox Cluster (${is10g?"2x MS-01":"2x OptiPlex 9020M"})`,sub:"NFS datastore for VMs with ZFS protection.",color:"#1e8449"},
              ].map((s,i)=>(
                <div key={i} style={{padding:s.color==="#555"?"2px 0":"8px 10px",background:s.color==="#555"?"transparent":"#0a0a0c",border:s.color==="#555"?"none":"1px solid #181818",borderRadius:s.color==="#555"?0:5,textAlign:s.color==="#555"?"center":"left"}}>
                  <div style={{fontSize:s.color==="#555"?9:10.5,fontWeight:s.color==="#555"?400:600,color:s.color==="#555"?"#444":s.color}}>{s.label}</div>
                  {s.sub&&<div style={{fontSize:s.color==="#555"?8:9,color:"#666",marginTop:1}}>{s.sub}</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{background:"#101012",border:"1px solid #e67e2233",borderRadius:8,padding:14}}>
              <h4 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:600,color:"#e67e22",marginBottom:8}}>3D Printed Drive Cage</h4>
              <div style={{fontSize:10,color:"#888",lineHeight:1.7}}>
                <p style={{marginBottom:6}}>10-inch internal: ~212mm. Two 3.5" (101.6mm each) = 203.2mm. ~4mm per side for walls. 2x2 grid in 3U.</p>
                <p style={{marginBottom:6}}>PETG or ASA (not PLA). M3 brass heat-set inserts. Rear 80mm Noctua. Tool-free caddy latches.</p>
                <p>SATA power from Pico DC-ATX (12V PDU input, 12V/5V/3.3V output) via molex-to-SATA splitter.</p>
              </div>
            </div>
            <div style={{background:"#101012",border:"1px solid #8e44ad33",borderRadius:8,padding:14}}>
              <h4 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:600,color:"#8e44ad",marginBottom:8}}>ZFS Layout Options (4x drives)</h4>
              <div style={{display:"flex",flexDirection:"column",gap:5,fontSize:10,color:"#888"}}>
                {[
                  {mode:"RAIDZ1",cap:"~12TB (4x 4TB)",pro:"Good capacity, single-parity",con:"1 drive tolerance"},
                  {mode:"2x Mirror",cap:"~8TB (4x 4TB)",pro:"Fast reads/rebuilds, best for VMs",con:"50% capacity"},
                  {mode:"Stripe",cap:"~16TB",pro:"Max space + speed",con:"Zero redundancy"},
                ].map((z,i)=>(
                  <div key={i} style={{background:"#0a0a0c",border:"1px solid #181818",borderRadius:4,padding:8}}>
                    <div style={{fontWeight:600,color:"#ccc",marginBottom:2}}>{z.mode}</div>
                    <div style={{color:"#8e44ad",fontSize:9}}>{z.cap}</div>
                    <div style={{fontSize:8.5,color:"#666",marginTop:2}}>+ {z.pro} | - {z.con}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPARE TAB */}
      {tab==="compare"&&(()=>{
        const i25=mkItems(false),i10=mkItems(true);
        return(
          <div style={{animation:"fi .2s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {[
                {t:"2.5G Build",c:"#2471a3",hl:[
                  "CRS310: 8x 2.5G + 2x SFP+ (RouterOS v7)",
                  "2x Dell OptiPlex 9020M (i5-4590T, 16GB)",
                  "1x MS-01 TrueNAS (PCIe for HBA)",
                  "4-bay 3D printed cage + LSI 9211-8i",
                  `~$${cost(i25).toLocaleString()} AUD | ~${watts(i25)}W`,
                ]},
                {t:"10G Build",c:"#e67e22",hl:[
                  "CSS318: 16x 1G + 2x 10G SFP+ (SwOS)",
                  "2x MS-01 (i9-13900H, 64GB DDR5, 10G)",
                  "1x MS-01 TrueNAS (10G + PCIe HBA)",
                  "4-bay 3D printed cage + LSI 9211-8i",
                  `~$${cost(i10).toLocaleString()} AUD | ~${watts(i10)}W`,
                ]}
              ].map((b,i)=>(
                <div key={i} style={{background:"#101012",border:`1px solid ${b.c}33`,borderRadius:8,padding:14}}>
                  <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:"#fff",marginBottom:8}}>{b.t}</h3>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {b.hl.map((h,j)=>(<div key={j} style={{fontSize:10,color:"#999",padding:"5px 8px",background:"#0a0a0c",borderRadius:4,border:"1px solid #181818"}}>{h}</div>))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"#101012",border:"1px solid #1c1c20",borderRadius:8,padding:14,marginBottom:12}}>
              <h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,fontWeight:600,color:"#fff",marginBottom:7}}>Identical in both</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,fontSize:10,color:"#888"}}>
                {["RB5009 router/firewall","3x VLAN architecture","All firewall rules","UniFi U6 Pro AP","4x Pi 5 cluster (1U)","LSI 9211-8i HBA","4-bay 3D printed cage","ZFS on TrueNAS Scale","MS-01 TrueNAS node","7.84\" Touch LCD (top)","DeskPi RackMate T2 12U","Drives at bottom (stable)"].map((s,i)=>(
                  <div key={i} style={{padding:"4px 6px",background:"#0a0a0c",borderRadius:4,border:"1px solid #181818",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:"#2ecc71",fontSize:10}}>{"\u2713"}</span>{s}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{background:"#101012",border:"1px solid #2471a333",borderRadius:8,padding:14}}>
                <h4 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:600,color:"#2471a3",marginBottom:8}}>Choose 2.5G when...</h4>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {[`Budget priority (saves ~$${(cost(i10)-cost(i25)).toLocaleString()})`,`Low power (~${watts(i10)-watts(i25)}W less)`,"Lightweight VMs and containers","OptiPlex 9020Ms everywhere for <$130","Upgrade nodes later (7060/7080)"].map((s,i)=>(
                    <div key={i} style={{fontSize:10,color:"#888",lineHeight:1.5}}>{s}</div>
                  ))}
                </div>
              </div>
              <div style={{background:"#101012",border:"1px solid #e67e2233",borderRadius:8,padding:14}}>
                <h4 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:11,fontWeight:600,color:"#e67e22",marginBottom:8}}>Choose 10G when...</h4>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {["Heavy VMs, fast live migration","Wire-speed NFS/iSCSI storage","PCIe GPU passthrough","28+ cores, 128GB+ RAM","Future 10G fabric"].map((s,i)=>(
                    <div key={i} style={{fontSize:10,color:"#888",lineHeight:1.5}}>{s}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}

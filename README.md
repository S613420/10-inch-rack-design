# 10-Inch Portable Homelab Rack Designer

Interactive rack layout designer for a 10-inch portable homelab build, featuring:

- **2.5G / 10G build toggle** -- compare budget (Dell OptiPlex 9020M) vs premium (Minisforum MS-01) builds
- **Clickable rack layout** -- click any slot for detailed specs, reasoning, and pricing
- **VLAN & Firewall tab** -- 3-VLAN architecture with full firewall policy matrix
- **Storage Path tab** -- HBA direct-attach storage flow from 3D-printed drive cage through LSI 9211-8i to TrueNAS/ZFS
- **2.5G vs 10G comparison** -- side-by-side specs, pricing, and decision criteria

## Rack Layout (12U DeskPi RackMate T2)

| Position | Component | Height |
|----------|-----------|--------|
| Top | 7.84" Touch LCD | 2U |
| | DC PDU Lite 7-CH | 0.5U |
| | 12-Port CAT6 Patch Panel | 0.5U |
| | MikroTik Switch | 1U |
| | MikroTik RB5009 Router | 1U |
| | Proxmox Node 1 | 1U |
| | Proxmox Node 2 | 1U |
| | TrueNAS Node (MS-01 + HBA) | 1U |
| | 4x Raspberry Pi 5 Cluster | 1U |
| Bottom | 4-Bay 3D-Printed Drive Cage | 3U |

## Tech Stack

- React 18 + Vite
- Zero dependencies beyond React
- Auto-deploys to GitHub Pages via Actions

## Development

```bash
npm install
npm run dev
```

## Live Site

[https://s613420.github.io/10-inch-rack-design/](https://s613420.github.io/10-inch-rack-design/)
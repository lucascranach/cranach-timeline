# Lucas Cranach Timeline

An interactive 3D timeline visualization of Lucas Cranach the Elder and Younger's artworks, built with React, Three.js (WebGPU), and TypeScript.

## Features

- **3D Timeline Visualization**: Navigate through centuries of artwork using WebGPU-powered rendering
- **Texture Atlas**: Efficient image loading with a pre-generated texture atlas
- **Multi-language Support**: German and English translations
- **Event Categories**: View events related to Cranach Elder, Cranach Younger, Luther, and historical context
- **Responsive Controls**: Mouse wheel horizontal scrolling, pan controls, and zoom functionality
- **Theme Support**: Light and dark mode toggle
- **Sidebar Gallery**: Detailed view of selected artworks and events

## Tech Stack

- **Framework**: React 19 with TypeScript
- **3D Rendering**: Three.js (WebGPU) with React Three Fiber & Drei
- **Styling**: Tailwind CSS 4, styled-components
- **State Management**: Jotai
- **UI Components**: Radix UI (Dialog, Tooltip, Separator)
- **Build Tool**: Vite 7
- **Dev Tools**: Leva (debug controls)

## Installation

1. Clone the repository

```bash
git clone git@github.com:lucascranach/cranach-timeline.git
```

2. Navigate to the directory

```bash
cd cranach-timeline
```

3. Install dependencies

```bash
npm i
```

4. Start the development server

```bash
npm run dev
```

5. Open in browser

Open [http://localhost:5172/timeline](http://localhost:5172/timeline) in your web browser to view the application.

## Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run build:check` | Type-check and build     |
| `npm run preview`     | Preview production build |
| `npm run lint`        | Run ESLint               |

## Project Structure

### Static Assets (`public/`)

```
public/
├── atlas/               # Texture atlas data
│   └── texture_atlas.json
└── events/              # Event data files (JSON)
    ├── cranachElderEvents_de.json
    ├── cranachElderEvents_en.json
    ├── cranachYoungerEvents_de.json
    ├── cranachYoungerEvents_en.json
    ├── historyEvents_de.json
    ├── historyEvents_en.json
    ├── lutherEvents_de.json
    └── lutherEvents_en.json
```

### Source Code (`src/`)

```
src/
├── components/
│   ├── events/          # Event visualization components
│   │   ├── Events.tsx       # Main events container
│   │   ├── EventGroup.tsx   # Event group rendering
│   │   ├── EventPill.tsx    # Individual event pills
│   │   ├── GroupLabel.tsx   # Group labels
│   │   └── GroupOutline.tsx # Group outlines
│   ├── layout/          # Layout components
│   │   ├── app-sidebar.tsx  # Main sidebar component
│   │   ├── ImageCard.tsx    # Image display cards
│   │   └── YearColumn.tsx   # Year column layout
│   ├── timeline/        # Core timeline components
│   │   ├── Atlas.tsx        # Main texture atlas renderer
│   │   ├── Scene.tsx        # Three.js scene setup
│   │   ├── Experience.tsx   # 3D experience wrapper
│   │   ├── ThumbnailMesh.tsx # Artwork thumbnail meshes
│   │   ├── YearLabels.tsx   # Timeline year markers
│   │   ├── DecadeBackgrounds.tsx # Background styling
│   │   └── FocusedYearBeam.tsx # Year highlight effect
│   └── ui/              # Reusable UI components (shadcn/ui)
├── hooks/               # Custom React hooks
│   ├── useAtlasData.ts      # Atlas data loading
│   ├── useAtlasGeometry.ts  # Geometry calculations
│   ├── useAtlasTransforms.ts # Transform handling
│   ├── useEvents.ts         # Event data management
│   ├── useZoomContext.tsx   # Zoom state management
│   ├── useSelectedEventContext.tsx # Selection state
│   └── ...
├── shader/              # WebGPU/TSL shaders
│   └── tsl/
│       ├── AtlasShaderMaterialTSL.tsx
│       └── DecadeDiagonalShaderTSL.tsx
├── store/               # Jotai atoms and state
├── types/               # TypeScript type definitions
│   ├── atlas.ts         # Atlas-related types
│   └── events.ts        # Event-related types
├── utils/               # Utility functions
│   ├── atlasUtils.ts    # Atlas processing utilities
│   ├── eventsUtils.ts   # Event processing utilities
│   └── languageUtils.ts # i18n utilities
├── constants/           # Configuration constants
│   └── eventConfigs.ts  # Event file configurations
└── styles/              # Global styles
    ├── App.css
    ├── globals.css
    └── index.css
```

## Event Categories

The timeline displays events from four categories:

| Category            | Description                                 |
| ------------------- | ------------------------------------------- |
| **Cranach Elder**   | Events related to Lucas Cranach the Elder   |
| **Cranach Younger** | Events related to Lucas Cranach the Younger |
| **Luther**          | Events related to Martin Luther             |
| **History**         | Historical context and events               |

## Controls

- **Horizontal Scroll**: Mouse wheel to navigate through years
- **Pan**: Click and drag to pan the view
- **Zoom**: Use zoom toggle or keyboard controls
- **Event Selection**: Click on event pills to view details

## Environment Variables

| Variable    | Description              |
| ----------- | ------------------------ |
| `VITE_PATH` | Base path for deployment |

## License

This project is part of the [Lucas Cranach Archive](https://lucascranach.org/) project.

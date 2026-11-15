# Mars Terrain Route Planner — Frontend

This folder contains a simple frontend for the Mars route-planning backend you created in Blender/Python.

## 1. Copy your JSON file into this folder

Copy:

    mars_multi_poi_routes.json

from your `C:\Users\prasa\Mars` folder into the same folder as:

    index.html
    styles.css
    app.js

Your folder should look like:

    mars_route_web/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── mars_multi_poi_routes.json

## 2. Open the folder in VS Code

In VS Code:

    File → Open Folder → choose mars_route_web

## 3. Run with Live Server

Recommended:

1. Open VS Code Extensions.
2. Search for `Live Server` by Ritwick Dey.
3. Install it.
4. Right-click `index.html`.
5. Choose `Open with Live Server`.

The page should open in your browser.

Do NOT simply double-click `index.html` in File Explorer because browser security may block JavaScript from loading the JSON file.

## Alternative without Live Server

Open a terminal in the project folder and run:

    python -m http.server 8000

Then visit:

    http://localhost:8000

## What the webpage does

- Start dropdown:
  - Perseverance Landing
  - Western Delta
  - Western Breach
- Destination dropdown
- Route mode:
  - Shortest distance
  - Terrain-aware
- Displays:
  - route distance
  - uphill
  - downhill
  - maximum slope
  - Mars Trek comparison
- Draws the selected route using real latitude/longitude coordinates.
- `Compare both routes` overlays shortest and terrain-aware paths.

## Backend vs frontend

The Python/Blender scripts are the data-processing and routing backend.

`mars_multi_poi_routes.json` is the interface between the backend and the webpage.

For the hackathon prototype, the webpage does not need to rerun Dijkstra live. It reads the routes that your Python engine already calculated. A later version can expose the Python route engine through Flask or FastAPI if you want fully dynamic arbitrary points.
